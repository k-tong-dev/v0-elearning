/**
 * Payout Processing API Route
 * 
 * Required Environment Variables:
 * - PAYPAL_CLIENT_ID: For PayPal payouts
 * - PAYPAL_CLIENT_SECRET: For PayPal payouts
 * - PAYPAL_MODE: "sandbox" or "live"
 * - STRIPE_SECRET_KEY: For Stripe Connect payouts
 * - PLATFORM_FEE_PERCENT: Platform fee percentage (default: 10)
 * 
 * This endpoint processes pending revenue payouts to instructors.
 * Supports multiple payout methods: PayPal, Stripe Connect, Bank Transfer, Manual
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-middleware";
import { strapi } from "@/integrations/strapi/client";

// PayPal Payout API integration
const PAYPAL_BASE = process.env.PAYPAL_MODE === "live"
  ? "https://api.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials missing");
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
    throw new Error("Failed to get PayPal token");
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Process instructor payouts
 * This endpoint processes pending revenue payouts to instructors
 * Supports: PayPal, Stripe Connect, Bank Transfer, Manual
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role check here
    // if (user.role !== 'admin') {
    //   return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    // }

    const { payoutId, instructorId } = await request.json();

    // Get pending payouts
    let payoutsToProcess;
    if (payoutId) {
      const response = await strapi.get(`/api/revenue-payouts/${payoutId}?populate=*`);
      payoutsToProcess = [response.data.data];
    } else if (instructorId) {
      const response = await strapi.get(
        `/api/revenue-payouts?filters[instructor][id][$eq]=${instructorId}&filters[state][$eq]=pending&populate=*`
      );
      payoutsToProcess = response.data.data || [];
    } else {
      // Process all pending payouts
      const response = await strapi.get(
        `/api/revenue-payouts?filters[state][$eq]=pending&populate=*`
      );
      payoutsToProcess = response.data.data || [];
    }

    if (!payoutsToProcess || payoutsToProcess.length === 0) {
      return NextResponse.json({ message: "No pending payouts found" });
    }

    const results = [];

    for (const payout of payoutsToProcess) {
      try {
        const instructor = payout.instructor;
        if (!instructor) {
          results.push({
            payoutId: payout.id,
            status: "failed",
            error: "Instructor not found",
          });
          continue;
        }

        const payoutMethod = payout.payout_method || instructor.preferred_payout_method || "paypal";
        const amount = payout.amount || 0;
        const currency = payout.currency?.code || "USD";

        // Update payout state to processing
        await strapi.put(`/api/revenue-payouts/${payout.documentId}`, {
          data: {
            state: "processing",
            requested_at: new Date().toISOString(),
          },
        });

        let payoutResult;

        switch (payoutMethod) {
          case "paypal":
            payoutResult = await processPayPalPayout(instructor, amount, currency, payout);
            break;

          case "stripe":
            payoutResult = await processStripePayout(instructor, amount, currency, payout);
            break;

          case "bank_transfer":
          case "manual":
            // Mark as completed - manual processing required
            payoutResult = {
              success: true,
              method: "manual",
              message: "Marked for manual bank transfer",
            };
            break;

          default:
            throw new Error(`Unsupported payout method: ${payoutMethod}`);
        }

        if (payoutResult.success) {
          await strapi.put(`/api/revenue-payouts/${payout.documentId}`, {
            data: {
              state: "completed",
              processed_at: new Date().toISOString(),
              stripe_payout_id: payoutResult.payoutId || undefined,
            },
          });

          results.push({
            payoutId: payout.id,
            status: "completed",
            method: payoutMethod,
            amount,
            currency,
          });
        } else {
          throw new Error(payoutResult.error || "Payout failed");
        }
      } catch (error: any) {
        console.error(`Error processing payout ${payout.id}:`, error);

        // Mark as failed
        await strapi.put(`/api/revenue-payouts/${payout.documentId}`, {
          data: {
            state: "failed",
          },
        });

        results.push({
          payoutId: payout.id,
          status: "failed",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("Payout processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payouts" },
      { status: 500 }
    );
  }
}

async function processPayPalPayout(
  instructor: any,
  amount: number,
  currency: string,
  payout: any
): Promise<{ success: boolean; payoutId?: string; error?: string }> {
  try {
    const paypalEmail = instructor.paypal_email;
    if (!paypalEmail) {
      return { success: false, error: "PayPal email not configured for instructor" };
    }

    const accessToken = await getPayPalAccessToken();

    // Create PayPal payout batch
    const payoutResponse = await fetch(`${PAYPAL_BASE}/v1/payments/payouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: `payout_${payout.id}_${Date.now()}`,
          email_subject: "Course Revenue Payout",
          email_message: `You have received ${amount} ${currency} from course sales.`,
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: {
              value: amount.toFixed(2),
              currency: currency.toUpperCase(),
            },
            receiver: paypalEmail,
            note: "Course revenue payout",
            sender_item_id: `course_payout_${payout.id}`,
          },
        ],
      }),
    });

    if (!payoutResponse.ok) {
      const errorText = await payoutResponse.text();
      return { success: false, error: `PayPal payout failed: ${errorText}` };
    }

    const payoutData = await payoutResponse.json();
    return {
      success: true,
      payoutId: payoutData.batch_header?.payout_batch_id,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function processStripePayout(
  instructor: any,
  amount: number,
  currency: string,
  payout: any
): Promise<{ success: boolean; payoutId?: string; error?: string }> {
  try {
    // Check if instructor has Stripe Connect account
    const stripeAccountId = instructor.stripe_account_id;
    if (!stripeAccountId) {
      return { success: false, error: "Stripe Connect account not configured" };
    }

    // Import Stripe dynamically
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2024-12-18.acacia",
    });

    // Create transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      destination: stripeAccountId,
      metadata: {
        payout_id: payout.id.toString(),
        instructor_id: instructor.id.toString(),
      },
    });

    return {
      success: true,
      payoutId: transfer.id,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
