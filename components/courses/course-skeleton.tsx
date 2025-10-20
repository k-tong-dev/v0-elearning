import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function CourseSkeleton() {
    return (
        <Card className="group py-0 border-2 relative overflow-hidden bg-white/50 dark:bg-transparent backdrop-blur-sm">
            <CardHeader className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                    <Skeleton className="w-full h-52 rounded-t-lg" />

                    <div className="absolute top-4 left-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                    </div>

                    <div className="absolute bottom-4 left-4">
                        <Skeleton className="w-20 h-6 rounded-full" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                    <Skeleton className="w-24 h-5 rounded" />
                    <Skeleton className="w-20 h-4 rounded" />
                </div>

                <div className="mb-3">
                    <Skeleton className="w-full h-6 rounded mb-2" />
                    <Skeleton className="w-3/4 h-6 rounded" />
                </div>

                <div className="mb-4">
                    <Skeleton className="w-full h-4 rounded mb-1" />
                    <Skeleton className="w-5/6 h-4 rounded" />
                </div>

                <div className="flex gap-2 mb-4">
                    <Skeleton className="w-16 h-5 rounded-full" />
                    <Skeleton className="w-20 h-5 rounded-full" />
                    <Skeleton className="w-18 h-5 rounded-full" />
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center gap-1">
                        <Skeleton className="w-4 h-4 rounded" />
                        <Skeleton className="w-8 h-4 rounded" />
                    </div>
                    <div className="flex items-center gap-1">
                        <Skeleton className="w-4 h-4 rounded" />
                        <Skeleton className="w-12 h-4 rounded" />
                    </div>
                    <div className="flex items-center gap-1">
                        <Skeleton className="w-4 h-4 rounded" />
                        <Skeleton className="w-10 h-4 rounded" />
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-6 pt-0">
                <div className="flex flex-col gap-4 items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-16 h-8 rounded" />
                        <Skeleton className="w-12 h-4 rounded" />
                    </div>
                    <Skeleton className="w-full h-10 rounded-lg" />
                </div>
            </CardFooter>
        </Card>
    )
}
