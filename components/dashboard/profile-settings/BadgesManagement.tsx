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
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { BadgeDefinition } from '@/types/db';

interface BadgesManagementProps {
    selectedBadgeIds: string[]
    onBadgesChange: (badgeIds: string[]) => void
}

export function BadgesManagement({ selectedBadgeIds, onBadgesChange }: BadgesManagementProps) {
    const [newBadgeInput, setNewBadgeInput] = useState("");
    const [allBadges, setAllBadges] = useState<BadgeDefinition[]>([]);
    const [openBadgeCombobox, setOpenBadgeCombobox] = useState(false);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const response = await fetch('/api/badges');
                if (!response.ok) {
                    throw new Error('Failed to fetch badges');
                }
                const data: BadgeDefinition[] = await response.json();
                setAllBadges(data);
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

    const handleToggleBadge = (badgeIdToToggle: string) => {
        if (!badgeIdToToggle) return;

        const newBadgeIds = selectedBadgeIds.includes(badgeIdToToggle)
            ? selectedBadgeIds.filter(id => id !== badgeIdToToggle)
            : [...selectedBadgeIds, badgeIdToToggle];

        onBadgesChange(newBadgeIds);
        setNewBadgeInput("");
    };

    const handleRemoveBadge = (badgeIdToRemove: string) => {
        onBadgesChange(selectedBadgeIds.filter(id => id !== badgeIdToRemove));
    };

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Badges</h3>
            <Popover open={openBadgeCombobox} onOpenChange={setOpenBadgeCombobox}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openBadgeCombobox}
                        className="w-full justify-between rounded-lg border-2 hover:border-primary transition-colors"
                    >
                        {newBadgeInput || "Select a badge..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search badges..."
                            value={newBadgeInput}
                            onValueChange={setNewBadgeInput}
                            className="border-b-0 focus:ring-0 focus-visible:ring-0"
                        />
                        <CommandList>
                            <CommandEmpty>No badge found.</CommandEmpty>
                            <CommandGroup>
                                {allBadges
                                    .filter(
                                        (badge) =>
                                            badge.name.toLowerCase().includes(newBadgeInput.toLowerCase())
                                    )
                                    .map((badge) => (
                                        <CommandItem
                                            key={badge.id}
                                            value={badge.id!}
                                            onSelect={(currentValue) => {
                                                handleToggleBadge(currentValue);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedBadgeIds.includes(badge.id!) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <span className="mr-2">{badge.icon}</span>
                                            {badge.name}
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <div className="flex flex-wrap gap-2 mt-2">
                {selectedBadgeIds.map((badgeId, index) => {
                    const badge = allBadges.find(b => b.id === badgeId);
                    if (!badge) return null;
                    return (
                        <Badge key={index} variant="secondary" className={`${badge.color}/20 text-foreground dark:text-foreground`}>
                            <span className="mr-1">{badge.icon}</span>
                            {badge.name}
                            <XCircle className="w-3 h-3 ml-1 cursor-pointer" onClick={() => handleRemoveBadge(badge.id!)} />
                        </Badge>
                    );
                })}
            </div>
        </div>
    )
}