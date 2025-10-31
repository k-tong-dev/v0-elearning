/**
 * Cookie utility functions for managing authentication tokens and session data
 * Provides secure cookie storage with expiration handling
 */

interface CookieOptions {
    expires?: number; // days until expiration
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Set a cookie with the specified name, value, and options
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
    const {
        expires = 3, // default 3 days
        path = '/',
        domain,
        secure = true, // always secure in production
        sameSite = 'Lax'
    } = options;

    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    
    // Set expiration
    if (expires) {
        const date = new Date();
        date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
        cookie += `; expires=${date.toUTCString()}`;
    }
    
    // Add path
    cookie += `; path=${path}`;
    
    // Add domain if specified
    if (domain) {
        cookie += `; domain=${domain}`;
    }
    
    // Add secure flag (only over HTTPS)
    if (secure && typeof window !== 'undefined' && window.location.protocol === 'https:') {
        cookie += '; secure';
    }
    
    // Add SameSite attribute
    cookie += `; SameSite=${sameSite}`;
    
    if (typeof document !== 'undefined') {
        document.cookie = cookie;
    }
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') {
        return null;
    }
    
    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
        }
    }
    
    return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string, path: string = '/', domain?: string): void {
    let cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
    
    if (domain) {
        cookie += `; domain=${domain}`;
    }
    
    if (typeof document !== 'undefined') {
        document.cookie = cookie;
    }
}

/**
 * Check if a cookie exists
 */
export function hasCookie(name: string): boolean {
    return getCookie(name) !== null;
}

/**
 * Store access token in cookie with expiry metadata
 */
export function storeAccessToken(token: string, expiryDays: number = 7): void {
    const expiry = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
    const tokenData = JSON.stringify({ token, expiry });
    
    setCookie('access_token', tokenData, { 
        expires: expiryDays,
        secure: true,
        sameSite: 'Lax'
    });
    
    console.log('[storeAccessToken] Token stored in cookie (expires in', expiryDays, 'days)');
}

/**
 * Get access token from cookie
 * Returns null if expired or not found
 */
export function getAccessToken(): string | null {
    const tokenData = getCookie('access_token');
    
    if (!tokenData) {
        return null;
    }
    
    try {
        const { token, expiry } = JSON.parse(tokenData);
        
        if (Date.now() > expiry) {
            console.log('[getAccessToken] Token expired, removing from cookies');
            deleteCookie('access_token');
            return null;
        }
        
        return token;
    } catch (error) {
        // Token might be stored as plain string (legacy format)
        // Try to use it directly if it's not JSON
        if (typeof tokenData === 'string' && tokenData.length > 0) {
            console.log('[getAccessToken] Using legacy token format');
            return tokenData;
        }
        console.error('[getAccessToken] Error parsing token data:', error);
        deleteCookie('access_token');
        return null;
    }
}

/**
 * Remove access token from cookie
 */
export function removeAccessToken(): void {
    deleteCookie('access_token');
    console.log('[removeAccessToken] Token removed from cookies');
}

/**
 * Store email for OTP verification
 */
export function storeEmailForOTP(email: string): void {
    setCookie('email_for_otp', email, { 
        expires: 1, // 1 day expiry
        secure: true,
        sameSite: 'Lax'
    });
}

/**
 * Get email for OTP verification
 */
export function getEmailForOTP(): string | null {
    return getCookie('email_for_otp');
}

/**
 * Remove email for OTP verification
 */
export function removeEmailForOTP(): void {
    deleteCookie('email_for_otp');
}

/**
 * Clear all authentication-related cookies
 */
export function clearAuthCookies(): void {
    removeAccessToken();
    removeEmailForOTP();
    console.log('[clearAuthCookies] All auth cookies cleared');
}
