# ABA PayWay Integration Guide

## Overview

This document explains the ABA PayWay payment gateway integration for the eLearning platform.

## Environment Variables

Add these to your `.env.local` file:

```bash
# ABA PayWay Credentials
ABA_MERCHANT_ID=ec461766
ABA_PUBLIC_KEY=3a44612846f0b6a537c0e93f549808d3369f3433
ABA_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
MIICWwIBAAKBgQCFON7CfVee3tnZ2mUuYHU3I46OxAxt+XPLfHHhmbHwz98Vq9pN
cqqdcrLxBzgbECN7pnR4pAFoUSC8hgwz3DSOf3O4eOgA+zMZ7eY+mrSj4EDx+A1e
r5qawpe8ashgZ+aQrUn9yCkSKQqaIn/TGPttHgnWUfjV7VygrSudNQacXQIDAQAB
An9g+0Q95/cvDTk+ymEVPCz1RK52NbpoQKZT++cJcBNTKX3RQWBIM1H78hzFXuz0
EeInODp9mG5y5DfuHvKqD2VBNcFVrV2faTE358NBJqC5fpF9nfA+BEWeysD09DKB
IIW7sOrK7JJ+W7Cb0Rn1O+hv/gE3J0e6wMFycj7RofqLAkEAr9IPc/VVXOcTKWlA
sSkRHJhqqtjJsFo0NX07KWX6F1ULybLkth2N+M2xezqfK/Fl8uaRM2tF3MQ25G1l
9g4vcwJBAMH5tyiXB+gp2AlfX4jE6b5JWT6p7XHTSfP6byBCMHU3cJVXN8dMaDtM
ZsCHfRPVig9JNHjRHSuM5K3CcaVicO8CQH6fC535S3bSu8wRDxQHfVlYs0lDQ02M
SRlUjSztUkVHbGvgODKn6j0K9gzHVSayfTeHsX6UfQXXEalE2C9yW90CQQCf+HE0
6Fl8/gVMtXr0MHEUnSkcpMdNuBKlQ0OiNvP/t1kB0IwPsNPFE50p6pMcaF8TfCvp
94s2/1sYceOHoUfBAkEApWTIWnO0841C30v1e62KoJ/q90aftpIm54h7WBf2zfme
XWjmYKtcbwn7Yf/P0cC945IsWOEBWZsQ0l3knEW5Bw==
-----END RSA PRIVATE KEY-----

# ABA PayWay API URL (Sandbox)
ABA_API_URL=https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase

# For Production, use:
# ABA_API_URL=https://checkout.payway.com.kh/api/payment-gateway/v1/payments/purchase
```

## Payment Flow

### 1. User Initiates Payment

When user clicks "Pay with ABA Bank" on checkout:
- Frontend calls `/api/aba-payway/create-payment`
- Backend creates purchase transaction
- Calculates tax (from user's subscription)
- Generates transaction hash and signature
- Returns payment data

### 2. Redirect to ABA PayWay

- User is redirected to ABA PayWay checkout page
- User completes payment on ABA PayWay
- ABA PayWay redirects back to your site

### 3. Payment Verification

- ABA PayWay sends callback to `/api/aba-payway/verify-payment`
- Backend verifies signature
- Updates purchase transaction status
- Enrolls user in course
- Updates course metrics

## API Routes

### POST `/api/aba-payway/create-payment`

Creates a payment request and returns payment data.

**Request:**
```json
{
  "courseId": "course-id",
  "amount": 100.00,
  "currency": "USD"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "TXN-123-1234567890",
  "purchaseTransactionId": "transaction-doc-id",
  "paymentData": {
    "tran_id": "TXN-123-1234567890",
    "amount": "115.00",
    "currency": "USD",
    "hash": "...",
    "signature": "..."
  },
  "abaConfig": {
    "merchantId": "...",
    "publicKey": "...",
    "apiUrl": "..."
  }
}
```

### POST `/api/aba-payway/verify-payment`

Verifies payment callback from ABA PayWay.

**Request:**
```json
{
  "transactionId": "TXN-123-1234567890",
  "status": "success",
  "amount": "115.00",
  "currency": "USD",
  "signature": "...",
  "purchaseTransactionId": "...",
  "courseId": "...",
  "userId": "..."
}
```

## Security

- All payment data is signed with RSA private key
- Signatures are verified on callback
- Transaction hashes prevent tampering
- SSL encryption for all communications

## Testing

1. Use sandbox credentials (provided)
2. Test with small amounts
3. Verify callback handling
4. Check transaction status updates

## Production Deployment

1. Update `ABA_API_URL` to production endpoint
2. Use production credentials from ABA PayWay
3. Update public/private keys
4. Test thoroughly before going live

## Support

For ABA PayWay support:
- Documentation: https://payway.com.kh/
- Contact: ABA PayWay support team

