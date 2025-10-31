# Cookie Migration Guide

## Overview
This guide documents the migration from `localStorage` to secure HTTP cookies for session management in the v0-elearning application.

## Why Migrate to Cookies?

### Benefits of Cookies over localStorage:
1. **Better Security**: Cookies can be set as `HttpOnly` and `Secure`, preventing XSS attacks
2. **Automatic Server Access**: Cookies are sent with every request automatically
3. **Better Expiration Control**: Built-in expiration management
4. **Cross-Tab Synchronization**: Changes are automatically synchronized across tabs
5. **SameSite Protection**: Built-in CSRF protection with `SameSite` attribute

## What Changed?

### New Cookie Utility Library
Created: `v0-elearning/lib/cookies.ts`

This provides:
- `setCookie()` - Set a cookie with options
- `getCookie()` - Get a cookie value
- `deleteCookie()` - Remove a cookie
- `storeAccessToken()` - Store JWT token with expiration
- `getAccessToken()` - Get JWT token if valid
- `removeAccessToken()` - Remove JWT token
- `storeEmailForOTP()` - Store email for OTP verification
- `getEmailForOTP()` - Get email for OTP verification
- `removeEmailForOTP()` - Remove email for OTP
- `clearAuthCookies()` - Clear all authentication cookies

### Files Updated

#### 1. `integrations/strapi/utils.ts`
**Before:**
```typescript
export const storeAccessToken = (token: string) => {
    const expiry = Date.now() + 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem("access_token", JSON.stringify({ token, expiry }));
};

export const getAccessToken = (): string | null => {
    const item = localStorage.getItem("access_token");
    if (!item) return null;
    const { token, expiry } = JSON.parse(item);
    if (Date.now() > expiry) {
        localStorage.removeItem("access_token");
        return null;
    }
    return token;
};
```

**After:**
```typescript
import { storeAccessToken as storeCookieToken, getAccessToken as getCookieToken } from '@/lib/cookies';

export const storeAccessToken = storeCookieToken;
export const getAccessToken = getCookieToken;
```

#### 2. `hooks/use-auth.tsx`
- Replaced `localStorage.removeItem("access_token")` with `removeAccessToken()` from cookies
- Removed `sessionStorage` checks and removals

#### 3. `app/auth/email-auth/page.tsx`
- Replaced `localStorage.setItem("email_for_otp", email)` with `storeEmailForOTP(email)`

#### 4. `app/auth/verify-otp/page.tsx`
- Replaced all `localStorage.setItem("email_for_otp", email)` with `storeEmailForOTP(email)`

#### 5. `app/auth/password-confirmation/page.tsx`
- Removed local `storeAccessToken` function
- Now imports and uses `storeAccessToken` from `@/integrations/strapi/utils`

#### 6. `components/dashboard/DashboardSettings.tsx`
- Replaced `localStorage.getItem("access_token")` with `getAccessToken()` from cookies

## Cookie Configuration

### Default Settings
```typescript
{
    expires: 3,           // 3 days expiration
    path: '/',            // Available site-wide
    secure: true,         // Only over HTTPS
    sameSite: 'Lax'      // CSRF protection
}
```

### Access Token Storage
- **Cookie Name**: `access_token`
- **Expiration**: 3 days
- **Format**: JSON stringified object with `{ token, expiry }`
- **Auto-cleanup**: Expired tokens are automatically removed

### Email for OTP Storage
- **Cookie Name**: `email_for_otp`
- **Expiration**: 1 day
- **Format**: Plain email string

## Migration Steps for Future Development

If you need to add new session data:

1. **Add utility functions** in `lib/cookies.ts`:
```typescript
export function storeYourData(data: string): void {
    setCookie('your_data_key', data, { 
        expires: 7, // custom expiry
        secure: true,
        sameSite: 'Lax'
    });
}

export function getYourData(): string | null {
    return getCookie('your_data_key');
}

export function removeYourData(): void {
    deleteCookie('your_data_key');
}
```

2. **Import and use** in your components:
```typescript
import { storeYourData, getYourData } from '@/lib/cookies';

// Store data
storeYourData('value');

// Retrieve data
const data = getYourData();
```

## Testing Checklist

- [x] ✅ User authentication flow
- [x] ✅ Token storage after login
- [x] ✅ Token retrieval for API calls
- [x] ✅ Token expiration handling
- [x] ✅ Logout functionality
- [x] ✅ Email OTP flow
- [x] ✅ Password confirmation
- [x] ✅ Dashboard settings

## Known Limitations

1. **Cookie Size**: Maximum 4KB per cookie (sufficient for JWT tokens)
2. **Browser Compatibility**: Works on all modern browsers
3. **Server-Side Rendering**: Cookies need to be read differently in SSR contexts (use `next/headers` or middleware)

## Next Steps (Optional Improvements)

### 1. Add HttpOnly Cookies (Backend Required)
For maximum security, implement `HttpOnly` cookies through your backend:

```typescript
// Backend API route
export async function POST(req: Request) {
    const { jwt } = await req.json();
    
    // Set HttpOnly cookie
    return new Response(JSON.stringify({ success: true }), {
        headers: {
            'Set-Cookie': `access_token=${jwt}; HttpOnly; Secure; SameSite=Lax; Max-Age=${3 * 24 * 60 * 60}; Path=/`
        }
    });
}
```

### 2. Implement Cookie Middleware
Create Next.js middleware to handle cookie validation:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token');
    
    if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/auth/start', request.url));
    }
    
    return NextResponse.next();
}
```

### 3. Add Cookie Encryption
For sensitive data, consider encrypting cookie values:

```typescript
import crypto from 'crypto';

function encrypt(text: string): string {
    // Add encryption logic
}

function decrypt(text: string): string {
    // Add decryption logic
}
```

## Troubleshooting

### Issue: Cookies not being set
**Solution**: Check if you're on HTTPS or localhost. Secure cookies require HTTPS.

### Issue: Cookies not accessible
**Solution**: Verify the `path` and `domain` settings match your application structure.

### Issue: Token expires unexpectedly
**Solution**: Check the system time and ensure the expiry calculation is correct.

### Issue: Cross-domain issues
**Solution**: Set appropriate `domain` and `sameSite` attributes.

## Support

For issues or questions about the cookie implementation, please:
1. Check this documentation
2. Review the `lib/cookies.ts` utility functions
3. Consult the updated component implementations
4. Contact the development team

---

**Migration Date**: 2025-10-31  
**Status**: ✅ Complete  
**Backward Compatibility**: ⚠️ None - All localStorage usage removed
