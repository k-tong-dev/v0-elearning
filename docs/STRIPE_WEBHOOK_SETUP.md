# Stripe Webhook Setup Guide

## Why Webhooks Are Essential

Webhooks ensure that payment processing is **reliable and complete**, even if:
- User closes browser during payment
- Network connection is lost
- Redirect fails
- Payment succeeds but frontend doesn't receive confirmation

## Setup Steps

### 1. Get Your Webhook Endpoint URL

**For Development (Local):**
- Use Stripe CLI to forward webhooks to your local server
- Install Stripe CLI: https://stripe.com/docs/stripe-cli
- Run: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

**For Production:**
- Your webhook URL: `https://yourdomain.com/api/stripe/webhook`
- Must be HTTPS (Stripe requires it)

### 2. Configure Webhook in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL:
   - Development: Use Stripe CLI (see above)
   - Production: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)

### 3. Add Webhook Secret to Environment Variables

Add to your `.env.local` (development) or production environment:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 4. Test Your Webhook

**Using Stripe CLI (Recommended for Development):**

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger a test event
stripe trigger payment_intent.succeeded
```

**Using Stripe Dashboard:**
1. Go to Webhooks → Your endpoint
2. Click "Send test webhook"
3. Select `payment_intent.succeeded`
4. Check your server logs to verify it's received

## What Your Webhook Does

Your webhook handler (`/api/stripe/webhook/route.ts`) automatically:

1. **On Payment Success** (`payment_intent.succeeded`):
   - ✅ Updates purchase transaction to `completed`
   - ✅ Creates course enrollment for the user
   - ✅ Updates course purchase count
   - ✅ Updates course revenue generated
   - ✅ Creates revenue payout record for instructor

2. **On Payment Failure** (`payment_intent.payment_failed`):
   - ✅ Updates purchase transaction to `failed`

3. **On Refund** (`charge.refunded`):
   - ✅ Updates purchase transaction to `refunded`
   - ✅ Sets refund timestamp

## Verification

After setup, verify webhook is working:

1. Make a test purchase
2. Check Stripe Dashboard → Webhooks → Your endpoint → Recent events
3. Should see `payment_intent.succeeded` event with status "Succeeded"
4. Check your database:
   - Purchase transaction should be `completed`
   - Course enrollment should be created
   - Course stats should be updated

## Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook URL is correct**
   - Must be publicly accessible (use ngrok for local testing)
   - Must be HTTPS in production

2. **Check webhook secret is set**
   ```bash
   echo $STRIPE_WEBHOOK_SECRET
   ```

3. **Check Stripe Dashboard**
   - Go to Webhooks → Your endpoint
   - Check "Recent events" for delivery status
   - Check for error messages

4. **Check server logs**
   - Look for webhook processing errors
   - Check for signature verification failures

### Common Errors

**"Missing signature"**
- Webhook secret not set in environment variables
- Solution: Add `STRIPE_WEBHOOK_SECRET` to `.env.local`

**"Webhook signature verification failed"**
- Webhook secret doesn't match
- Solution: Copy the correct signing secret from Stripe Dashboard

**"Purchase transaction not found"**
- Payment intent metadata missing transaction ID
- Solution: Check payment intent creation includes metadata

## Production Checklist

- [ ] Webhook endpoint is HTTPS
- [ ] `STRIPE_WEBHOOK_SECRET` is set in production environment
- [ ] Webhook events are configured in Stripe Dashboard
- [ ] Test webhook delivery in Stripe Dashboard
- [ ] Monitor webhook logs for errors
- [ ] Set up webhook retry notifications (Stripe Dashboard → Webhooks → Settings)

## Security Notes

- ✅ Webhook signature verification is implemented
- ✅ Webhook secret is stored in environment variables (never commit to git)
- ✅ Webhook endpoint validates Stripe signatures before processing

## Alternative: Without Webhooks (Not Recommended)

If you don't use webhooks, you would need to:
- Handle enrollment creation in the redirect callback (unreliable)
- Manually check payment status (inefficient)
- Handle refunds manually (error-prone)

**Webhooks are the industry standard and highly recommended for production.**

