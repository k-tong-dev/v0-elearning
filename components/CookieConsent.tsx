"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, CheckCircle, XCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import { Modal, ModalBody, ModalContent, ModalFooter } from "@/components/ui/aceternity/animated-modal";
import { setCookie, getCookie } from '@/lib/cookies'; // Import custom cookie utilities

type CookieStatus = "accepted" | "declined" | "preferences" | "none";

const COOKIE_CONSENT_KEY = "camedu_cookie_consent";

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
        setCookie(COOKIE_CONSENT_KEY, "accepted", { expires: 0, secure: true, sameSite: 'Lax' }); // Set as session cookie
        setCookieStatus("accepted");
        setShowConsent(false);
        toast.success("You've accepted all cookies!", {
            position: "top-center",
            action: { label: "Close", onClick: () => {} },
            closeButton: false,
        });
    };

    const handleDeclineAll = () => {
        setCookie(COOKIE_CONSENT_KEY, "declined", { expires: 0, secure: true, sameSite: 'Lax' }); // Set as session cookie
        setCookieStatus("declined");
        setShowConsent(false);
        toast.info("You've declined all cookies. Some features may be limited.", {
            position: "top-center",
            action: { label: "Close", onClick: () => {} },
            closeButton: false,
        });
    };

    const handleManagePreferences = () => {
        setCookie(COOKIE_CONSENT_KEY, "preferences", { expires: 0, secure: true, sameSite: 'Lax' }); // Set as session cookie
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
                <Modal open={showConsent} onOpenChange={setShowConsent}>
                    <ModalBody className="p-0 md:p-0">
                        <ModalContent className="p-6 space-y-6 bg-card rounded-2xl shadow-2xl border border-primary/20 dark:bg-gray-900/80 backdrop-blur-xl">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="text-center space-y-4"
                            >
                                <Cookie className="mx-auto w-16 h-16 text-primary mb-4" />
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                                    We Value Your Privacy
                                </h2>
                                <p className="text-muted-foreground text-base">
                                    We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                                </p>
                            </motion.div>

                            <ModalFooter className="flex flex-col sm:flex-row sm:justify-center gap-3 mt-6 bg-transparent p-0">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, duration: 0.3 }}
                                >
                                    <Button
                                        onClick={handleAcceptAll}
                                        className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white"
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
                                        variant="outline"
                                        onClick={handleDeclineAll}
                                        className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
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
                                        variant="ghost"
                                        onClick={handleManagePreferences}
                                        className="w-full sm:w-auto text-muted-foreground hover:bg-accent"
                                    >
                                        <Settings className="w-4 h-4 mr-2" />
                                        Manage Preferences
                                    </Button>
                                </motion.div>
                            </ModalFooter>
                        </ModalContent>
                    </ModalBody>
                </Modal>
            )}
        </AnimatePresence>
    );
}