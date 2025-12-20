# Schema Updates Required for Payment Methods

## Current Schema Issues

Based on the actual schema in Strapi, here are the updates needed:

## 1. Update Payment Method Schema

### Location: Strapi Admin → Content-Type Builder → Payment Method

### A. Update `type` Enumeration

**Current values:**
- `credit_card`
- `debit_card`
- `paypal`
- `bank_account`

**Action Required:**
- ✅ Keep existing values
- ✅ No need to add `aba_bank` - use `bank_account` with provider `manual` or create new provider

### B. Update `provider` Enumeration

**Current values:**
- `stripe`
- `paypal`
- `manual`

**Action Required:**
- ✅ Keep existing values
- ✅ For ABA Bank, use `provider: "manual"` with `type: "bank_account"`
- ✅ OR add `aba_payway` to provider enum if you want separate provider

**If you want to add `aba_payway` provider:**
1. Go to Payment Method schema
2. Edit `provider` field
3. Add `aba_payway` to the enum list
4. Save

### C. Field Usage

**Important:**
- `default` (boolean) - Used to mark the default payment method (only one should be true)
- `active` (boolean) - Used for active/inactive status (can have multiple active)
- **Use `default` for the default payment method logic**
- **Use `active` for enabling/disabling payment methods**

## 2. Schema Field Summary

| Field | Type | Purpose | Notes |
|-------|------|---------|-------|
| `user` | Relation | User who owns this payment method | Many-to-One |
| `type` | Enumeration | Payment type | `credit_card`, `debit_card`, `paypal`, `bank_account` |
| `provider` | Enumeration | Payment provider | `stripe`, `paypal`, `manual` (or add `aba_payway`) |
| `details` | JSON | Payment method details | Stores account numbers, bank info, etc. |
| `default` | Boolean | Is this the default method? | Only one should be true per user |
| `active` | Boolean | Is this method active? | Can have multiple active |
| `stripe_payment_method_id` | String | Stripe payment method ID | For Stripe integration |
| `added_at` | Date | When method was added | Auto-set |

## 3. Recommended Schema Updates

### Option A: Use Existing Schema (Recommended)

**For ABA Bank:**
- `type`: `bank_account`
- `provider`: `manual` (or add `aba_payway` if you want)
- `details`: Store ABA account info in JSON
- `default`: `true` if it's the default method
- `active`: `true` if it's active

### Option B: Add ABA-Specific Fields

If you want to distinguish ABA Bank specifically:

1. **Add to `type` enum:**
   - Add `aba_bank` to the type enumeration

2. **Add to `provider` enum:**
   - Add `aba_payway` to the provider enumeration

## 4. UI Updates Made

The UI has been updated to:
- ✅ Use `default` field instead of `active` for default payment method logic
- ✅ Show "Default" badge instead of "Active" badge
- ✅ Use correct schema values (bank_account, not aba_bank)
- ✅ Support all existing payment types
- ✅ Allow setting one default payment method per user

## 5. Code Updates Made

The integration code has been updated to:
- ✅ Use `default` field for default payment method logic
- ✅ Function renamed: `getUserActivePaymentMethod` → `getUserDefaultPaymentMethod`
- ✅ Function renamed: `deactivateAllUserPaymentMethods` → `unsetAllDefaultPaymentMethods`
- ✅ Only one `default: true` per user (enforced)

## 6. What You Need to Do

### Minimal Changes (Recommended):

1. **No schema changes needed** if you use:
   - `type: "bank_account"` for ABA Bank
   - `provider: "manual"` for ABA Bank
   - Store ABA details in `details` JSON field

### Optional Changes (If you want ABA-specific):

1. **Add to `provider` enum:**
   - Add `aba_payway` to provider enumeration

2. **OR add to `type` enum:**
   - Add `aba_bank` to type enumeration

## 7. Testing

After updating:
1. Go to Dashboard → Payment Methods
2. Add a bank account payment method
3. Set it as default
4. Verify only one can be default
5. Test payment flow

## Summary

- ✅ UI updated to use `default` field correctly
- ✅ Code updated to use `default` for default payment method
- ✅ Schema supports current use case (no changes needed)
- ✅ Optional: Add `aba_payway` to provider enum if desired

