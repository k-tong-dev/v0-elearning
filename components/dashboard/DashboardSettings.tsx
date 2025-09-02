"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Crown, Settings, Loader2, Save } from "lucide-react"
import { ProfileSettingsForm } from "@/components/dashboard/ProfileSettingsForm"
import { motion } from "framer-motion"
import { UserRole, UserSettings } from "@/types/auth"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface DashboardStats {
    coursesCreated: number
}

interface CurrentUser {
    id: string
    name: string
    email: string
    avatar?: string
    bio?: string
    location?: string
    website?: string
    socialLinks?: {
        twitter?: string
        github?: string
        linkedin?: string
    }
    role?: UserRole
    settings?: UserSettings // Include settings here
    skills?: string[] // Added skills here
    badgeIds?: string[] // Add badgeIds here
    followers?: number; // Add followers count
    following?: number; // Add following count
}

interface DashboardSettingsProps {
    currentUser: CurrentUser
    stats: DashboardStats
}

export function DashboardSettings({ currentUser, stats }: DashboardSettingsProps) {
    const { user, refreshUser } = useAuth();

    // Provide default empty objects if settings or notifications are undefined
    const initialSettings = currentUser.settings || {};
    const initialNotifications = initialSettings.notifications || {};

    const [notificationSettings, setNotificationSettings] = useState({
        newEnrollments: initialNotifications.newEnrollments ?? true,
        courseReviews: initialNotifications.courseReviews ?? true,
        paymentNotifications: initialNotifications.paymentNotifications ?? true,
        weeklyAnalytics: initialNotifications.weeklyAnalytics ?? true,
    });
    const [isSavingNotifications, setIsSavingNotifications] = useState(false);

    useEffect(() => {
        setNotificationSettings({
            newEnrollments: currentUser.settings?.notifications?.newEnrollments ?? true,
            courseReviews: currentUser.settings?.notifications?.courseReviews ?? true,
            paymentNotifications: currentUser.settings?.notifications?.paymentNotifications ?? true,
            weeklyAnalytics: currentUser.settings?.notifications?.weeklyAnalytics ?? true,
        });
    }, [currentUser.settings]);

    const handleNotificationChange = (key: keyof typeof notificationSettings, checked: boolean) => {
        setNotificationSettings(prev => ({ ...prev, [key]: checked }));
    };

    const handleSaveNotifications = async () => {
        if (!user?.id) {
            toast.error("User not authenticated.")
            return
        }

        setIsSavingNotifications(true);
        try {
            const updatePayload = {
                name: currentUser.name, // Include name
                email: currentUser.email, // Include email
                // Include other profile fields if they are part of the currentUser and should be preserved
                bio: currentUser.bio,
                location: currentUser.location,
                website: currentUser.website,
                socialLinks: currentUser.socialLinks,
                role: currentUser.role,
                avatar: currentUser.avatar,
                settings: {
                    ...currentUser.settings, // Preserve other settings if any
                    notifications: notificationSettings,
                },
                badgeIds: currentUser.badgeIds, // Include badgeIds in the payload
            };

            const response = await fetch(`/api/users/${user.id}/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatePayload),
            });

            // Log raw response text if not OK
            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error Response (raw text):", errorText);
                throw new Error(errorText || "Failed to update notification settings.");
            }

            const data = await response.json();

            toast.success("Notification settings updated successfully!");
            await refreshUser(); // Refresh the global auth context
        } catch (error: any) {
            console.error("Error updating notification settings:", error);
            toast.error(error.message || "Failed to update notification settings.");
        } finally {
            setIsSavingNotifications(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard Settings</h2>

            <ProfileSettingsForm
                currentUser={{
                    ...currentUser,
                    skills: currentUser.settings?.skills || [], // Pass skills from settings
                    badgeIds: (user as any)?.badgeIds || [], // Pass badgeIds from the authenticated user
                    followers: currentUser.followers, // Pass followers
                    following: currentUser.following, // Pass following
                }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                        <CardTitle>Notification Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { key: "newEnrollments", label: "New enrollments", description: "Get notified when someone enrolls in your courses" },
                            { key: "courseReviews", label: "Course reviews", description: "Get notified when you receive new reviews" },
                            { key: "paymentNotifications", label: "Payment notifications", description: "Get notified about payments and earnings" },
                            { key: "weeklyAnalytics", label: "Weekly analytics", description: "Receive weekly analytics reports" }
                        ].map((setting) => (
                            <div key={setting.key} className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{setting.label}</div>
                                    <div className="text-sm text-muted-foreground">{setting.description}</div>
                                </div>
                                <Switch
                                    checked={notificationSettings[setting.key as keyof typeof notificationSettings]}
                                    onCheckedChange={(checked) => handleNotificationChange(setting.key as keyof typeof notificationSettings, checked)}
                                    className="data-[state=unchecked]:bg-gray-400"
                                />
                            </div>
                        ))}
                        <Button
                            onClick={handleSaveNotifications}
                            disabled={isSavingNotifications}
                            className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
                        >
                            {isSavingNotifications ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving Notifications...
                                </div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Notification Settings
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glass-enhanced hover:scale-[1.005] hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                        <CardTitle>Course Creation Limits</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-accent/50 rounded-lg">
                            <h4 className="font-medium mb-2">Current Plan: Basic</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Courses Created:</span>
                                    <span>{stats.coursesCreated}/50</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 bg-blue-500 rounded-full"
                                        style={{ width: `${(stats.coursesCreated / 50) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                            <Crown className="w-4 h-4 mr-2" />
                            Upgrade to Pro
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}