'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { UserRole, UserPreferences } from '@/types/auth' // Import new types from shared file

export interface User {
    id: string
    email: string
    name: string
    avatar?: string
    provider: 'google' | 'email'
    role?: UserRole // Include role in User interface
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<void>
    register: (name: string, email: string, password: string, role: UserRole, preferences: UserPreferences) => Promise<void>
    loginWithGoogle: (credential: string, role?: UserRole, preferences?: UserPreferences) => Promise<void>
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const isAuthenticated = !!user

    // Check for existing auth on mount
    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                setUser(data.user)
            }
        } catch (error) {
            console.error('Auth check failed:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (email: string, password: string) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Login failed')
            }

            setUser(data.user)
        } catch (error) {
            console.error('Login error:', error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const register = async (name: string, email: string, password: string, role: UserRole, preferences: UserPreferences) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, role, preferences }), // Pass new fields
                credentials: 'include'
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed')
            }

            setUser(data.user)
        } catch (error) {
            console.error('Registration error:', error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const loginWithGoogle = async (credential: string, role?: UserRole, preferences?: UserPreferences) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/auth/google-oauth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ credential, role, preferences }),
                credentials: 'include',
                redirect: 'manual' // Crucial: tell fetch not to follow redirects automatically
            })

            console.log('Client-side fetch response object:', response); // Log the full response object
            console.log('Client-side fetch response status:', response.status);
            console.log('Client-side fetch response ok:', response.ok);

            // Handle network errors where status might be 0
            if (response.status === 0 && !response.ok) {
                throw new Error('Network error or request blocked. Please check your internet connection or browser extensions.');
            }

            // If the server responded with a redirect, handle it manually
            if (response.status === 307 || response.status === 302) { // 307 Temporary Redirect, 302 Found
                const redirectUrl = response.headers.get('Location');
                console.log('Redirect detected. Location:', redirectUrl);
                if (redirectUrl) {
                    window.location.href = redirectUrl; // Manually redirect the browser
                    return; // Stop further processing in this function
                } else {
                    console.error('Redirect response received without a Location header.');
                    throw new Error('Redirect response received without a Location header.');
                }
            }

            // Attempt to parse JSON only if the response is not a redirect and has content
            let data = null;
            const contentType = response.headers.get('content-type');
            console.log('Response content type:', contentType);
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
                console.log('Response JSON data:', data);
            } else {
                // If not JSON, or empty, it might be a successful non-JSON response (e.g., 204 No Content)
                // Or it could be an error that didn't return JSON.
                // For now, if it's not JSON, we'll assume it's an error if response.ok is false.
                if (!response.ok) {
                    const textError = await response.text();
                    console.error('Non-JSON error response:', textError);
                    throw new Error(textError || `Google login failed with status: ${response.status}. Expected JSON or redirect.`);
                }
            }

            if (!response.ok) {
                console.error('Response not OK, data:', data);
                throw new Error(data?.error || 'Google login failed')
            }

            setUser(data.user)
        } catch (error) {
            console.error('Google login error in useAuth:', error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            })

            setUser(null)
        } catch (error) {
            console.error('Logout error:', error)
            // Still clear user state even if request fails
            setUser(null)
        }
    }

    const refreshUser = async () => {
        await checkAuth()
    }

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}