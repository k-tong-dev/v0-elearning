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
                setAvailableSkills(valid);
                onAvailableSkills?.(valid);
            } catch (err) {
                toast.error("Failed to load skills");
                setAvailableSkills([]);
                onAvailableSkills?.([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSkills();
    }, [onAvailableSkills]);

    const handleChange = (keys: Set<React.Key>) => {
        onSkillsChange(Array.from(keys).map(String));
    };

    if (loading) {
        return <div className="py-3 text-sm text-muted-foreground">Loading skills...</div>;
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Skills</h3>
                <div className="text-xs text-muted-foreground">{selectedSkills.length} selected</div>
            </div>

            <Select
                items={availableSkills}
                selectedKeys={new Set(selectedSkills)}
                onSelectionChange={handleChange}
                selectionMode="multiple"
                placeholder="Search or add a skill"
                classNames={{
                    trigger: "min-h-12 py-2 border-2 hover:border-primary rounded-lg",
                    popoverContent: "bg-card border-border shadow-lg rounded-xl",
                }}
                renderValue={(items) => (
                    <div className="flex flex-wrap gap-2">
                        {items.map((item) => {
                            const skill = availableSkills.find(s => s.documentId === item.key);
                            return (
                                <Chip
                                    key={item.key}
                                    onClose={() => onSkillsChange(selectedSkills.filter(id => id !== item.key))}
                                    className="bg-emerald-50/20 text-emerald-700 dark:text-emerald-300"
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