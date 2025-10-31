# Authentication Setup Guide

## Overview

This guide covers the complete authentication setup for the CamEducation eLearning platform, including Google OAuth, Email/OTP authentication, and Strapi integration.

## Architecture

### Authentication Flow
```
Client (Next.js) → Supabase Auth → Next.js API Routes → Strapi Backend
                       ↓
                   JWT Token
                       ↓
                Cookie Storage (7 days)
```

### Components
1. **Supabase**: OAuth provider management (Google)
2. **Strapi**: User data storage and management
3. **Next.js API Routes**: Authentication middleware
4. **JWT Tokens**: Session management
5. **Cookies**: Secure token storage

## Environment Variables

Create a `.env` file in the `v0-elearning` directory with these variables:

```env
# Strapi Backend
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_JWT_SECRET=your-jwt-secret-key-here

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_AUTH_BYPASS_PASSWORD=your-secure-password

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-anon-key
SUPABASE_DATABASE_PASSWORD=your-database-password

# NextAuth (Optional)
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Google OAuth Setup

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - **Application Type**: Web application
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://your-production-domain.com
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/auth/callback
     https://your-production-domain.com/auth/callback
     ```

5. Copy the **Client ID** and **Client Secret**

### 2. Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Google** provider
4. Add your Google Client ID and Secret
5. Copy the redirect URL and add it to Google Console

## Strapi Backend Setup

### 1. User Schema

Ensure your Strapi user model includes:

```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (hashed),
  avatar: String (URL),
  role: String,
  preferences: Object,
  provider: String (google, email, etc.),
  confirmed: Boolean,
  // ... other fields
}
```

### 2. Strapi Configuration

In `strapi/config/plugins.js`:

```javascript
module.exports = {
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d', // Match client-side token expiry
      },
      register: {
        allowedFields: ['username', 'email', 'password', 'avatar', 'role', 'preferences', 'provider'],
      },
    },
  },
};
```

### 3. Permissions

Ensure the following permissions are set in Strapi:

- **Public** role:
  - `users-permissions.auth.local` - Allow
  - `users-permissions.auth.local.register` - Allow
  - `users-permissions.user.find` - Allow

- **Authenticated** role:
  - `users-permissions.user.me` - Allow
  - `users-permissions.user.update` - Allow (own records)

## Authentication Routes

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/google` | POST | Google OAuth callback |
| `/api/auth/login` | POST | Email/password login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/logout` | POST | User logout |

### App Routes

| Route | Description |
|-------|-------------|
| `/auth/start` | Landing page for auth |
| `/auth/email-auth` | Email authentication |
| `/auth/verify-otp` | OTP verification |
| `/auth/signup` | Profile completion |
| `/auth/password-confirmation` | Password entry for existing users |

## Usage

### In Components

```typescript
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, isAuthenticated, isLoading, loginWithGoogle, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <button onClick={() => loginWithGoogle(credential)}>Sign in</button>;
  }

  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protected Routes

Use middleware to protect routes:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/start', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/courses/:path*/learn'],
};
```

## Token Management

### Storage

Tokens are stored in cookies with the following settings:

```javascript
{
  name: 'access_token',
  value: JSON.stringify({ token, expiry }),
  httpOnly: false, // Accessible by client-side code
  secure: true,    // Only over HTTPS in production
  sameSite: 'Lax', // CSRF protection
  maxAge: 7 * 24 * 60 * 60, // 7 days
}
```

### Retrieval

```typescript
import { getAccessToken } from '@/lib/cookies';

const token = getAccessToken(); // Returns null if expired
```

### Removal

```typescript
import { removeAccessToken } from '@/lib/cookies';

removeAccessToken(); // Clears the token cookie
```

## Error Handling

### Common Errors

1. **"Email is required"**
   - Google auth didn't return email
   - Check Google OAuth scope

2. **"Failed to check user existence"**
   - Strapi connection issue
   - Verify `NEXT_PUBLIC_STRAPI_URL`

3. **"Google authentication failed"**
   - Invalid credential token
   - Check Google Client ID configuration

4. **"No access token available for update"**
   - Token expired or not set
   - User needs to re-authenticate

### Error Logging

All authentication errors are logged to console with the prefix `[Google Auth]` or `[Auth]`:

```javascript
console.error('[Google Auth] Error:', error);
```

## Security Best Practices

1. **Never expose secrets**: Keep `JWT_SECRET` and `GOOGLE_CLIENT_SECRET` server-side only
2. **Use HTTPS**: Always use secure connections in production
3. **Validate tokens**: Check token expiry and signature
4. **Sanitize inputs**: Validate all user inputs
5. **Rate limiting**: Implement rate limiting on auth endpoints
6. **CORS**: Configure proper CORS policies

## Testing

### Manual Testing

1. **Google OAuth**:
   ```bash
   # Open browser
   http://localhost:3000/auth/start
   # Click "Continue with Google"
   # Verify redirect and token storage
   ```

2. **Email Auth**:
   ```bash
   # Open browser
   http://localhost:3000/auth/email-auth
   # Enter email
   # Check inbox for OTP
   # Verify OTP and complete signup
   ```

3. **Token Persistence**:
   ```bash
   # Sign in
   # Open DevTools → Application → Cookies
   # Verify 'access_token' is set
   # Refresh page
   # Verify user remains authenticated
   ```

### Automated Testing

```typescript
// Example test
describe('Authentication', () => {
  it('should authenticate with Google', async () => {
    const credential = 'mock-google-credential';
    const result = await loginWithGoogle(credential);
    expect(result.newUser).toBeDefined();
    expect(result.user).toBeDefined();
  });
});
```

## Troubleshooting

### Issue: "Token expired" immediately after login

**Solution**: Check server/client time sync

```bash
# On Mac/Linux
sudo ntpdate -u time.apple.com

# On Windows
w32tm /resync
```

### Issue: Google Sign-In button not appearing

**Causes**:
1. `NEXT_PUBLIC_GOOGLE_CLIENT_ID` not set
2. Google script blocked by ad-blocker
3. Invalid domain in Google Console

**Solution**: 
- Verify environment variables
- Disable ad-blockers for testing
- Check authorized domains in Google Console

### Issue: CORS errors from Strapi

**Solution**: Update Strapi CORS settings in `config/middleware.js`:

```javascript
module.exports = {
  settings: {
    cors: {
      enabled: true,
      origin: ['http://localhost:3000', 'https://your-domain.com'],
    },
  },
};
```

## Migration Guide

### From Old Auth System

1. **Export existing users** from old system
2. **Import to Strapi** with correct schema
3. **Set passwords** for existing users:
   ```bash
   # Use bcrypt to hash passwords
   node scripts/migrate-users.js
   ```
4. **Update tokens** in database
5. **Test authentication** with sample accounts

## Monitoring

### Metrics to Track

- Authentication success rate
- Token expiry rate
- Average session duration
- Failed login attempts
- OAuth provider response times

### Logging

Implement structured logging:

```typescript
logger.info('User authenticated', {
  userId: user.id,
  provider: 'google',
  timestamp: new Date().toISOString(),
});
```

## Support

For issues or questions:

1. Check console logs for detailed error messages
2. Review the [Strapi documentation](https://docs.strapi.io)
3. Check [Supabase Auth docs](https://supabase.com/docs/guides/auth)
4. Review Google OAuth [troubleshooting guide](https://developers.google.com/identity/sign-in/web/troubleshooting)

---

**Last Updated**: 2025-10-31  
**Version**: 1.0.0  
**Maintainer**: CMU Team
