"use client";

import React, { useState, useEffect } from "react";
import { Chip, Select, SelectItem } from "@heroui/react";
import { toast } from "sonner";
import { getInteresteds, Interested } from "@/integrations/strapi/interested";

interface InterestedsManagementProps {
    selectedInterestedIds: string[];
    onInterestedsChange: (ids: string[]) => void;
}

export function InterestedsManagement({
    selectedInterestedIds,
    onInterestedsChange,
}: InterestedsManagementProps) {
    const [availableInterests, setAvailableInterests] = useState<Interested[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInterests = async () => {
            try {
                setLoading(true);
                const interests = await getInteresteds();
                const valid = Array.isArray(interests) ? interests : [];
                // Deduplicate by documentId (important for i18n data)
                const uniqueInterests = valid.filter((interest, index, self) => 
                    index === self.findIndex(i => i.documentId === interest.documentId)
                );
                setAvailableInterests(uniqueInterests);
            } catch (err) {
                console.error("Error fetching interests:", err);
                toast.error("Failed to load interests");
                setAvailableInterests([]);
            } finally {
                setLoading(false);
            }
        };
        fetchInterests();
    }, []);

    if (loading) {
        return <div className="py-3 text-sm text-muted-foreground">Loading interests...</div>;
    }

    // Filter selected keys to only those that exist in available interests
    const validSelectedKeys = selectedInterestedIds.filter(key => 
        availableInterests.some(interest => interest.id.toString() === key)
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Interests</h3>
                <div className="text-xs text-muted-foreground">{validSelectedKeys.length} selected</div>
            </div>

            <Select
                items={availableInterests}
                label="Interests"
                labelPlacement="outside"
                selectionMode="multiple"
                placeholder="Select your interests"
                selectedKeys={new Set(validSelectedKeys)}
                onSelectionChange={(keys) => {
                    onInterestedsChange(Array.from(keys as Set<React.Key>).map(String));
                }}
                variant="bordered"
                isMultiline={true}
                classNames={{
                    base: "w-full",
                    trigger: "min-h-12 py-2",
                    popoverContent: "bg-card border-border shadow-lg rounded-xl max-w-[90vw] md:max-w-none",
                }}
                renderValue={(items) => (
                    <div className="flex flex-wrap gap-2">
                        {items.map((item) => {
                            const interest = availableInterests.find(i => i.id.toString() === item.key);
                            return (
                                <Chip
                                    key={item.key}
                                    onClose={() => onInterestedsChange(validSelectedKeys.filter(id => id !== item.key))}
                                    variant="flat"
                                    color="secondary"
                                >
                                    {interest?.name || "Unknown"}
                                </Chip>
                            );
                        })}
                    </div>
                )}
            >
                {(interest) => (
                    <SelectItem key={interest.id.toString()} textValue={interest.name}>
                        <div className="flex items-center gap-2">
                            <span>{interest.name}</span>
                        </div>
                    </SelectItem>
                )}
            </Select>
        </div>
    );
}

