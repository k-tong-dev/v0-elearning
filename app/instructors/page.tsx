"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { Search, Users, Star, CheckCircle, Filter, Grid, List as ListIcon, ExternalLink } from "lucide-react"
import { getInstructors, Instructor } from "@/integrations/strapi/instructor"
import { getAvatarUrl } from "@/lib/getAvatarUrl"
import { QuantumAvatar } from "@/components/ui/quantum-avatar"
import { toast } from "sonner"

export default function InstructorsPage() {
    const router = useRouter()
    const [instructors, setInstructors] = useState<Instructor[]>([])
    const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const [filterVerified, setFilterVerified] = useState<boolean | null>(null)

    useEffect(() => {
        const fetchInstructors = async () => {
            setIsLoading(true)
            try {
                const data = await getInstructors()
                setInstructors(data)
                setFilteredInstructors(data)
            } catch (error) {
                console.error("Error fetching instructors:", error)
                toast.error("Failed to load instructors")
            } finally {
                setIsLoading(false)
            }
        }

        fetchInstructors()
    }, [])

    useEffect(() => {
        let filtered = instructors

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(instructor =>
                instructor.name?.toLowerCase().includes(query) ||
                instructor.bio?.toLowerCase().includes(query)
            )
        }

        // Verified filter
        if (filterVerified !== null) {
            filtered = filtered.filter(instructor => instructor.is_verified === filterVerified)
        }

        setFilteredInstructors(filtered)
    }, [searchQuery, filterVerified, instructors])

    const handleInstructorClick = (instructor: Instructor) => {
        router.push(`/instructors/${instructor.documentId || instructor.id}`)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
                <HeaderUltra />
                <div className="container mx-auto px-4 py-8 pt-24 flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            <HeaderUltra />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-primary/20 mb-6">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Expert Instructors
                        </span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Meet Our Instructors
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Learn from experienced professionals and industry experts who are passionate about teaching
                    </p>
                </motion.div>

                {/* Search and Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="relative flex-1 w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <Input
                                type="text"
                                placeholder="Search instructors by name or expertise..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-card/50 backdrop-blur-xl border-border"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant={filterVerified === null ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterVerified(null)}
                                className="flex items-center gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                All
                            </Button>
                            <Button
                                variant={filterVerified === true ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterVerified(filterVerified === true ? null : true)}
                                className="flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Verified
                            </Button>
                            <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-card/50">
                                <Button
                                    variant={viewMode === "grid" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("grid")}
                                    className="p-2"
                                >
                                    <Grid className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewMode === "list" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("list")}
                                    className="p-2"
                                >
                                    <ListIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Results count */}
                    <div className="mt-4 text-sm text-muted-foreground">
                        Showing {filteredInstructors.length} of {instructors.length} instructors
                    </div>
                </motion.div>

                {/* Instructors Grid/List */}
                {filteredInstructors.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 bg-card/50 backdrop-blur-xl border border-border rounded-xl"
                    >
                        <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">No Instructors Found</h3>
                        <p className="text-muted-foreground">
                            {searchQuery ? "Try adjusting your search terms" : "No instructors available at the moment"}
                        </p>
                    </motion.div>
                ) : (
                    <div className={viewMode === "grid" 
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                        : "space-y-4"
                    }>
                        {filteredInstructors.map((instructor, index) => (
                            <motion.div
                                key={instructor.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                onClick={() => handleInstructorClick(instructor)}
                                className={`bg-gradient-to-br from-card/50 via-purple-500/5 to-pink-500/5 backdrop-blur-xl border-2 border-purple-500/30 rounded-xl p-6 transition-all duration-300 cursor-pointer hover:border-purple-500/50 hover:shadow-xl ${
                                    viewMode === "list" ? "flex items-center gap-6" : ""
                                }`}
                            >
                                {viewMode === "grid" ? (
                                    <>
                                        <div className="flex flex-col items-center text-center mb-4">
                                            <QuantumAvatar
                                                src={getAvatarUrl(instructor.avatar)}
                                                alt={instructor.name}
                                                size="xl"
                                                variant="quantum"
                                                showStatus
                                                status={instructor.is_active ? "online" : "offline"}
                                                verified={instructor.is_verified}
                                                interactive
                                            />
                                            <div className="mt-4">
                                                <div className="flex items-center justify-center gap-2 mb-1">
                                                    <h3 className="text-lg font-bold text-foreground">{instructor.name}</h3>
                                                    {instructor.is_verified && (
                                                        <CheckCircle className="w-4 h-4 text-blue-500" />
                                                    )}
                                                </div>
                                                {instructor.rating !== undefined && instructor.rating > 0 && (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                        <span className="text-sm font-semibold">{instructor.rating.toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {instructor.bio && (
                                            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 text-center">
                                                {instructor.bio}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center justify-center gap-2">
                                            <Badge variant={instructor.is_active ? "default" : "secondary"}>
                                                {instructor.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                            {instructor.is_verified && (
                                                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                                    Verified
                                                </Badge>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <QuantumAvatar
                                            src={getAvatarUrl(instructor.avatar)}
                                            alt={instructor.name}
                                            size="lg"
                                            variant="quantum"
                                            showStatus
                                            status={instructor.is_active ? "online" : "offline"}
                                            verified={instructor.is_verified}
                                            interactive
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-xl font-bold text-foreground">{instructor.name}</h3>
                                                {instructor.is_verified && (
                                                    <CheckCircle className="w-5 h-5 text-blue-500" />
                                                )}
                                            </div>
                                            {instructor.bio && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                    {instructor.bio}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4">
                                                {instructor.rating !== undefined && instructor.rating > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                        <span className="text-sm font-semibold">{instructor.rating.toFixed(1)}</span>
                                                    </div>
                                                )}
                                                <Badge variant={instructor.is_active ? "default" : "secondary"}>
                                                    {instructor.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleInstructorClick(instructor)
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            View Profile
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    )
}

