"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectItem, Avatar, Chip } from "@heroui/react"; // Import HeroUI components

interface SkillDefinition {
    id: string;
    name: string;
    icon?: string; // Optional icon for skills
}

interface SkillsManagementProps {
    selectedSkills: string[];
    onSkillsChange: (skills: string[]) => void;
}

export function SkillsManagement({ selectedSkills, onSkillsChange }: SkillsManagementProps) {
    const [availableSkills, setAvailableSkills] = useState<SkillDefinition[]>([]);

    useEffect(() => {
        const fetchSkills = async () => {
            try {
                // Mock API call for available skills
                const mockSkills: SkillDefinition[] = [
                    { id: "html", name: "HTML" }, { id: "css", name: "CSS" }, { id: "javascript", name: "JavaScript" },
                    { id: "react", name: "React" }, { id: "vuejs", name: "Vue.js" }, { id: "angular", name: "Angular" },
                    { id: "nodejs", name: "Node.js" }, { id: "python", name: "Python" }, { id: "java", name: "Java" },
                    { id: "csharp", name: "C#" }, { id: "go", name: "Go" }, { id: "php", name: "PHP" },
                    { id: "ruby", name: "Ruby" }, { id: "sql", name: "SQL" }, { id: "mongodb", name: "MongoDB" },
                    { id: "postgresql", name: "PostgreSQL" }, { id: "aws", name: "AWS" }, { id: "azure", name: "Azure" },
                    { id: "gcp", name: "GCP" }, { id: "docker", name: "Docker" }, { id: "kubernetes", name: "Kubernetes" },
                    { id: "git", name: "Git" }, { id: "figma", name: "Figma" }, { id: "sketch", name: "Sketch" },
                    { id: "adobexd", name: "Adobe XD" }, { id: "uiux", name: "UI/UX Design" },
                    { id: "machinelearning", name: "Machine Learning" }, { id: "datascience", name: "Data Science" },
                    { id: "cybersecurity", name: "Cybersecurity" }, { id: "cloudcomputing", name: "Cloud Computing" },
                    { id: "mobiledev", name: "Mobile Development" }, { id: "frontenddev", name: "Frontend Development" },
                    { id: "backenddev", name: "Backend Development" }, { id: "fullstackdev", name: "Fullstack Development" },
                    { id: "devops", name: "DevOps" }, { id: "blockchain", name: "Blockchain" },
                    { id: "typescript", name: "TypeScript" }, { id: "nextjs", name: "Next.js" }, { id: "graphql", name: "GraphQL" },
                    { id: "restapis", name: "REST APIs" }, { id: "tailwindcss", name: "Tailwind CSS" }, { id: "sass", name: "Sass" },
                    { id: "webpack", name: "Webpack" }, { id: "babel", name: "Babel" }
                ];
                setAvailableSkills(mockSkills);
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

    const handleSelectionChange = (keys: Set<React.Key>) => {
        onSkillsChange(Array.from(keys).map(String));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Skills</h3>
                <div className="text-xs text-muted-foreground">{selectedSkills.length} selected</div>
            </div>
            <Select
                classNames={{
                    base: "w-full",
                    trigger: "min-h-12 py-2 border-2 hover:border-primary transition-colors rounded-lg",
                    value: "text-foreground",
                    popoverContent: "bg-card border-border shadow-lg rounded-xl",
                }}
                isMultiline={true}
                items={availableSkills}
                labelPlacement="outside"
                placeholder="Search or add a skill"
                selectedKeys={new Set(selectedSkills)}
                onSelectionChange={handleSelectionChange}
                selectionMode="multiple"
                variant="bordered"
                renderValue={(items) => {
                    return (
                        <div className="flex flex-wrap gap-2">
                            {items.map((item) => (
                                <Chip
                                    key={item.key}
                                    className="bg-emerald-50/20 text-emerald-700 dark:text-emerald-300"
                                >
                                    {item.data.name}
                                </Chip>
                            ))}
                        </div>
                    );
                }}
            >
                {(skill) => (
                    <SelectItem key={skill.id} textValue={skill.name}>
                        <div className="flex gap-2 items-center">
                            {/* You can add icons here if your skill data includes them */}
                            <div className="flex flex-col">
                                <span className="text-small text-foreground">{skill.name}</span>
                            </div>
                        </div>
                    </SelectItem>
                )}
            </Select>
        </div>
    );
}