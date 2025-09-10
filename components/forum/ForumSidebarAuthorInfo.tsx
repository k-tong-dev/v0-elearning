"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star } from "lucide-react";
import { User } from "@/types/forum";

interface ForumSidebarAuthorInfoProps {
    author: User;
    onUserClick: (userId: string) => void;
}

export function ForumSidebarAuthorInfo({ author, onUserClick }: ForumSidebarAuthorInfoProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Author</CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors"
                    onClick={() => onUserClick(author.id)}
                >
                    <div className="relative">
                        <Avatar className="w-12 h-12">
                            <AvatarImage src={author.avatar} />
                            <AvatarFallback>
                                {author.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                        </Avatar>
                        {author.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                        )}
                    </div>

                    <div>
                        <h4 className="font-semibold">{author.name}</h4>
                        <Badge variant="outline" className="text-xs">
                            {author.role}
                        </Badge>
                    </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Joined</span>
                        <span>{author.joinDate}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Posts</span>
                        <span>{author.postCount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Reputation</span>
                        <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            {author.reputation}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}