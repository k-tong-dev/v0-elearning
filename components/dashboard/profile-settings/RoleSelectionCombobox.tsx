"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Briefcase, BookOpen, Building2, Sparkles, Code, Palette } from "lucide-react";
import { UserRoleSlug } from "@/types/user";
import { Select, SelectItem, Avatar, Chip } from "@heroui/react"; // Import HeroUI components

interface RoleSelectionComboboxProps {
    charactor: UserRoleSlug;
    onCharactorChange: (charactor: UserRoleSlug) => void;
}

const charactorOptions: { value: UserRoleSlug; label: string; icon: React.ElementType }[] = [
    { value: "student", label: "Student", icon: BookOpen },
    { value: "instructor", label: "Instructor", icon: Briefcase },
    { value: "company", label: "Company", icon: Building2 },
    { value: "job_seeker", label: "Job Seeker", icon: Briefcase },
    { value: "developer", label: "Developer", icon: Code },
    { value: "designer", label: "Designer", icon: Palette },
    { value: "other", label: "Other", icon: Sparkles },
];

export function RoleSelectionCombobox({ charactor, onCharactorChange }: RoleSelectionComboboxProps) {
    const selectedCharactorData = charactorOptions.find((option) => option.value === charactor);

    return (
        <div className="space-y-2">
            <Label>
                <Briefcase className="w-4 h-4 mr-2 text-purple-500" />
                Your Character
            </Label>
            <Select
                classNames={{
                    base: "w-full",
                    trigger: "min-h-12 py-2 border-2 hover:border-primary transition-colors rounded-lg",
                    value: "text-foreground",
                    popoverContent: "bg-card border-border shadow-lg rounded-xl",
                }}
                items={charactorOptions}
                labelPlacement="outside"
                placeholder="Select a character"
                selectedKeys={charactor ? new Set([charactor]) : new Set()}
                onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys).shift() as UserRoleSlug | undefined;
                    if (selectedKey) {
                        onCharactorChange(selectedKey);
                    }
                }}
                selectionMode="single"
                variant="bordered"
                renderValue={(items) => {
                    const item = items.find((i) => i.key === charactor);
                    if (!item) return "Select a character...";
                    const IconComponent = charactorOptions.find(opt => opt.value === item.key)?.icon;
                    return (
                        <Chip
                            key={item.key}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium"
                            avatar={IconComponent ? <Avatar icon={<IconComponent className="w-4 h-4" />} /> : undefined}
                        >
                            {item.data.label}
                        </Chip>
                    );
                }}
            >
                {(option) => {
                    const IconComponent = option.icon;
                    return (
                        <SelectItem key={option.value} textValue={option.label}>
                            <div className="flex gap-2 items-center">
                                {IconComponent && <IconComponent className="w-5 h-5 text-muted-foreground" />}
                                <div className="flex flex-col">
                                    <span className="text-small text-foreground">{option.label}</span>
                                </div>
                            </div>
                        </SelectItem>
                    );
                }}
            </Select>
        </div>
    );
}