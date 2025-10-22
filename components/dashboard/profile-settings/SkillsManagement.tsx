"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, XCircle, Check } from "lucide-react"
import { cn } from "@/utils/utils"
import { toast } from "sonner"

interface SkillsManagementProps {
    selectedSkills: string[]
    onSkillsChange: (skills: string[]) => void
}

export function SkillsManagement({ selectedSkills, onSkillsChange }: SkillsManagementProps) {
    const [newSkillInput, setNewSkillInput] = useState("");
    const [availableSkills, setAvailableSkills] = useState<string[]>([]);
    const [openSkillCombobox, setOpenSkillCombobox] = useState(false);
    const popularSuggestions = ["React", "TypeScript", "Node.js", "UI/UX", "Next.js", "MongoDB"];

    useEffect(() => {
        const fetchSkills = async () => {
            try {
                const response = await fetch('/api/skills');
                if (!response.ok) {
                    throw new Error('Failed to fetch skills');
                }
                const data: string[] = await response.json();
                setAvailableSkills(data);
            } catch (error) {
                console.error("Error fetching skills:", error);
                toast.error("Failed to load available skills.", {
                    position: "top-center",
                    action: {
                        label: "Close",
                        onClick: () => {},
                    },
                    closeButton: false,
                });
            }
        };
        fetchSkills();
    }, []);

    const handleToggleSkill = (skillToToggle: string) => {
        const trimmedSkill = skillToToggle.trim();
        if (!trimmedSkill) return;

        const newSkills = selectedSkills.includes(trimmedSkill)
            ? selectedSkills.filter(skill => skill !== trimmedSkill)
            : [...selectedSkills, trimmedSkill];

        onSkillsChange(newSkills);
        setNewSkillInput("");
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        onSkillsChange(selectedSkills.filter(skill => skill !== skillToRemove));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Skills</h3>
                <div className="text-xs text-muted-foreground">{selectedSkills.length} selected</div>
            </div>
            <Popover open={openSkillCombobox} onOpenChange={setOpenSkillCombobox}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openSkillCombobox}
                        className="h-9 w-full justify-between rounded-md border hover:border-primary/70 transition-colors"
                    >
                        {newSkillInput || "Search or add a skill"}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search skills..."
                            value={newSkillInput}
                            onValueChange={setNewSkillInput}
                            className="border-b-0 focus:ring-0 focus-visible:ring-0"
                        />
                        <CommandList className="max-h-56 overflow-auto">
                            <CommandEmpty>No skill found.</CommandEmpty>
                            <CommandGroup heading="Suggestions">
                                {popularSuggestions.map((skill) => (
                                    <CommandItem
                                        key={skill}
                                        value={skill}
                                        onSelect={(currentValue) => handleToggleSkill(currentValue)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedSkills.includes(skill) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {skill}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            <CommandGroup heading="All Skills">
                                {availableSkills
                                    .filter((skill) => skill.toLowerCase().includes(newSkillInput.toLowerCase()))
                                    .map((skill) => (
                                        <CommandItem
                                            key={skill}
                                            value={skill}
                                            onSelect={(currentValue) => handleToggleSkill(currentValue)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedSkills.includes(skill) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {skill}
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-2 py-0.5 text-xs bg-emerald-50/20 text-emerald-700 dark:text-emerald-300">
                        {skill}
                        <XCircle className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleRemoveSkill(skill)} />
                    </Badge>
                ))}
            </div>
        </div>
    )
}