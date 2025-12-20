# Payment Methods Setup Guide

## Overview

This guide explains how to set up and use payment methods in the eLearning platform, including ABA Bank integration.

## Schema Updates Required

### 1. Update Payment Method Schema in Strapi

Go to **Strapi Admin → Content-Type Builder → Payment Method** and update:

#### Add `aba_bank` to Type Enumeration:
- Current: `credit_card`, `debit_card`, `paypal`, `bank_account`
- **Add**: `aba_bank`

#### Add `aba_payway` to Provider Enumeration:
- Current: `stripe`, `paypal`, `manual`
- **Add**: `aba_payway`

### 2. Update Instructor Schema (if needed)

Ensure Instructor schema has fields for ABA bank accounts:
- `paypal_email` (already exists)
- `preferred_payout_method` (already exists - supports `aba_payway`)
- Bank account fields (already exist)

## Features

### ✅ Payment Method Management

Users can:
- Add multiple payment methods (ABA Bank, other banks, cards)
- Set one payment method as active
- Edit payment method details
- Delete payment methods
- View all payment methods in dashboard

### ✅ Active Payment Method Logic

- **Only ONE payment method can be active per user**
- When activating a payment method, all others are automatically deactivated
- This prevents duplicate active payment methods
- System ensures consistency across the platform

### ✅ ABA Bank Integration

- Users can add ABA Bank accounts as payment methods
- ABA PayWay payment gateway integration
- Secure payment processing
- Automatic enrollment after successful payment

## Dashboard Access

1. Go to **Dashboard → Payment Methods**
2. Click **"Add Payment Method"**
3. Select **"ABA Bank"** as type
4. Fill in account details:
   - Account Number
   - Account Name
   - Bank Name (defaults to "ABA Bank")
   - SWIFT/BIC Code (optional)
   - Country
5. Check **"Set as active"** to activate
6. Click **"Add Payment Method"**

## Payment Flow

### For Course Purchases:

1. User goes to checkout
2. User can pay with:
   - **Stripe** (credit/debit cards)
   - **ABA Bank** (via ABA PayWay)
3. If using ABA Bank:
   - User clicks "Pay with ABA Bank"
   - Redirected to ABA PayWay
   - Completes payment
   - Redirected back to success page
   - Automatically enrolled in course

## API Endpoints

### Payment Methods (User)

- `GET /api/payment-methods?filters[user][id][$eq]={userId}` - Get user's payment methods
- `POST /api/payment-methods` - Create payment method
- `PUT /api/payment-methods/{documentId}` - Update payment method
- `DELETE /api/payment-methods/{documentId}` - Delete payment method

### ABA PayWay

- `POST /api/aba-payway/create-payment` - Create ABA payment
- `POST /api/aba-payway/verify-payment` - Verify payment callback

## Code Implementation

### Payment Method Functions

Located in: `integrations/strapi/paymentMethod.ts`

- `getUserPaymentMethods(userId)` - Get all user payment methods
- `getUserActivePaymentMethod(userId)` - Get active payment method
- `createUserPaymentMethod(userId, data)` - Create new payment method
- `updateUserPaymentMethod(documentId, data)` - Update payment method
- `deleteUserPaymentMethod(documentId)` - Delete payment method
- `deactivateAllUserPaymentMethods(userId)` - Deactivate all (internal)

### Active Payment Method Logic

When creating or updating a payment method with `active: true`:
1. System automatically deactivates all other payment methods for that user
2. Only the new/updated method remains active
3. This ensures only one active payment method per user

## Security

- Payment method data is stored securely in Strapi
- ABA PayWay uses RSA encryption
- All transactions are signed and verified
- SSL encryption for all communications

## Testing

1. Add a payment method in dashboard
2. Verify only one can be active
3. Test ABA PayWay payment flow
4. Verify enrollment after payment

## Troubleshooting

### Payment method not saving?
- Check user authentication
- Verify all required fields are filled
- Check Strapi API permissions

### ABA payment not working?
- Verify environment variables are set
- Check ABA PayWay credentials
- Verify API URL is correct (sandbox vs production)

### Multiple active payment methods?
- This should not happen - system prevents it
- If it does, check `deactivateAllUserPaymentMethods` function
- Manually deactivate duplicates in Strapi Admin

## Next Steps

1. ✅ Update Strapi schema (add `aba_bank` and `aba_payway`)
2. ✅ Add payment methods to dashboard
3. ✅ Test payment flow
4. ✅ Deploy to production

