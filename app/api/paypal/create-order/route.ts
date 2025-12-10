/**
 * PayPal Create Order API Route
 * 
 * Required Environment Variables:
 * - PAYPAL_CLIENT_ID: Your PayPal application client ID
 * - PAYPAL_CLIENT_SECRET: Your PayPal application client secret
 * - PAYPAL_MODE: "sandbox" or "live" (defaults to sandbox)
 * 
 * This endpoint creates a PayPal order for course purchases.
 * Supports Cambodia and other countries where Stripe is unavailable.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-middleware";
import { getCourseCourse, updateCourseCourse } from "@/integrations/strapi/courseCourse";
import { createPurchaseTransaction, checkUserPurchasedCourse, updatePurchaseTransaction } from "@/integrations/strapi/purchaseTransaction";

const PAYPAL_BASE = process.env.PAYPAL_MODE === "live"
  ? "https://api.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal client credentials are missing");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to obtain PayPal token: ${text}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, currency = "USD" } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
    }

    // Load course
    const course = await getCourseCourse(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!course.is_paid) {
      return NextResponse.json({ error: "Course is free" }, { status: 400 });
    }

    // Verify price and amount
    const originalPrice = course.Price || 0;
    let expectedPrice = originalPrice;

    if (course.discount_type === "percentage" && course.discount_percentage) {
      expectedPrice = originalPrice * (1 - course.discount_percentage / 100);
    } else if (course.discount_type === "fix_price" && course.discount_fix_price) {
      expectedPrice = course.discount_fix_price;
    }

    // Amount safety check
    if (expectedPrice <= 0 || expectedPrice > 10000) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    // Check if already purchased
    const alreadyPurchased = await checkUserPurchasedCourse(user.id.toString(), courseId.toString());
    if (alreadyPurchased) {
      return NextResponse.json({ error: "Course already purchased" }, { status: 400 });
    }

    // Resolve instructor
    const instructorId = course.instructors?.[0]?.documentId || course.instructors?.[0]?.id;
    if (!instructorId) {
      return NextResponse.json({ error: "Instructor not found" }, { status: 400 });
    }

    // Create purchase transaction in pending state
    const purchaseTx = await createPurchaseTransaction({
      user: user.id.toString(),
      instructor: instructorId.toString(),
      course_course: course.id,
      amount_paid: expectedPrice,
      state: "pending",
    });

    if (!purchaseTx) {
      return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
    }

    // Build return/cancel URLs
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    const returnUrl = `${origin}/checkout?paypal_order_id={{ORDER_ID}}&course=${course.id}&success=true`;
    const cancelUrl = `${origin}/checkout?course=${course.id}&cancelled=true`;

    // Create PayPal order
    const accessToken = await getPayPalAccessToken();
    const createOrderResp = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: (course.currency?.code || currency || "USD").toUpperCase(),
              value: expectedPrice.toFixed(2),
            },
            custom_id: purchaseTx.documentId || purchaseTx.id?.toString(),
            description: course.name || "Course purchase",
          },
        ],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    if (!createOrderResp.ok) {
      const text = await createOrderResp.text();
      return NextResponse.json({ error: `PayPal order failed: ${text}` }, { status: 500 });
    }

    const order = await createOrderResp.json();
    const approvalUrl = (order.links || []).find((l: any) => l.rel === "approve")?.href;

    if (!approvalUrl) {
      return NextResponse.json({ error: "Missing PayPal approval link" }, { status: 500 });
    }

    // Store PayPal order id on transaction for reference
    if (order.id) {
      await updatePurchaseTransaction(purchaseTx.documentId, {
        stripe_payment_intent_id: order.id, // reuse field to store PayPal order id
      });
    }

    return NextResponse.json({ approvalUrl, orderId: order.id, purchaseTransactionId: purchaseTx.documentId || purchaseTx.id });
  } catch (error: any) {
    console.error("PayPal create-order error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create PayPal order" }, { status: 500 });
  }
}
