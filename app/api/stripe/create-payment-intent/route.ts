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
import { getUserSubscriptionTax } from '@/integrations/strapi/subscription';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'Payment processing is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Verify authentication
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to continue.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { courseId, amount, currency = 'usd' } = body;
    
    // Normalize and validate currency code
    // Stripe requires 3-letter ISO currency codes (lowercase)
    if (currency) {
      const normalizedCurrency = String(currency).toLowerCase().trim();
      
      // Map common currency symbols to codes
      const currencyMap: Record<string, string> = {
        '$': 'usd',
        'us$': 'usd',
        '€': 'eur',
        '£': 'gbp',
        '¥': 'jpy',
        'c$': 'cad',
        'a$': 'aud',
      };
      
      // Check if it's a symbol that needs mapping
      if (currencyMap[normalizedCurrency]) {
        currency = currencyMap[normalizedCurrency];
      } else if (/^[a-z]{3}$/.test(normalizedCurrency)) {
        // Valid 3-letter currency code format
        currency = normalizedCurrency;
      } else {
        // Invalid currency format - log and use default
        console.warn(`Invalid currency code "${currency}" (received), defaulting to "usd"`);
        currency = 'usd';
      }
    } else {
      currency = 'usd';
    }
    
    // Final validation: ensure currency is a valid Stripe-supported currency
    // This is a basic check - Stripe will reject invalid currencies anyway
    if (!/^[a-z]{3}$/.test(currency)) {
      console.error(`Currency validation failed: "${currency}" is not a valid format`);
      currency = 'usd';
    }

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

    // Get user's subscription tax (platform commission percentage)
    // This tax is used as the platform commission
    const taxPercentage = await getUserSubscriptionTax(user.id.toString());
    
    // Calculate amounts:
    // - coursePrice: Base course price (goes to creator)
    // - taxAmount: Platform commission (goes to owner/system)
    // - totalAmount: What user pays (coursePrice + taxAmount)
    const coursePrice = amount; // This is the base course price
    const taxAmount = coursePrice * (taxPercentage / 100);
    const totalAmount = coursePrice + taxAmount;

    // Convert total amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(totalAmount * 100);

    // Create purchase transaction record in pending state
    let purchaseTransaction;
    try {
      purchaseTransaction = await createPurchaseTransaction({
        user: user.id.toString(),
        instructor: instructorId.toString(),
        course_course: courseIdentifier,
        amount_paid: totalAmount, // Store total amount paid (including tax)
        state: 'pending',
      });

      if (!purchaseTransaction) {
        return NextResponse.json(
          { error: 'Failed to create purchase transaction: No transaction returned' },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error('Error in createPurchaseTransaction:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create purchase transaction',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }

    // Security: Verify course price matches requested amount (prevent price manipulation)
    // Note: 'amount' parameter is the base course price (before tax)
    const originalPrice = course.Price || 0;
    let expectedCoursePrice = originalPrice;

    // Calculate expected price with discount
    if (course.discount_type === "percentage" && course.discount_percentage) {
      expectedCoursePrice = originalPrice * (1 - course.discount_percentage / 100);
    } else if (course.discount_type === "fix_price" && course.discount_fix_price) {
      expectedCoursePrice = course.discount_fix_price;
    }

    // Allow small rounding differences (0.01) for course price
    if (Math.abs(amount - expectedCoursePrice) > 0.01) {
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
        coursePrice: coursePrice.toString(), // Base course price (goes to creator)
        taxPercentage: taxPercentage.toString(), // Platform commission percentage
        taxAmount: taxAmount.toString(), // Platform commission amount (goes to owner)
        totalAmount: totalAmount.toString(), // Total amount user pays
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
      coursePrice: coursePrice, // Base course price
      taxPercentage: taxPercentage, // Platform commission percentage
      taxAmount: taxAmount, // Platform commission amount
      totalAmount: totalAmount, // Total amount user pays
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
