# Authentication System Documentation

## Overview

A complete MongoDB-based authentication system has been implemented with support for both email/password and Google OAuth authentication. The system uses JWT tokens for session management and includes password hashing for security.

## Architecture

### Core Components

1. **MongoDB Integration** (`lib/mongodb.ts`)
   - Connection pooling for efficient database operations
   - Hot module replacement support for development

2. **User Service** (`lib/auth.ts`)
   - User CRUD operations
   - Password hashing and verification utilities
   - Google OAuth user creation and management

3. **Authentication Middleware** (`lib/auth-middleware.ts`)
   - JWT token verification
   - Protected route helpers
   - Standardized auth responses

4. **React Auth Context** (`hooks/use-auth.ts`)
   - Client-side authentication state management
   - Login, register, and logout functions
   - Automatic session restoration

## API Endpoints

### POST /api/auth/register
- Creates new user accounts with email/password
- Automatically logs user in after registration
- Returns JWT token and user data

### POST /api/auth/login
- Authenticates users with email/password
- Returns JWT token and user data
- Sets HTTP-only auth cookie

### POST /api/auth/google
- Handles Google OAuth authentication
- Creates or updates user accounts
- Supports both new and existing users

### GET /api/auth/me
- Returns current user information
- Requires authentication token
- Used for session restoration

### POST /api/auth/logout
- Clears authentication cookies
- Invalidates current session

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  avatar: String (optional),
  provider: 'google' | 'email',
  providerId: String (optional),
  password: String (hashed, email auth only),
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date,
  preferences: {
    theme: 'light' | 'dark' | 'system',
    notifications: Boolean,
    newsletter: Boolean
  },
  profile: {
    bio: String,
    website: String,
    social: {
      twitter: String,
      linkedin: String,
      github: String
    }
  },
  subscription: {
    plan: 'free' | 'basic' | 'pro' | 'enterprise',
    status: 'active' | 'inactive' | 'cancelled',
    currentPeriodEnd: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  }
}
```

## Security Features

1. **Password Security**
   - Bcrypt hashing with salt rounds of 12
   - Passwords never stored in plain text
   - Secure password verification

2. **JWT Tokens**
   - 7-day expiration by default
   - HTTP-only cookies for XSS protection
   - Secure flag in production

3. **Google OAuth**
   - Server-side token verification
   - Secure credential handling
   - Automatic user creation/linking

## Frontend Components

### AuthModal (`components/auth-modal.tsx`)
- Unified sign-in/sign-up modal
- Form validation and error handling
- Google Sign-In integration
- Responsive design with animations

### GoogleSignIn (`components/auth/google-signin.tsx`)
- Google Identity Services integration
- Fallback UI for loading states
- Error handling and callbacks

## Environment Variables Required

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/cameducation

# JWT Secret
NEXTAUTH_SECRET=your-secret-key

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Usage Examples

### Protecting Pages
```typescript
import { useAuth } from '@/hooks/use-auth'

export function ProtectedPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please log in</div>
  
  return <div>Welcome, {user.name}!</div>
}
```

### Using AuthModal
```typescript
import { AuthModal } from '@/components/auth-modal'

export function MyComponent() {
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  
  return (
    <>
      <button onClick={() => setShowAuth(true)}>Sign In</button>
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        mode={authMode}
        onToggleMode={() => setAuthMode(mode => mode === 'signin' ? 'signup' : 'signin')}
        onAuthSuccess={() => console.log('User authenticated!')}
      />
    </>
  )
}
```

## Integration with Layout

The `AuthProvider` is already integrated into the root layout (`app/layout.tsx`) to provide authentication context throughout the application.

## Next Steps

1. **Email Verification**: Implement email verification for new accounts
2. **Password Reset**: Add forgot password functionality
3. **Two-Factor Authentication**: Implement 2FA for enhanced security
4. **Social Logins**: Add more OAuth providers (Facebook, GitHub, etc.)
5. **Rate Limiting**: Add rate limiting to auth endpoints
6. **Audit Logging**: Track authentication events

## Testing

To test the authentication system:

1. Ensure MongoDB is running and accessible
2. Set required environment variables
3. Start the development server
4. Try registering a new account
5. Test login with the created account
6. Test Google OAuth flow (requires valid credentials)

The system is production-ready with proper error handling, security measures, and a clean API design.
