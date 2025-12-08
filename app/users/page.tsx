"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { HeaderUltra } from "@/components/ui/headers/HeaderUltra"
import { Footer } from "@/components/ui/footers/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  Search,
  Star,
  MessageCircle,
  Trophy,
  TrendingUp,
  Calendar,
  MapPin,
  Filter,
  SortAsc,
  UserPlus,
  Crown
} from "lucide-react"
import { motion } from "framer-motion"

interface User {
  id: string
  name: string
  username: string
  avatar?: string
  role: string
  bio: string
  location?: string
  joinDate: string
  isOnline: boolean
  stats: {
    posts: number
    reputation: number
    followers: number
    coursesCreated: number
  }
  badges: string[]
  isVerified: boolean
}

export default function UsersDirectoryPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [sortBy, setSortBy] = useState("reputation")
  const [selectedLocation, setSelectedLocation] = useState("all")

  // Mock users data
  const users: User[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      username: "@sarahjohnson",
      avatar: "/images/Avatar.jpg",
      role: "Student",
      bio: "Passionate web developer learning React and Node.js. Love building user-friendly applications.",
      location: "San Francisco, CA",
      joinDate: "March 2024",
      isOnline: true,
      stats: {
        posts: 15,
        reputation: 485,
        followers: 23,
        coursesCreated: 0
      },
      badges: ["First Post", "Helper", "Active Member"],
      isVerified: false
    },
    {
      id: "2",
      name: "Mike Chen",
      username: "@mikechen",
      avatar: "/images/Avatar.jpg",
      role: "Mentor",
      bio: "Senior Full-Stack Developer with 8+ years of experience. Love helping newcomers in tech.",
      location: "New York, NY",
      joinDate: "January 2023",
      isOnline: true,
      stats: {
        posts: 156,
        reputation: 1240,
        followers: 89,
        coursesCreated: 3
      },
      badges: ["Expert", "Top Contributor", "Course Creator"],
      isVerified: true
    },
    {
      id: "3",
      name: "Emma Rodriguez",
      username: "@emmarodriguez",
      avatar: "/images/Avatar.jpg",
      role: "Expert",
      bio: "UX/UI Designer and Frontend Developer. Specializing in modern design systems and accessibility.",
      location: "Austin, TX",
      joinDate: "October 2022",
      isOnline: false,
      stats: {
        posts: 289,
        reputation: 2150,
        followers: 156,
        coursesCreated: 8
      },
      badges: ["Design Master", "Top Contributor", "Course Creator", "Community Leader"],
      isVerified: true
    },
    {
      id: "4",
      name: "Alex Thompson",
      username: "@alexthompson",
      avatar: "/images/Avatar.jpg",
      role: "Student",
      bio: "Computer Science student passionate about machine learning and AI development.",
      location: "Seattle, WA",
      joinDate: "June 2024",
      isOnline: true,
      stats: {
        posts: 45,
        reputation: 320,
        followers: 12,
        coursesCreated: 0
      },
      badges: ["Quick Learner", "AI Enthusiast"],
      isVerified: false
    },
    {
      id: "5",
      name: "David Park",
      username: "@davidpark",
      avatar: "/images/Avatar.jpg",
      role: "Student",
      bio: "Career changer from marketing to web development. Always eager to learn and share knowledge.",
      location: "Chicago, IL",
      joinDate: "April 2024",
      isOnline: false,
      stats: {
        posts: 28,
        reputation: 195,
        followers: 8,
        coursesCreated: 0
      },
      badges: ["Career Changer", "Dedicated Learner"],
      isVerified: false
    },
    {
      id: "6",
      name: "Lisa Wang",
      username: "@lisawang",
      avatar: "/images/Avatar.jpg",
      role: "Mentor",
      bio: "Mobile app developer and tech entrepreneur. Founded 2 startups, now helping others build theirs.",
      location: "Los Angeles, CA",
      joinDate: "February 2023",
      isOnline: true,
      stats: {
        posts: 98,
        reputation: 890,
        followers: 67,
        coursesCreated: 2
      },
      badges: ["Entrepreneur", "Mobile Expert", "Mentor"],
      isVerified: true
    }
  ]

  const roles = ["all", "Student", "Mentor", "Expert", "Administrator"]
  const locations = ["all", "San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Chicago, IL", "Los Angeles, CA"]

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.bio.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    const matchesLocation = selectedLocation === "all" || user.location === selectedLocation

    return matchesSearch && matchesRole && matchesLocation
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case "reputation":
        return b.stats.reputation - a.stats.reputation
      case "posts":
        return b.stats.posts - a.stats.posts
      case "followers":
        return b.stats.followers - a.stats.followers
      case "newest":
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
      case "oldest":
        return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime()
      default:
        return 0
    }
  })

  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <HeaderUltra />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Community Members
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover and connect with talented developers, mentors, and learners in our community
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{users.length} Total Members</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>{users.filter(u => u.isOnline).length} Online Now</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span>{users.filter(u => u.isVerified).length} Verified</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Role Filter */}
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <SelectValue placeholder="All Roles" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>
                        {role === "all" ? "All Roles" : role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Location Filter */}
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <SelectValue placeholder="All Locations" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location === "all" ? "All Locations" : location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <SortAsc className="w-4 h-4" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reputation">Highest Reputation</SelectItem>
                    <SelectItem value="posts">Most Posts</SelectItem>
                    <SelectItem value="followers">Most Followers</SelectItem>
                    <SelectItem value="newest">Newest Members</SelectItem>
                    <SelectItem value="oldest">Oldest Members</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Showing {sortedUsers.length} of {users.length} members
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Top Contributors
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="group"
            >
              <Card 
                className="h-full hover:shadow-lg transition-all hover:scale-105 cursor-pointer relative overflow-hidden"
                onClick={() => handleUserClick(user.id)}
              >
                {/* Online indicator */}
                {user.isOnline && (
                  <div className="absolute top-4 right-4 w-3 h-3 bg-green-500 rounded-full animate-pulse z-10"></div>
                )}

                {/* Verified badge */}
                {user.isVerified && (
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-blue-500 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                )}

                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Profile Section */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-16 h-16 border-2 border-background shadow-lg">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="text-lg">
                            {user.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        {user.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-background rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {user.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{user.username}</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            user.role === 'Expert' ? 'border-purple-500 text-purple-700' :
                            user.role === 'Mentor' ? 'border-blue-500 text-blue-700' :
                            'border-green-500 text-green-700'
                          }`}
                        >
                          {user.role}
                        </Badge>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {user.bio}
                    </p>

                    {/* Location & Join Date */}
                    <div className="space-y-2">
                      {user.location && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{user.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Joined {user.joinDate}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-2 rounded-lg bg-accent/30">
                        <div className="text-lg font-bold text-blue-500">{user.stats.reputation}</div>
                        <div className="text-xs text-muted-foreground">Reputation</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-accent/30">
                        <div className="text-lg font-bold text-purple-600">{user.stats.posts}</div>
                        <div className="text-xs text-muted-foreground">Posts</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UserPlus className="w-3 h-3" />
                        {user.stats.followers} followers
                      </span>
                      {user.stats.coursesCreated > 0 && (
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {user.stats.coursesCreated} courses
                        </span>
                      )}
                    </div>

                    {/* Badges */}
                    {user.badges.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Badges</div>
                        <div className="flex flex-wrap gap-1">
                          {user.badges.slice(0, 3).map((badge, badgeIndex) => (
                            <Badge 
                              key={badgeIndex} 
                              variant="secondary" 
                              className="text-xs py-0.5 px-2"
                            >
                              {badge}
                            </Badge>
                          ))}
                          {user.badges.length > 3 && (
                            <Badge variant="outline" className="text-xs py-0.5 px-2">
                              +{user.badges.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUserClick(user.id)
                        }}
                      >
                        View Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {sortedUsers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No members found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button 
              onClick={() => {
                setSearchQuery("")
                setSelectedRole("all")
                setSelectedLocation("all")
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        )}

        {/* Load More Button */}
        {sortedUsers.length > 0 && sortedUsers.length < users.length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-12"
          >
            <Button variant="outline" size="lg">
              Load More Members
            </Button>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  )
}
