"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra";
import { Footer } from "@/components/ui/footers/footer";
import {BackgroundBeamsWithCollision} from "@/components/ui/backgrounds/background-beams-with-collision";

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-transparent overflow-scroll scrollbar-hide">
            <BackgroundBeamsWithCollision className="min-h-screen via-background">
                <main className="h-full flex-1 bg-transparent container mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-16 overflow-scroll scrollbar-hide">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-6xl mx-auto rounded-2xl shadow-xl border border-border p-8 space-y-8 bg-transparent"
                    >
                        <div className="text-center space-y-4">
                            <BookOpen className="mx-auto w-16 h-16 text-primary" />
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Terms of Service
                            </h1>
                            <p className="text-muted-foreground">
                                Last updated: July 26, 2024
                            </p>
                        </div>

                        <section className="prose dark:prose-invert max-w-none space-y-6">
                            <p>
                                Welcome to CamEdu! These Terms of Service ("Terms") govern your access to and use of the CamEdu website, products, and services ("Services"). By accessing or using our Services, you agree to be bound by these Terms.
                            </p>

                            <h2>1. Acceptance of Terms</h2>
                            <p>
                                By creating an account, accessing, or using the Services, you signify your agreement to these Terms. If you do not agree to these Terms, you may not access or use the Services.
                            </p>

                            <h2>2. Changes to Terms</h2>
                            <p>
                                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the Services after such modifications constitutes your acceptance of the new Terms.
                            </p>

                            <h2>3. User Accounts</h2>
                            <p>
                                You must be at least 13 years old to use our Services. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account or password.
                            </p>

                            <h2>4. Content and Conduct</h2>
                            <p>
                                You are solely responsible for the content you submit, post, or display on or through the Services. You agree not to post any content that is illegal, offensive, harmful, or infringes on the rights of others.
                            </p>

                            <h2>5. Intellectual Property</h2>
                            <p>
                                All content provided on CamEdu, including text, graphics, logos, images, and software, is the property of CamEdu or its content suppliers and protected by international copyright laws.
                            </p>

                            <h2>6. Termination</h2>
                            <p>
                                We may terminate or suspend your account and access to the Services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                            </p>

                            <h2>7. Disclaimer of Warranties</h2>
                            <p>
                                The Services are provided on an "AS IS" and "AS AVAILABLE" basis. CamEdu makes no warranties, expressed or implied, and hereby disclaims all other warranties.
                            </p>

                            <h2>8. Limitation of Liability</h2>
                            <p>
                                In no event shall CamEdu, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.
                            </p>

                            <h2>9. Governing Law</h2>
                            <p>
                                These Terms shall be governed and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law provisions.
                            </p>

                            <h2>10. Contact Us</h2>
                            <p>
                                If you have any questions about these Terms, please contact us at support@camedu.com.
                            </p>
                        </section>
                    </motion.div>
                </main>
            </BackgroundBeamsWithCollision>
        </div>

    );
}