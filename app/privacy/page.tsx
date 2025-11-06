"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra";
import { Footer } from "@/components/ui/footers/footer";
import {BackgroundBeamsWithCollision} from "@/components/ui/backgrounds/background-beams-with-collision";

export default function PrivacyPolicyPage() {
    return (
        <BackgroundBeamsWithCollision className="min-h-screen via-background overflow-scroll scrollbar-hide items-start">
            <div className="min-h-screen flex flex-col bg-transparent overflow-scroll scrollbar-hide items-start">
                <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-16 bg-transparent shadow-lg overflow-scroll scrollbar-hide">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-6xl mx-auto rounded-2xl shadow-xl border border-border p-8 space-y-8"
                    >
                        <div className="text-center space-y-4">
                            <Shield className="mx-auto w-16 h-16 text-primary" />
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Privacy Policy
                            </h1>
                            <p className="text-muted-foreground">
                                Last updated: July 26, 2024
                            </p>
                        </div>

                        <section className="prose dark:prose-invert max-w-none space-y-6">
                            <p>
                                Your privacy is important to us. This Privacy Policy explains how CamEdu ("we," "us," or "our") collects, uses, discloses, and protects your information when you use our website, products, and services (collectively, the "Services").
                            </p>

                            <h2>1. Information We Collect</h2>
                            <p>
                                We collect various types of information in connection with the Services, including:
                            </p>
                            <ul>
                                <li>
                                    <strong>Personal Information:</strong> Such as your name, email address, payment information, and demographic information when you register for an account, enroll in a course, or contact us.
                                </li>
                                <li>
                                    <strong>Usage Data:</strong> Information about how you access and use the Services, including your IP address, browser type, operating system, pages viewed, and time spent on the Services.
                                </li>
                                <li>
                                    <strong>Course Data:</strong> Information related to your course progress, quiz scores, and interactions with course content.
                                </li>
                            </ul>

                            <h2>2. How We Use Your Information</h2>
                            <p>
                                We use the information we collect for various purposes, including to:
                            </p>
                            <ul>
                                <li>Provide, maintain, and improve our Services.</li>
                                <li>Process your transactions and manage your account.</li>
                                <li>Personalize your learning experience and recommend relevant content.</li>
                                <li>Communicate with you about your account, courses, and updates.</li>
                                <li>Monitor and analyze trends, usage, and activities in connection with our Services.</li>
                                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities.</li>
                            </ul>

                            <h2>3. Sharing Your Information</h2>
                            <p>
                                We may share your information with third parties in the following circumstances:
                            </p>
                            <ul>
                                <li>
                                    <strong>Service Providers:</strong> We may share your information with third-party vendors, consultants, and other service providers who perform services on our behalf.
                                </li>
                                <li>
                                    <strong>Legal Compliance:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.
                                </li>
                                <li>
                                    <strong>Business Transfers:</strong> In connection with any merger, sale of company assets, financing, or acquisition of all or a portion of our business by another company.
                                </li>
                            </ul>

                            <h2>4. Data Security</h2>
                            <p>
                                We implement reasonable security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
                            </p>

                            <h2>5. Your Choices</h2>
                            <p>
                                You have certain choices regarding your information:
                            </p>
                            <ul>
                                <li>You can update your account information at any time through your profile settings.</li>
                                <li>You can opt-out of receiving promotional emails from us by following the instructions in those emails.</li>
                            </ul>

                            <h2>6. Third-Party Links</h2>
                            <p>
                                Our Services may contain links to third-party websites that are not operated by us. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
                            </p>

                            <h2>7. Children's Privacy</h2>
                            <p>
                                Our Services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13.
                            </p>

                            <h2>8. Changes to This Privacy Policy</h2>
                            <p>
                                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
                            </p>

                            <h2>9. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us at support@camedu.com.
                            </p>
                        </section>
                    </motion.div>
                </main>
            </div>
        </BackgroundBeamsWithCollision>
    );
}