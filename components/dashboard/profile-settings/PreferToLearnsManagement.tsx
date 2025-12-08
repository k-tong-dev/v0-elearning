"use client";

import React, { useState, useEffect } from "react";
import { Chip, Select, SelectItem } from "@heroui/react";
import { toast } from "sonner";
import { getPreferToLearns, PreferToLearn } from "@/integrations/strapi/preferToLearn";

interface PreferToLearnsManagementProps {
    selectedPreferToLearnIds: string[];
    onPreferToLearnsChange: (ids: string[]) => void;
}

export function PreferToLearnsManagement({
    selectedPreferToLearnIds,
    onPreferToLearnsChange,
}: PreferToLearnsManagementProps) {
    const [availableStyles, setAvailableStyles] = useState<PreferToLearn[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStyles = async () => {
            try {
                setLoading(true);
                const styles = await getPreferToLearns();
                const valid = Array.isArray(styles) ? styles : [];
                // Deduplicate by documentId (important for i18n data)
                const uniqueStyles = valid.filter((style, index, self) => 
                    index === self.findIndex(s => s.documentId === style.documentId)
                );
                setAvailableStyles(uniqueStyles);
            } catch (err) {
                console.error("Error fetching learning styles:", err);
                toast.error("Failed to load learning styles");
                setAvailableStyles([]);
            } finally {
                setLoading(false);
            }
        };
        fetchStyles();
    }, []);

    if (loading) {
        return <div className="py-3 text-sm text-muted-foreground">Loading learning styles...</div>;
    }

    // Filter selected keys to only those that exist in available styles
    const validSelectedKeys = selectedPreferToLearnIds.filter(key => 
        availableStyles.some(style => style.id.toString() === key)
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Learning Styles</h3>
                <div className="text-xs text-muted-foreground">{validSelectedKeys.length} selected</div>
            </div>

            <Select
                items={availableStyles}
                label="Learning Styles"
                labelPlacement="outside"
                selectionMode="multiple"
                placeholder="Select your preferred learning styles"
                selectedKeys={new Set(validSelectedKeys)}
                onSelectionChange={(keys) => {
                    onPreferToLearnsChange(Array.from(keys as Set<React.Key>).map(String));
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
                            const style = availableStyles.find(s => s.id.toString() === item.key);
                            return (
                                <Chip
                                    key={item.key}
                                    onClose={() => onPreferToLearnsChange(validSelectedKeys.filter(id => id !== item.key))}
                                    variant="flat"
                                    color="warning"
                                >
                                    {style?.name || "Unknown"}
                                </Chip>
                            );
                        })}
                    </div>
                )}
            >
                {(style) => (
                    <SelectItem key={style.id.toString()} textValue={style.name}>
                        <div className="flex items-center gap-2">
                            <span>{style.name}</span>
                        </div>
                    </SelectItem>
                )}
            </Select>
        </div>
    );
}

