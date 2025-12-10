import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-middleware";
import { updatePurchaseTransaction, getPurchaseTransaction } from "@/integrations/strapi/purchaseTransaction";
import { createCourseEnrollment, checkUserEnrollment } from "@/integrations/strapi/courseEnrollment";
import { getCourseCourse, updateCourseCourse } from "@/integrations/strapi/courseCourse";

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

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();

    // Capture the order
    const captureResp = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureResp.ok) {
      const text = await captureResp.text();
      return NextResponse.json({ error: `PayPal capture failed: ${text}` }, { status: 500 });
    }

    const captureData = await captureResp.json();
    const purchaseUnit = (captureData.purchase_units || [])[0];
    const payments = purchaseUnit?.payments || {};
    const captures = payments.captures || [];
    const capture = captures[0];
    const customId = purchaseUnit?.custom_id;

    if (!customId) {
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 500 });
    }

    // Fetch transaction
    const transaction = await getPurchaseTransaction(customId);
    if (!transaction) {
      return NextResponse.json({ error: "Purchase transaction not found" }, { status: 404 });
    }

    // Idempotency: if already completed, exit
    if (transaction.state === "completed") {
      return NextResponse.json({ success: true, message: "Already completed" });
    }

    // Update transaction
    await updatePurchaseTransaction(transaction.documentId, {
      state: "completed",
      stripe_charge_id: capture?.id, // reuse field for PayPal capture id
      purchased_at: new Date().toISOString(),
    });

    // Enroll user
    const courseId = transaction.course_course;
    if (courseId && user.id) {
      const enrolled = await checkUserEnrollment(user.id.toString(), courseId.toString());
      if (!enrolled) {
        await createCourseEnrollment({
          user: user.id,
          course_course: courseId,
          enrolled_via: "purchase",
        });

        // Update course metrics
        const course = await getCourseCourse(courseId);
        if (course) {
          await updateCourseCourse(course.documentId, {
            purchase_count: (course.purchase_count || 0) + 1,
            revenue_generated: (course.revenue_generated || 0) + (transaction.amount_paid || 0),
          });

          // Create revenue payout record for instructor
          const instructorId = transaction.instructor;
          if (instructorId) {
            try {
              const { strapi } = await import('@/integrations/strapi/client');
              const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10'); // Default 10% platform fee
              const instructorAmount = (transaction.amount_paid || 0) * (1 - platformFeePercent / 100);
              
              await strapi.post('/api/revenue-payouts', {
                data: {
                  instructor: {
                    connect: [{ id: Number(instructorId) }]
                  },
                  amount: instructorAmount,
                  currency: course.currency?.id ? {
                    connect: [{ id: course.currency.id }]
                  } : undefined,
                  payout_method: 'paypal', // PayPal payment = PayPal payout
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PayPal capture-order error:", error);
    return NextResponse.json({ error: error?.message || "Failed to capture PayPal order" }, { status: 500 });
  }
}
