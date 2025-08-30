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
                redirect: 'follow' // Ensure fetch follows redirects
            })

            // If the server responded with a redirect, the browser will have already navigated.
            // We don't need to parse JSON here if a redirect occurred.
            if (response.redirected) {
                // The browser has already navigated, so we just resolve.
                // The `checkAuth` in the root layout's AuthProvider will eventually update the user state.
                await refreshUser(); // Manually refresh user state after redirect
                return;
            }

            // If it's not a redirect (e.g., an error response with JSON body), then parse JSON.
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Google login failed')
            }

            setUser(data.user) // This line might not be reached if redirected
        } catch (error) {
            console.error('Google login error:', error)
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