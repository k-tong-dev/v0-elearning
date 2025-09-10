"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function BlogNewsletterSignup() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16"
        >
            <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10">
                <CardContent className="p-8 text-center">
                    <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                        Get the latest articles and tutorials delivered directly to your inbox.
                        Join thousands of developers staying ahead of the curve.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <Input
                            placeholder="Enter your email..."
                            className="flex-1"
                        />
                        <Button className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600">
                            Subscribe
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}