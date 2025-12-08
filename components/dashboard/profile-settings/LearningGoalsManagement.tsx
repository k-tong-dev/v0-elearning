"use client";

import React, { useState, useEffect } from "react";
import { Chip, Select, SelectItem } from "@heroui/react";
import { toast } from "sonner";
import { getLearningGoals, LearningGoal } from "@/integrations/strapi/learningGoal";

interface LearningGoalsManagementProps {
    selectedLearningGoalIds: string[];
    onLearningGoalsChange: (ids: string[]) => void;
}

export function LearningGoalsManagement({
    selectedLearningGoalIds,
    onLearningGoalsChange,
}: LearningGoalsManagementProps) {
    const [availableGoals, setAvailableGoals] = useState<LearningGoal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGoals = async () => {
            try {
                setLoading(true);
                const goals = await getLearningGoals();
                const valid = Array.isArray(goals) ? goals : [];
                // Deduplicate by documentId (important for i18n data)
                const uniqueGoals = valid.filter((goal, index, self) => 
                    index === self.findIndex(g => g.documentId === goal.documentId)
                );
                setAvailableGoals(uniqueGoals);
            } catch (err) {
                console.error("Error fetching learning goals:", err);
                toast.error("Failed to load learning goals");
                setAvailableGoals([]);
            } finally {
                setLoading(false);
            }
        };
        fetchGoals();
    }, []);

    if (loading) {
        return <div className="py-3 text-sm text-muted-foreground">Loading learning goals...</div>;
    }

    // Filter selected keys to only those that exist in available goals
    const validSelectedKeys = selectedLearningGoalIds.filter(key => 
        availableGoals.some(goal => goal.id.toString() === key)
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Learning Goals</h3>
                <div className="text-xs text-muted-foreground">{validSelectedKeys.length} selected</div>
            </div>

            <Select
                items={availableGoals}
                label="Learning Goals"
                labelPlacement="outside"
                selectionMode="multiple"
                placeholder="Select your learning goals"
                selectedKeys={new Set(validSelectedKeys)}
                onSelectionChange={(keys) => {
                    onLearningGoalsChange(Array.from(keys as Set<React.Key>).map(String));
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
                            const goal = availableGoals.find(g => g.id.toString() === item.key);
                            return (
                                <Chip
                                    key={item.key}
                                    onClose={() => onLearningGoalsChange(validSelectedKeys.filter(id => id !== item.key))}
                                    variant="flat"
                                    color="primary"
                                >
                                    {goal?.name || "Unknown"}
                                </Chip>
                            );
                        })}
                    </div>
                )}
            >
                {(goal) => (
                    <SelectItem key={goal.id.toString()} textValue={goal.name}>
                        <div className="flex items-center gap-2">
                            <span>{goal.name}</span>
                        </div>
                    </SelectItem>
                )}
            </Select>
        </div>
    );
}

