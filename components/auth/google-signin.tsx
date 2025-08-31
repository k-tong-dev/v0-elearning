'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { Sparkles } from 'lucide-react' // Added Sparkles for a nicer fallback icon

declare global {
    interface Window {
        google: any
        handleCredentialResponse: (response: any) => void
    }
}

interface GoogleSignInProps {
    onSuccess?: (credential: string) => Promise<void>
    onError?: (error: string) => void
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
    className?: string
}

export function GoogleSignIn({ onSuccess, onError, text = 'signin_with', className }: GoogleSignInProps) {
    const { loginWithGoogle } = useAuth()
    const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [internalError, setInternalError] = useState<string | null>(null); // Internal error state
    const scriptRef = useRef<HTMLScriptElement | null>(null)
    const buttonContainerRef = useRef<HTMLDivElement>(null)
    const googleInitialized = useRef(false);

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // Define the callback function globally or ensure it's accessible
    // This is crucial for Google's GSI to find it.
    window.handleCredentialResponse = async (response: any) => {
        if (isLoading) return;
        setIsLoading(true);
        setInternalError(null); // Clear previous errors
        try {
            if (!response.credential) {
                // IMPORTANT: Add a check here to ensure credential exists
                throw new Error('Google did not return a credential. Please try again.');
            }
            await onSuccess?.(response.credential);
        } catch (error: any) {
            console.error('Google Sign-In failed:', error);
            setInternalError(error.message || 'Google Sign-In failed.');
            onError?.(error.message || 'Google Sign-In failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const initializeGoogle = () => {
        if (!window.google || googleInitialized.current) return;

        if (!googleClientId) {
            const msg = 'NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Google Sign-In will not function.';
            console.error(msg);
            setInternalError(msg);
            onError?.(msg);
            return;
        }

        try {
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: window.handleCredentialResponse, // Use the globally accessible callback
                auto_select: false,
                cancel_on_tap_outside: true
            });
            googleInitialized.current = true;
            renderGoogleButton();
        } catch (error) {
            const msg = 'Failed to initialize Google Sign-In. Check your client ID and Google Cloud Console configuration.';
            console.error(msg, error);
            setInternalError(msg);
            onError?.(msg);
        }
    };

    const renderGoogleButton = () => {
        if (window.google && buttonContainerRef.current) {
            // Clear existing content to prevent duplicate buttons on re-renders
            buttonContainerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(
                buttonContainerRef.current,
                {
                    theme: 'outline',
                    size: 'large',
                    text: text,
                    width: '100%' // Set to 100% to fill parent container
                }
            );
        }
    };

    useEffect(() => {
        console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID in browser:', googleClientId); // Added log
        // Check if Google GSI script is already loaded
        if (window.google && window.google.accounts && window.google.accounts.id) {
            setIsGoogleLoaded(true);
            initializeGoogle();
            return;
        }

        // If not loaded, inject the script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        scriptRef.current = script;

        script.onload = () => {
            setIsGoogleLoaded(true);
            initializeGoogle();
        };
        script.onerror = () => {
            const msg = 'Failed to load Google Sign-In script. Check your network connection.';
            console.error(msg);
            setInternalError(msg);
            onError?.(msg);
        };

        document.body.appendChild(script);

        return () => {
            if (scriptRef.current && document.body.contains(scriptRef.current)) {
                document.body.removeChild(scriptRef.current);
            }
        };
    }, [googleClientId]); // Dependency array includes googleClientId

    // Re-render button if text prop changes or container becomes available
    useEffect(() => {
        if (isGoogleLoaded && buttonContainerRef.current && googleInitialized.current) {
            renderGoogleButton();
        }
    }, [isGoogleLoaded, text]);


    const handleFallbackClick = () => {
        if (isLoading) return;

        if (window.google && isGoogleLoaded && googleClientId) {
            // If GSI is loaded, but the button didn't render or user clicked fallback, prompt directly
            window.google.accounts.id.prompt();
        } else if (!googleClientId) {
            const msg = 'Google Sign-In is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env file and configure Authorized JavaScript origins in Google Cloud Console.';
            setInternalError(msg);
            onError?.(msg);
        } else {
            const msg = 'Google Sign-In is not ready yet. Please try again.';
            setInternalError(msg);
            onError?.(msg);
        }
    };

    return (
        <div className={className}>
            {internalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 mb-4">
                    {internalError}
                </div>
            )}
            {/* Container for the Google button */}
            <div
                ref={buttonContainerRef}
                style={{
                    display: (isGoogleLoaded && googleClientId && !internalError) ? 'block' : 'none',
                    width: '100%'
                }}
            />

            {/* Fallback button when Google hasn't loaded or client ID is missing or there's an internal error */}
            {(!isGoogleLoaded || !googleClientId || internalError) && (
                <Button
                    variant="outline"
                    className="w-full h-12 bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-cyan-500/10 hover:from-cyan-600/20 hover:via-emerald-600/20 hover:to-cyan-600/20 text-foreground transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.02] text-lg font-semibold"
                    onClick={handleFallbackClick}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="w-5 h-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Sparkles className="w-5 h-5 mr-2 text-blue-500" /> // Using Sparkles for a generic icon
                    )}
                    Continue with Google
                </Button>
            )}
        </div>
    );
}