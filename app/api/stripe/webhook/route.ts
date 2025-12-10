import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updatePurchaseTransaction, getPurchaseTransaction } from '@/integrations/strapi/purchaseTransaction';
import { createCourseEnrollment } from '@/integrations/strapi/courseEnrollment';
import { getCourseCourse } from '@/integrations/strapi/courseCourse';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// Get webhook secret from environment
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    console.error('Missing Stripe signature or webhook secret');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata;
  const purchaseTransactionId = metadata.purchaseTransactionDocumentId || metadata.purchaseTransactionId;

  if (!purchaseTransactionId) {
    console.error('Missing purchase transaction ID in payment intent metadata');
    return;
  }

  try {
    // Get purchase transaction
    const transaction = await getPurchaseTransaction(purchaseTransactionId);
    if (!transaction) {
      console.error(`Purchase transaction not found: ${purchaseTransactionId}`);
      return;
    }

    // Check if already processed
    if (transaction.state === 'completed') {
      console.log(`Transaction ${purchaseTransactionId} already completed`);
      return;
    }

    // Update purchase transaction to completed
    await updatePurchaseTransaction(transaction.documentId, {
      state: 'completed',
      stripe_charge_id: paymentIntent.latest_charge as string || undefined,
      purchased_at: new Date().toISOString(),
    });

    // Get course details
    const courseId = metadata.courseId;
    const userId = metadata.userId;

    if (courseId && userId) {
      // Check if enrollment already exists
      const { checkUserEnrollment } = await import('@/integrations/strapi/courseEnrollment');
      const existingEnrollment = await checkUserEnrollment(userId, courseId);

      if (!existingEnrollment) {
        // Create course enrollment
        await createCourseEnrollment({
          user: userId,
          course_course: courseId,
          enrolled_via: 'purchase',
        });

        // Update course purchase count
        const course = await getCourseCourse(courseId);
        if (course) {
          const { updateCourseCourse } = await import('@/integrations/strapi/courseCourse');
          const amountPaid = transaction.amount_paid || 0;
          await updateCourseCourse(course.documentId, {
            purchase_count: (course.purchase_count || 0) + 1,
            revenue_generated: (course.revenue_generated || 0) + amountPaid,
          });

          // Create revenue payout record for instructor
          const instructorId = metadata.instructorId;
          if (instructorId) {
            try {
              const { strapi } = await import('@/integrations/strapi/client');
              const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10'); // Default 10% platform fee
              const instructorAmount = amountPaid * (1 - platformFeePercent / 100);
              
              await strapi.post('/api/revenue-payouts', {
                data: {
                  instructor: {
                    connect: [{ id: Number(instructorId) }]
                  },
                  amount: instructorAmount,
                  currency: {
                    connect: course.currency?.id ? [{ id: course.currency.id }] : undefined
                  },
                  payout_method: 'stripe', // Stripe payment = Stripe payout
                  state: 'pending',
                  transactions: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          text: `Course: ${course.name || 'Unknown'} - Transaction: ${transaction.id}`
                        }
                      ]
                    }
                  ]
                }
              });
            } catch (payoutError) {
              console.error('Error creating revenue payout:', payoutError);
              // Don't fail the payment if payout record creation fails
            }
          }
        }
      }
    }

    console.log(`Payment succeeded for transaction ${purchaseTransactionId}`);
  } catch (error: any) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata;
  const purchaseTransactionId = metadata.purchaseTransactionDocumentId || metadata.purchaseTransactionId;

  if (!purchaseTransactionId) {
    console.error('Missing purchase transaction ID in payment intent metadata');
    return;
  }

  try {
    const transaction = await getPurchaseTransaction(purchaseTransactionId);
    if (!transaction) {
      console.error(`Purchase transaction not found: ${purchaseTransactionId}`);
      return;
    }

    // Update purchase transaction to failed
    await updatePurchaseTransaction(transaction.documentId, {
      state: 'failed',
    });

    console.log(`Payment failed for transaction ${purchaseTransactionId}`);
  } catch (error: any) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    console.error('Missing payment intent ID in charge');
    return;
  }

  try {
    // Get payment intent to access metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const metadata = paymentIntent.metadata;
    const purchaseTransactionId = metadata.purchaseTransactionDocumentId || metadata.purchaseTransactionId;

    if (!purchaseTransactionId) {
      console.error('Missing purchase transaction ID in payment intent metadata');
      return;
    }

    const transaction = await getPurchaseTransaction(purchaseTransactionId);
    if (!transaction) {
      console.error(`Purchase transaction not found: ${purchaseTransactionId}`);
      return;
    }

    // Update purchase transaction to refunded
    await updatePurchaseTransaction(transaction.documentId, {
      state: 'refunded',
      refunded_at: new Date().toISOString(),
    });

    console.log(`Refund processed for transaction ${purchaseTransactionId}`);
  } catch (error: any) {
    console.error('Error handling refund:', error);
    throw error;
  }
}

// Disable body parsing for webhook route
export const runtime = 'nodejs';
