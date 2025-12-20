/**
 * ABA PayWay Payment Verification
 * Handles payment callback from ABA PayWay
 */

import { NextRequest, NextResponse } from "next/server"
import { updatePurchaseTransaction } from "@/integrations/strapi/purchaseTransaction"
import { createCourseEnrollment, checkUserEnrollment } from "@/integrations/strapi/courseEnrollment"
import { getCourseCourse, updateCourseCourse } from "@/integrations/strapi/courseCourse"
import crypto from "crypto"

const ABA_PUBLIC_KEY = process.env.ABA_PUBLIC_KEY || "3a44612846f0b6a537c0e93f549808d3369f3433"

/**
 * Verify ABA PayWay payment signature
 */
function verifySignature(data: any, signature: string): boolean {
  try {
    const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCxM5GdH8i6weJr2lyEqA4WtsZj
WUyrQLwhW8LOnuibskCrjFiq/vLwWlNB5zdjVqefYFWDCEKdYPySdvazEMP3YSez
sKAORG3GMIweRXzOyYfnGVCpt1IEjM71vzxnrCWO44gMkHO52+BpI7qOamdv4zfZ
flssBGukf7nGP//YnQIDAQAB
-----END PUBLIC KEY-----`
    
    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(JSON.stringify(data))
    verify.end()
    return verify.verify(publicKey, signature, 'base64')
  } catch (error) {
    console.error("Error verifying signature:", error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId, status, amount, currency, signature, purchaseTransactionId } = body

    if (!transactionId || !status || !purchaseTransactionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify signature
    if (!verifySignature({ transactionId, status, amount }, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Find purchase transaction by transaction ID stored in stripe_payment_intent_id
    // Note: We're reusing this field to store ABA transaction ID
    const transaction = await updatePurchaseTransaction(purchaseTransactionId, {
      state: status === "success" ? "completed" : "failed",
      stripe_charge_id: transactionId, // Store ABA transaction ID
      purchased_at: status === "success" ? new Date().toISOString() : undefined,
    })

    if (status === "success") {
      // Get transaction details to enroll user
      // Note: You may need to fetch the transaction from Strapi to get course and user IDs
      // For now, we'll assume they're passed in the callback
      const { courseId, userId } = body

      if (courseId && userId) {
        // Enroll user in course
        const enrolled = await checkUserEnrollment(userId.toString(), courseId.toString())
        if (!enrolled) {
          await createCourseEnrollment({
            user: userId,
            course_course: courseId,
            enrolled_via: "purchase",
          })

          // Update course metrics
          const course = await getCourseCourse(courseId)
          if (course) {
            await updateCourseCourse(course.documentId, {
              purchase_count: (course.purchase_count || 0) + 1,
              revenue_generated: (course.revenue_generated || 0) + parseFloat(amount || "0"),
            })
          }
        }
      }
    }

    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    console.error("ABA PayWay verify payment error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to verify payment" },
      { status: 500 }
    )
  }
}

