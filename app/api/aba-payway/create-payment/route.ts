/**
 * ABA PayWay Payment Gateway Integration
 * 
 * Environment Variables Required:
 * - ABA_MERCHANT_ID: Merchant ID from ABA PayWay
 * - ABA_PUBLIC_KEY: Public key from ABA PayWay
 * - ABA_PRIVATE_KEY: RSA Private Key from ABA PayWay
 * - ABA_API_URL: API endpoint URL (sandbox or production)
 * 
 * Documentation: https://payway.com.kh/
 */

import { NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/auth-middleware"
import { getCourseCourse } from "@/integrations/strapi/courseCourse"
import { createPurchaseTransaction, checkUserPurchasedCourse, updatePurchaseTransaction } from "@/integrations/strapi/purchaseTransaction"
import { getUserSubscriptionTax } from "@/integrations/strapi/subscription"
import crypto from "crypto"

const ABA_MERCHANT_ID = process.env.ABA_MERCHANT_ID || "ec461766"
const ABA_PUBLIC_KEY = process.env.ABA_PUBLIC_KEY || "3a44612846f0b6a537c0e93f549808d3369f3433"
const ABA_PRIVATE_KEY = process.env.ABA_PRIVATE_KEY || ""
const ABA_API_URL = process.env.ABA_API_URL || "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase"

/**
 * Generate ABA PayWay transaction hash
 */
function generateTransactionHash(transactionId: string, amount: number, currency: string): string {
  const data = `${transactionId}${amount}${currency}${ABA_MERCHANT_ID}${ABA_PUBLIC_KEY}`
  return crypto.createHash('sha512').update(data).digest('hex')
}

/**
 * Sign data with RSA private key
 */
function signData(data: string): string {
  try {
    const privateKey = ABA_PRIVATE_KEY.replace(/\\n/g, '\n')
    const sign = crypto.createSign('RSA-SHA256')
    sign.update(data)
    sign.end()
    return sign.sign(privateKey, 'base64')
  } catch (error) {
    console.error("Error signing data:", error)
    throw new Error("Failed to sign payment data")
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { courseId, amount, currency = "USD" } = await request.json()

    if (!courseId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid course ID or amount" }, { status: 400 })
    }

    // Fetch course details
    const course = await getCourseCourse(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (!course.is_paid) {
      return NextResponse.json({ error: "This course is free and does not require payment" }, { status: 400 })
    }

    // Check if already purchased
    const courseIdentifier = course.documentId || course.id
    const alreadyPurchased = await checkUserPurchasedCourse(user.id.toString(), courseIdentifier)
    if (alreadyPurchased) {
      return NextResponse.json({ error: "You have already purchased this course" }, { status: 400 })
    }

    // Get instructor ID
    const instructorId = course.instructors?.[0]?.id || course.instructors?.[0]?.documentId
    if (!instructorId) {
      return NextResponse.json({ error: "Course instructor not found" }, { status: 400 })
    }

    // Get user's subscription tax (platform commission)
    const taxPercentage = await getUserSubscriptionTax(user.id.toString())
    
    // Calculate amounts
    const coursePrice = amount // Base course price
    const taxAmount = coursePrice * (taxPercentage / 100)
    const totalAmount = coursePrice + taxAmount

    // Create purchase transaction in pending state
    const purchaseTx = await createPurchaseTransaction({
      user: user.id.toString(),
      instructor: instructorId.toString(),
      course_course: courseIdentifier,
      amount_paid: totalAmount,
      state: "pending",
    })

    if (!purchaseTx) {
      return NextResponse.json({ error: "Failed to create purchase transaction" }, { status: 500 })
    }

    // Generate transaction ID
    const transactionId = `TXN-${purchaseTx.id}-${Date.now()}`
    const transactionHash = generateTransactionHash(transactionId, totalAmount, currency)

    // Prepare payment data
    const paymentData = {
      tran_id: transactionId,
      amount: totalAmount.toFixed(2),
      currency: currency.toUpperCase(),
      items: [
        {
          name: course.name || "Course Purchase",
          qty: 1,
          price: coursePrice.toFixed(2),
        }
      ],
      first_name: user.username || user.email?.split('@')[0] || "Customer",
      last_name: "",
      email: user.email || "",
      phone: "",
      hash: transactionHash,
    }

    // Sign the payment data
    const signature = signData(JSON.stringify(paymentData))

    // Store transaction ID in purchase transaction
    await updatePurchaseTransaction(purchaseTx.documentId, {
      stripe_payment_intent_id: transactionId, // Reuse field to store ABA transaction ID
    })

    // Return payment data for frontend to submit to ABA PayWay
    return NextResponse.json({
      success: true,
      transactionId,
      purchaseTransactionId: purchaseTx.documentId || purchaseTx.id,
      paymentData: {
        ...paymentData,
        signature,
      },
      abaConfig: {
        merchantId: ABA_MERCHANT_ID,
        publicKey: ABA_PUBLIC_KEY,
        apiUrl: ABA_API_URL,
      },
      coursePrice,
      taxAmount,
      taxPercentage,
      totalAmount,
    })
  } catch (error: any) {
    console.error("ABA PayWay create payment error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to create ABA PayWay payment" },
      { status: 500 }
    )
  }
}

