'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

declare global {
  interface Window {
    google: any
    handleCredentialResponse: (response: any) => void
  }
}

interface GoogleSignInProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  className?: string
}

export function GoogleSignIn({ onSuccess, onError, text = 'signin_with', className }: GoogleSignInProps) {
  const { loginWithGoogle } = useAuth()
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const buttonContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if Google script is already loaded
    if (window.google) {
      setIsGoogleLoaded(true)
      initializeGoogle()
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      existingScript.addEventListener('load', handleScriptLoad)
      return () => {
        existingScript.removeEventListener('load', handleScriptLoad)
      }
    }

    // Load Google Identity Services
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    scriptRef.current = script
    
    script.onload = handleScriptLoad
    script.onerror = () => {
      console.error('Failed to load Google Sign-In script')
      onError?.('Failed to load Google Sign-In')
    }
    
    document.body.appendChild(script)

    return () => {
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current)
      }
    }
  }, [])

  const handleScriptLoad = () => {
    if (window.google) {
      setIsGoogleLoaded(true)
      initializeGoogle()
    }
  }

  const initializeGoogle = () => {
    if (!window.google || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return

    try {
      // Initialize Google Sign-In
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      })

      // Render the button if container exists
      if (buttonContainerRef.current) {
        window.google.accounts.id.renderButton(
          buttonContainerRef.current,
          {
            theme: 'outline',
            size: 'large',
            text: text,
            width: '100%'
          }
        )
      }
    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error)
      onError?.('Failed to initialize Google Sign-In')
    }
  }

  const handleCredentialResponse = async (response: any) => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      await loginWithGoogle(response.credential)
      onSuccess?.()
    } catch (error: any) {
      console.error('Google Sign-In failed:', error)
      onError?.(error.message || 'Google Sign-In failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFallbackClick = () => {
    if (isLoading) return
    
    if (window.google && isGoogleLoaded) {
      window.google.accounts.id.prompt()
    } else {
      onError?.('Google Sign-In is not ready yet. Please try again.')
    }
  }

  return (
    <div className={className}>
      {/* Container for the Google button */}
      <div 
        ref={buttonContainerRef} 
        style={{ 
          display: isGoogleLoaded ? 'block' : 'none',
          width: '100%' 
        }}
      />
      
      {/* Fallback button when Google hasn't loaded */}
      {!isGoogleLoaded && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleFallbackClick}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Continue with Google
        </Button>
      )}
    </div>
  )
}
