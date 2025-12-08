"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectItem, Avatar, Chip } from "@heroui/react";
import { getBadges, Badge as StrapiBadge } from "@/integrations/strapi/badge";

interface BadgesManagementProps {
    selectedBadgeIds: string[];
    onBadgesChange: (badgeIds: string[]) => void;
}

export function BadgesManagement({ selectedBadgeIds, onBadgesChange }: BadgesManagementProps) {
    const [allBadges, setAllBadges] = useState<StrapiBadge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                setLoading(true);
                const badges = await getBadges();
                const valid = Array.isArray(badges) ? badges : [];
                // Deduplicate by documentId (important for i18n data)
                const uniqueBadges = valid.filter((badge, index, self) => 
                    index === self.findIndex(b => b.documentId === badge.documentId)
                );
                setAllBadges(uniqueBadges);
            } catch (error) {
                console.error("Error fetching badges:", error);
                toast.error("Failed to load available badges.", {
                    position: "top-center",
                    action: {
                        label: "Close",
                        onClick: () => {},
                    },
                    closeButton: false,
                });
                setAllBadges([]);
            } finally {
                setLoading(false);
            }
        };
        fetchBadges();
    }, []);

    if (loading) {
        return <div className="py-3 text-sm text-muted-foreground">Loading badges...</div>;
    }

    // Filter selected keys to only those that exist in available badges
    const validSelectedKeys = selectedBadgeIds.filter(key => 
        allBadges.some(badge => badge.id.toString() === key)
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Badges</h3>
                <div className="text-xs text-muted-foreground">{validSelectedKeys.length} selected</div>
            </div>
            <Select
                classNames={{
                    base: "w-full",
                    trigger: "min-h-12 py-2",
                    popoverContent: "bg-card border-border shadow-lg rounded-xl max-w-[90vw] md:max-w-none",
                }}
                isMultiline={true}
                items={allBadges}
                label="Badges"
                labelPlacement="outside"
                placeholder="Select badges"
                selectedKeys={new Set(validSelectedKeys)}
                onSelectionChange={(keys) => {
                    onBadgesChange(Array.from(keys as Set<React.Key>).map(String));
                }}
                selectionMode="multiple"
                variant="bordered"
                renderValue={(items) => {
                    return (
                        <div className="flex flex-wrap gap-2">
                            {items.map((item) => {
                                const badgeData = allBadges.find(b => b.id.toString() === item.key);
                                if (!badgeData) return null;
                                return (
                                    <Chip
                                        key={item.key}
                                        onClose={() => onBadgesChange(validSelectedKeys.filter(id => id !== item.key))}
                                        variant="flat"
                                        color="default"
                                    >
                                        {badgeData.name}
                                    </Chip>
                                );
                            })}
                        </div>
                    );
                }}
            >
                {(badge) => (
                    <SelectItem key={badge.id.toString()} textValue={badge.name}>
                        <div className="flex gap-2 items-center">
                            <div className="flex flex-col">
                                <span className="text-small text-foreground">{badge.name}</span>
                            </div>
                        </div>
                    </SelectItem>
                )}
            </Select>
        </div>
    );
}