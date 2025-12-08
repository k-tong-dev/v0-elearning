"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getAvatarUrl } from "@/lib/getAvatarUrl";
import { Plus } from "lucide-react";

interface ForumPostCreatorProps {
  onCreatePost: () => void;
}

export function ForumPostCreator({ onCreatePost }: ForumPostCreatorProps) {
  const { user } = useAuth();
  const userAvatar = user ? getAvatarUrl(user.avatar) : "/images/Avatar.jpg";
  const userName = user?.name || user?.username || "Guest";
  // Extract role as string - handle both string and object cases
  const userRole = typeof user?.role === 'string' 
    ? user.role 
    : (user?.role?.name || user?.role?.type || "Student");

  return (
    <Card className="mb-6 border-0 shadow-sm bg-white dark:bg-gray-900">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              {userName.split(" ").map(n => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <Button
            variant="outline"
            className="flex-1 justify-start text-left text-muted-foreground hover:bg-accent hover:text-foreground h-12 border-dashed"
            onClick={onCreatePost}
          >
            <Plus className="w-4 h-4 mr-2" />
            Post as '{userRole}'
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

