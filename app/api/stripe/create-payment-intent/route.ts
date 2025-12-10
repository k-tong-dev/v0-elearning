/**
 * Stripe Payment Intent API Route
 * 
 * Required Environment Variables:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (starts with sk_)
 * - PLATFORM_FEE_PERCENT: Platform fee percentage (default: 10)
 * 
 * This endpoint creates a Stripe payment intent for course purchases.
 * Used for countries where Stripe is supported.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyAuthToken } from '@/lib/auth-middleware';
import { getCourseCourse } from '@/integrations/strapi/courseCourse';
import { createPurchaseTransaction } from '@/integrations/strapi/purchaseTransaction';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to continue.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId, amount, currency = 'usd' } = body;

    // Validate input
    if (!courseId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid course ID or amount' },
        { status: 400 }
      );
    }

    // Security: Validate amount is reasonable (prevent manipulation)
    if (amount > 10000) {
      return NextResponse.json(
        { error: 'Amount exceeds maximum allowed' },
        { status: 400 }
      );
    }

    // Fetch course details
    const course = await getCourseCourse(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if course is paid
    if (!course.is_paid) {
      return NextResponse.json(
        { error: 'This course is free and does not require payment' },
        { status: 400 }
      );
    }

    // Use documentId as primary identifier if available, otherwise fallback to numeric ID
    const courseIdentifier = course.documentId || course.id;

    // Check if user already purchased this course
    const { checkUserPurchasedCourse } = await import('@/integrations/strapi/purchaseTransaction');
    const alreadyPurchased = await checkUserPurchasedCourse(user.id.toString(), courseIdentifier);
    if (alreadyPurchased) {
      return NextResponse.json(
        { error: 'You have already purchased this course' },
        { status: 400 }
      );
    }

    // Get instructor ID (use first instructor)
    const instructorId = course.instructors?.[0]?.id || course.instructors?.[0]?.documentId;
    if (!instructorId) {
      return NextResponse.json(
        { error: 'Course instructor not found' },
        { status: 400 }
      );
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Create purchase transaction record in pending state
    const purchaseTransaction = await createPurchaseTransaction({
      user: user.id.toString(),
      instructor: instructorId.toString(),
      course_course: courseIdentifier,
      amount_paid: amount,
      state: 'pending',
    });

    if (!purchaseTransaction) {
      return NextResponse.json(
        { error: 'Failed to create purchase transaction' },
        { status: 500 }
      );
    }

    // Security: Verify course price matches requested amount (prevent price manipulation)
    const originalPrice = course.Price || 0;
    let expectedPrice = originalPrice;

    // Calculate expected price with discount
    if (course.discount_type === "percentage" && course.discount_percentage) {
      expectedPrice = originalPrice * (1 - course.discount_percentage / 100);
    } else if (course.discount_type === "fix_price" && course.discount_fix_price) {
      expectedPrice = course.discount_fix_price;
    }

    // Allow small rounding differences (0.01)
    if (Math.abs(amount - expectedPrice) > 0.01) {
      return NextResponse.json(
        { error: 'Price mismatch. Please refresh and try again.' },
        { status: 400 }
      );
    }

    // Create Stripe Payment Intent with idempotency key
    const idempotencyKey = `course-${courseId}-user-${user.id}-${Date.now()}`;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        userId: user.id.toString(),
        courseId: courseId,
        courseName: course.name || 'Course',
        instructorId: instructorId.toString(),
        purchaseTransactionId: purchaseTransaction.id.toString(),
        purchaseTransactionDocumentId: purchaseTransaction.documentId || '',
        expectedPrice: expectedPrice.toString(),
      },
      description: `Purchase: ${course.name || 'Course'}`,
      receipt_email: user.email || undefined,
    }, {
      idempotencyKey: idempotencyKey.substring(0, 255), // Stripe limit
    });

    // Update purchase transaction with payment intent ID
    const { updatePurchaseTransaction } = await import('@/integrations/strapi/purchaseTransaction');
    await updatePurchaseTransaction(purchaseTransaction.documentId, {
      stripe_payment_intent_id: paymentIntent.id,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      purchaseTransactionId: purchaseTransaction.id,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment intent',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
