"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@heroui/react";
import { Sparkles } from "lucide-react";
import { cn } from "@/utils/utils";

declare global {
    interface Window {
        google: any;
        handleCredentialResponse: (response: any) => void;
    }
}

interface GoogleAuthButtonProps {
    onSuccess?: (credential: string) => Promise<void>;
    onError?: (error: string) => void;
    text?: "signin_with" | "signup_with" | "continue_with" | "signin";
    className?: string;
    isLoading?: boolean;
}

export function GoogleAuthButton({ onSuccess, onError, text = "signin_with", className, isLoading: parentIsLoading = false }: GoogleAuthButtonProps) {
    const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
    const [internalLoading, setInternalLoading] = useState(false); // Internal loading for Google script
    const [internalError, setInternalError] = useState<string | null>(null);
    const scriptRef = useRef<HTMLScriptElement | null>(null);
    const buttonContainerRef = useRef<HTMLDivElement>(null);
    const googleInitialized = useRef(false);

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const currentLoading = parentIsLoading || internalLoading;

    window.handleCredentialResponse = async (response: any) => {
        if (currentLoading) return;
        setInternalLoading(true);
        setInternalError(null);
        try {
            if (!response.credential) {
                throw new Error("Google did not return a credential. Please try again.");
            }
            await onSuccess?.(response.credential);
        } catch (error: any) {
            console.error("Google Sign-In failed:", error);
            setInternalError(error.message || "Google Sign-In failed.");
            onError?.(error.message || "Google Sign-In failed.");
        } finally {
            setInternalLoading(false);
        }
    };

    const initializeGoogle = () => {
        if (!window.google || googleInitialized.current) return;

        if (!googleClientId) {
            const msg = "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Google Sign-In will not function.";
            console.error(msg);
            setInternalError(msg);
            onError?.(msg);
            return;
        }

        try {
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: window.handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
            });
            googleInitialized.current = true;
            renderGoogleButton();
        } catch (error) {
            const msg = "Failed to initialize Google Sign-In. Check your client ID and Google Cloud Console configuration.";
            console.error(msg, error);
            setInternalError(msg);
            onError?.(msg);
        }
    };

    const renderGoogleButton = () => {
        if (window.google && buttonContainerRef.current) {
            buttonContainerRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(
                buttonContainerRef.current,
                {
                    theme: "outline",
                    size: "large",
                    text: text,
                    width: "100%",
                }
            );
        }
    };

    useEffect(() => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
            setIsGoogleLoaded(true);
            initializeGoogle();
            return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        scriptRef.current = script;

        script.onload = () => {
            setIsGoogleLoaded(true);
            initializeGoogle();
        };
        script.onerror = () => {
            const msg = "Failed to load Google Sign-In script. Check your network connection.";
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
    }, [googleClientId]);

    useEffect(() => {
        if (isGoogleLoaded && buttonContainerRef.current && googleInitialized.current) {
            renderGoogleButton();
        }
    }, [isGoogleLoaded, text]);

    const handleFallbackClick = () => {
        if (currentLoading) return;

        if (window.google && isGoogleLoaded && googleClientId) {
            window.google.accounts.id.prompt();
        } else if (!googleClientId) {
            const msg = "Google Sign-In is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env file and configure Authorized JavaScript origins in Google Cloud Console.";
            setInternalError(msg);
            onError?.(msg);
        } else {
            const msg = "Google Sign-In is not ready yet. Please try again.";
            setInternalError(msg);
            onError?.(msg);
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            {internalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                    {internalError}
                </div>
            )}

            <div
                ref={buttonContainerRef}
                style={{
                    display: (isGoogleLoaded && googleClientId && !internalError) ? "block" : "none",
                    width: "100%",
                }}
            />

            {(!isGoogleLoaded || !googleClientId || internalError) && (
                <Button
                    className="w-full h-12 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 hover:from-blue-600/20 hover:via-purple-600/20 hover:to-blue-600/20 text-foreground transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] text-lg font-semibold"
                    onClick={handleFallbackClick}
                    disabled={currentLoading}
                >
                    {currentLoading ? (
                        <div className="w-5 h-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
                    )}
                    Continue with Google
                </Button>
            )}
        </div>
    );
}