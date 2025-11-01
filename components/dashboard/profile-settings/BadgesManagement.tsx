"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { BadgeDefinition } from '@/types/db';
import { Select, SelectItem, Avatar, Chip } from "@heroui/react"; // Import HeroUI components

interface BadgesManagementProps {
    selectedBadgeIds: string[];
    onBadgesChange: (badgeIds: string[]) => void;
}

export function BadgesManagement({ selectedBadgeIds, onBadgesChange }: BadgesManagementProps) {
    const [allBadges, setAllBadges] = useState<BadgeDefinition[]>([]);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const mockBadges: BadgeDefinition[] = [
                    { id: "1", name: "Active Member", description: "Awarded for consistent activity", icon: "🌟", color: "bg-blue-500" },
                    { id: "2", name: "Community Leader", description: "Recognized for leading discussions", icon: "🏆", color: "bg-purple-500" },
                    { id: "3", name: "Expert", description: "Demonstrated expertise in a field", icon: "✨", color: "bg-yellow-500" },
                    { id: "4", name: "Course Creator", description: "Published a course on the platform", icon: "📚", color: "bg-green-500" },
                    { id: "5", name: "Helper", description: "Provided valuable assistance to others", icon: "🤝", color: "bg-indigo-500" },
                    { id: "6", name: "Innovator", description: "Contributed new ideas or solutions", icon: "💡", color: "bg-red-500" },
                ];
                setAllBadges(mockBadges);
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
            }
        };
        fetchBadges();
    }, []);

    const handleSelectionChange = (keys: Set<React.Key>) => {
        onBadgesChange(Array.from(keys).map(String));
    };

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Badges</h3>
            <Select
                classNames={{
                    base: "w-full",
                    trigger: "min-h-12 py-2 border-2 hover:border-primary transition-colors rounded-lg",
                    value: "text-foreground",
                    popoverContent: "bg-card border-border shadow-lg rounded-xl",
                }}
                isMultiline={true}
                items={allBadges}
                labelPlacement="outside"
                placeholder="Select badges"
                selectedKeys={new Set(selectedBadgeIds)}
                onSelectionChange={handleSelectionChange}
                selectionMode="multiple"
                variant="bordered"
                renderValue={(items) => {
                    return (
                        <div className="flex flex-wrap gap-2">
                            {items.map((item) => {
                                const badgeData = allBadges.find(b => b.id === item.key);
                                if (!badgeData) return null;
                                return (
                                    <Chip
                                        key={item.key}
                                        className={`${badgeData.color}/20 text-foreground dark:text-foreground`}
                                        avatar={<Avatar icon={<span>{badgeData.icon}</span>} />}
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
                    <SelectItem key={badge.id} textValue={badge.name}>
                        <div className="flex gap-2 items-center">
                            <Avatar icon={<span>{badge.icon}</span>} className="shrink-0" size="sm" />
                            <div className="flex flex-col">
                                <span className="text-small text-foreground">{badge.name}</span>
                                <span className="text-tiny text-default-400">{badge.description}</span>
                            </div>
                        </div>
                    </SelectItem>
                )}
            </Select>
        </div>
    );
}