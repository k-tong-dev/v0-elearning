// components/dashboard/profile-settings/SkillsManagement.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Chip, Select, SelectItem } from "@heroui/react";
import { toast } from "sonner";
import { getSkills, Skill } from "@/integrations/strapi/skill";

interface SkillsManagementProps {
    selectedSkills: string[];
    onSkillsChange: (skills: string[]) => void;
    onAvailableSkills?: (skills: Skill[]) => void;
}

export function SkillsManagement({
                                     selectedSkills,
                                     onSkillsChange,
                                     onAvailableSkills,
                                 }: SkillsManagementProps) {
    const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSkills = async () => {
            try {
                setLoading(true);
                const skills = await getSkills();
                const valid = Array.isArray(skills) ? skills : [];
                // Deduplicate by documentId (important for i18n data)
                const uniqueSkills = valid.filter((skill, index, self) => 
                    index === self.findIndex(s => s.documentId === skill.documentId)
                );
                setAvailableSkills(uniqueSkills);
                onAvailableSkills?.(uniqueSkills);
            } catch (err) {
                console.error("[SkillsManagement] Error loading skills:", err);
                toast.error("Failed to load skills");
                setAvailableSkills([]);
                onAvailableSkills?.([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only fetch once on mount

    if (loading) {
        return <div className="py-3 text-sm text-muted-foreground">Loading skills...</div>;
    }

    // Filter selected keys to only those that exist in available skills
    const validSelectedKeys = selectedSkills.filter(key => 
        availableSkills.some(skill => skill.documentId === key)
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Skills</h3>
                <div className="text-xs text-muted-foreground">{validSelectedKeys.length} selected</div>
            </div>

            <Select
                items={availableSkills}
                label="Select Skills"
                labelPlacement="outside"
                selectionMode="multiple"
                placeholder="Select skills"
                selectedKeys={new Set(validSelectedKeys)}
                onSelectionChange={(keys) => {
                    onSkillsChange(Array.from(keys as Set<React.Key>).map(String));
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
                            const skill = availableSkills.find(s => s.documentId === item.key);
                            return (
                                <Chip
                                    key={item.key}
                                    onClose={() => onSkillsChange(validSelectedKeys.filter(id => id !== item.key))}
                                    variant="flat"
                                    color="success"
                                >
                                    {skill?.name || "Unknown"}
                                </Chip>
                            );
                        })}
                    </div>
                )}
            >
                {(skill) => (
                    <SelectItem key={skill.documentId} textValue={skill.name}>
                        <div className="flex items-center gap-2">
                            <span>{skill.name}</span>
                            {skill.code && <span className="text-xs text-muted-foreground">({skill.code})</span>}
                        </div>
                    </SelectItem>
                )}
            </Select>
        </div>
    );
}