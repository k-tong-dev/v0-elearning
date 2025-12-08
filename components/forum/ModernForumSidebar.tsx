"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, TrendingUp, Users, MessageCircle } from "lucide-react";
import { ForumCategory } from "@/integrations/strapi/forum";

interface ModernForumSidebarProps {
  categories: ForumCategory[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onCreatePost: () => void;
  totalPosts: number;
  publishedPosts: number;
  pinnedPosts: number;
}

export function ModernForumSidebar({
  categories,
  selectedCategory,
  onCategoryChange,
  onCreatePost,
  totalPosts,
  publishedPosts,
  pinnedPosts,
}: ModernForumSidebarProps) {
  return (
    <div className="lg:col-span-3 space-y-4 sticky top-24 self-start">
      {/* Categories */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          <Button
            variant={selectedCategory === "all" ? "default" : "ghost"}
            className="w-full justify-start font-medium"
            onClick={() => onCategoryChange("all")}
          >
            All Categories
          </Button>
          {categories.map((category) => {
            const categoryId = category.slug || category.name;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === categoryId ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onCategoryChange(categoryId)}
              >
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      category.color || "bg-blue-500"
                    }`}
                  />
                  <span className="flex-1 text-left">{category.slug || category.name}</span>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Forum Stats */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Forum Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Posts</span>
            <span className="font-semibold">{totalPosts}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Published</span>
            <span className="font-semibold text-green-600">{publishedPosts}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pinned</span>
            <span className="font-semibold text-blue-600">{pinnedPosts}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

