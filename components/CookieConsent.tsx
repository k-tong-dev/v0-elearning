"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, CheckCircle, XCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import { setCookie, getCookie } from '@/lib/cookies';

type CookieStatus = "accepted" | "declined" | "preferences" | "none";

const COOKIE_CONSENT_KEY = "cookie_consent";

export function CookieConsent() {
    const [showConsent, setShowConsent] = useState(false);
    const [cookieStatus, setCookieStatus] = useState<CookieStatus>("none");

    useEffect(() => {
        const storedConsent = getCookie(COOKIE_CONSENT_KEY) as CookieStatus;

        if (storedConsent) {
            setCookieStatus(storedConsent);
            setShowConsent(false);
        } else {
            setShowConsent(true);
        }
    }, []);

    const handleAcceptAll = () => {
        setCookie(COOKIE_CONSENT_KEY, "accepted", { expires: 0, secure: true, sameSite: 'Lax' });
        setCookieStatus("accepted");
        setShowConsent(false);
        toast.success("You've accepted all cookies!", {
            position: "top-center",
            action: { label: "Close", onClick: () => {} },
            closeButton: false,
        });
    };

    const handleDeclineAll = () => {
        setCookie(COOKIE_CONSENT_KEY, "declined", { expires: 0, secure: true, sameSite: 'Lax' });
        setCookieStatus("declined");
        setShowConsent(false);
        toast.info("You've declined all cookies. Some features may be limited.", {
            position: "top-center",
            action: { label: "Close", onClick: () => {} },
            closeButton: false,
        });
    };

    const handleManagePreferences = () => {
        setCookie(COOKIE_CONSENT_KEY, "preferences", { expires: 0, secure: true, sameSite: 'Lax' });
        setCookieStatus("preferences");
        setShowConsent(false);
        toast.info("Cookie preferences saved. You can manage them anytime in settings.", {
            position: "top-center",
            action: { label: "Close", onClick: () => {} },
            closeButton: false,
        });
    };

    if (cookieStatus !== "none" && !showConsent) {
        return null;
    }

    return (
        <AnimatePresence>
            {showConsent && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: "spring", stiffness: 120, damping: 15 }}
                    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-fit px-4 pointer-events-none"
                >
                    <motion.div
                        className="relative p-8 space-y-6 bg-background/60 dark:bg-background/60 backdrop-blur-xl rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.1)_inset] border border-white/20 dark:border-white/10 pointer-events-auto"
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 100, damping: 10 }}
                    >
                        <div className="relative z-10 text-center space-y-4">
                            <Cookie className="mx-auto w-16 h-16 text-primary mb-4" />
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                                We Value Your Privacy
                            </h2>
                            <p className="text-foreground/90 text-base">
                                We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                            </p>
                        </div>

                        <div className="relative z-10 flex flex-col sm:flex-row sm:justify-center gap-3 mt-6 px-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                            >
                                <Button
                                    onClick={handleAcceptAll}
                                    className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Accept All
                                </Button>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.3 }}
                            >
                                <Button
                                    onClick={handleDeclineAll}
                                    className="w-full sm:w-auto bg-red-500/10 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-300/50 dark:border-red-500/50 hover:bg-red-500/20 dark:hover:bg-red-500/20 rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Decline All
                                </Button>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.3 }}
                            >
                                <Button
                                    onClick={handleManagePreferences}
                                    className="w-full sm:w-auto bg-transparent text-muted-foreground hover:bg-white/10 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white border border-transparent hover:border-white/20 dark:hover:border-white/20 rounded-full px-6 py-3 transition-all duration-300"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Manage Preferences
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}