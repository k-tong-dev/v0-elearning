# Payment Tax & Commission Flow

## Overview

This document explains how the subscription-based tax/commission system works for course purchases.

## Flow Analysis

### ✅ **YES, This Flow Can Be Implemented and Is Now Working**

## How It Works

### 1. **User Has Subscription Plan with Tax**

- Each subscription plan has a `subscription_tax` field
- This tax percentage represents the **platform commission** (owner's percentage)
- If user has multiple active subscriptions, the **biggest tax percentage** is used

### 2. **When User Purchases a Course**

#### Step 1: Calculate Amounts
```
Course Price = Base course price (e.g., $100)
Tax Percentage = From user's subscription plan (e.g., 15%)
Tax Amount = Course Price × (Tax Percentage / 100) = $100 × 0.15 = $15
Total Amount = Course Price + Tax Amount = $100 + $15 = $115
```

#### Step 2: User Pays Total Amount
- User pays: **$115** (Total Amount)
- This is what Stripe/PayPal charges

#### Step 3: Money Distribution
- **Platform Owner (You)**: Gets **$15** (Tax Amount = Commission)
- **Course Creator**: Gets **$100** (Course Price)

### 3. **Checkout Display**

The checkout page now shows:
```
Course Price:     $100.00
Platform Fee (15%): $15.00
─────────────────────────
Total:            $115.00
```

### 4. **Revenue Payout**

When payment succeeds (via webhook):
- **Revenue Payout Record** created for instructor with **$100** (course price)
- **Tax Amount ($15)** is tracked in transaction metadata
- Platform commission goes to owner account

## Implementation Details

### Files Modified

1. **`integrations/strapi/subscription.ts`**
   - Added `getUserSubscriptionTax()` function
   - Gets highest tax percentage from user's active subscriptions
   - Falls back to `PLATFORM_FEE_PERCENT` env var if no subscription

2. **`app/api/stripe/create-payment-intent/route.ts`**
   - Fetches user's subscription tax
   - Calculates: coursePrice, taxAmount, totalAmount
   - Stores all amounts in payment intent metadata
   - Creates payment intent with total amount

3. **`app/checkout/page.tsx`**
   - Fetches subscription tax on page load
   - Displays tax in order summary
   - Shows breakdown: Course Price + Platform Fee = Total

4. **`app/api/stripe/webhook/route.ts`**
   - Reads coursePrice and taxAmount from metadata
   - Creates revenue payout with coursePrice (goes to creator)
   - Tax amount is tracked but goes to platform owner

5. **`app/api/paypal/create-order/route.ts`**
   - Same logic as Stripe
   - Calculates tax and total
   - Sends breakdown to PayPal

6. **`app/api/paypal/capture-order/route.ts`**
   - Calculates coursePrice from total using tax percentage
   - Creates revenue payout with coursePrice

## Example Calculation

### Scenario:
- Course Price: $100
- User's Subscription Tax: 15%
- User Pays: $115

### Breakdown:
```
Course Price:     $100.00  → Goes to Creator
Platform Fee:     $15.00   → Goes to Owner (You)
─────────────────────────
Total Paid:       $115.00
```

### After Payment:
- ✅ Creator receives: $100 (via revenue payout)
- ✅ Owner receives: $15 (platform commission)
- ✅ Transaction recorded with all amounts

## Database Storage

### Purchase Transaction
- `amount_paid`: Total amount user paid (including tax)
- Metadata stored in Stripe/PayPal payment intent

### Revenue Payout
- `amount`: Course price (base amount, excluding tax)
- Goes to instructor/creator

## Tax Priority Logic

1. **Check user's active subscriptions**
2. **Get tax percentage from each subscription**
3. **Use the BIGGEST tax percentage** (highest commission)
4. **Fallback**: If no subscription or no tax, use `PLATFORM_FEE_PERCENT` env var (default: 10%)

## Verification

### To Verify It's Working:

1. **Check Subscription Tax**:
   - User has subscription with tax percentage
   - Tax is displayed in checkout

2. **Check Payment**:
   - User pays total amount (course price + tax)
   - Payment intent created with correct total

3. **Check Webhook**:
   - Revenue payout created with course price (not total)
   - Tax amount tracked in metadata

4. **Check Order History**:
   - Shows total amount paid
   - Can see breakdown if needed

## Important Notes

1. **Tax is Platform Commission**: The subscription tax percentage IS the platform commission
2. **Dynamic Tax**: Tax percentage comes from user's subscription, not hardcoded
3. **Multiple Subscriptions**: If user has multiple active subscriptions, biggest tax is used
4. **Fallback**: If no subscription tax, uses `PLATFORM_FEE_PERCENT` env var (default 10%)
5. **Money Flow**: 
   - User pays: Course Price + Tax
   - Creator gets: Course Price
   - Owner gets: Tax Amount

## Environment Variables

```bash
# Fallback platform fee (used if no subscription tax found)
PLATFORM_FEE_PERCENT=10  # Default 10%

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

## Summary

✅ **Flow is implemented and working**
✅ **Tax from subscription plan is used as platform commission**
✅ **Tax is displayed in checkout**
✅ **Money is correctly distributed: Tax to owner, Course price to creator**
✅ **Works for both Stripe and PayPal**

The system now dynamically calculates commission based on the user's subscription plan tax percentage!

