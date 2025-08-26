"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function CourseSkeleton() {
  return (
    <Card className="group">
      <CardHeader className="p-0">
        <Skeleton className="w-full h-48 rounded-t-lg" />
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-2">
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      </CardFooter>
    </Card>
  )
}
