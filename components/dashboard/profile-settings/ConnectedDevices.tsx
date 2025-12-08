"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Monitor, Tablet, Laptop, Trash2, CheckCircle, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface Device {
    id: string
    name: string
    type: "mobile" | "desktop" | "tablet" | "laptop"
    browser: string
    os: string
    lastActive: Date
    isCurrent: boolean
    ip?: string
}

const getDeviceType = (userAgent: string): Device["type"] => {
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return "tablet"
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return "mobile"
    if (/laptop|macintosh/i.test(userAgent)) return "laptop"
    return "desktop"
}

const getDeviceIcon = (type: Device["type"]) => {
    switch (type) {
        case "mobile":
            return <Smartphone className="w-5 h-5" />
        case "tablet":
            return <Tablet className="w-5 h-5" />
        case "laptop":
            return <Laptop className="w-5 h-5" />
        default:
            return <Monitor className="w-5 h-5" />
    }
}

const getBrowserName = (userAgent: string): string => {
    if (userAgent.includes("Chrome")) return "Chrome"
    if (userAgent.includes("Firefox")) return "Firefox"
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari"
    if (userAgent.includes("Edge")) return "Edge"
    if (userAgent.includes("Opera")) return "Opera"
    return "Unknown"
}

const getOSName = (userAgent: string): string => {
    if (userAgent.includes("Windows")) return "Windows"
    if (userAgent.includes("Mac OS")) return "macOS"
    if (userAgent.includes("Linux")) return "Linux"
    if (userAgent.includes("Android")) return "Android"
    if (userAgent.includes("iOS")) return "iOS"
    return "Unknown"
}

const getDeviceName = (type: Device["type"], os: string, browser: string): string => {
    return `${os} - ${browser}`
}

export function ConnectedDevices() {
    const [devices, setDevices] = useState<Device[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadDevices()
    }, [])

    const loadDevices = () => {
        try {
            setIsLoading(true)
            const storedDevices = localStorage.getItem("connected_devices")
            const deviceList: Device[] = storedDevices ? JSON.parse(storedDevices) : []

            // Get current device info
            const userAgent = navigator.userAgent
            const currentDeviceType = getDeviceType(userAgent)
            const currentBrowser = getBrowserName(userAgent)
            const currentOS = getOSName(userAgent)
            const currentDeviceId = `${currentDeviceType}-${currentBrowser}-${Date.now()}`

            // Check if current device exists
            const currentDeviceExists = deviceList.some(d => {
                return d.type === currentDeviceType &&
                    d.browser === currentBrowser &&
                    d.os === currentOS
            })

            if (!currentDeviceExists) {
                const newDevice: Device = {
                    id: currentDeviceId,
                    name: getDeviceName(currentDeviceType, currentOS, currentBrowser),
                    type: currentDeviceType,
                    browser: currentBrowser,
                    os: currentOS,
                    lastActive: new Date(),
                    isCurrent: true,
                }

                deviceList.unshift(newDevice)
            } else {
                // Update last active for current device
                deviceList.forEach(device => {
                    if (device.type === currentDeviceType &&
                        device.browser === currentBrowser &&
                        device.os === currentOS) {
                        device.lastActive = new Date()
                        device.isCurrent = true
                    } else {
                        device.isCurrent = false
                    }
                })
            }

            // Sort by last active (current device first)
            deviceList.sort((a, b) => {
                if (a.isCurrent) return -1
                if (b.isCurrent) return 1
                return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
            })

            // Limit to last 10 devices
            const limitedDevices = deviceList.slice(0, 10)

            setDevices(limitedDevices)
            localStorage.setItem("connected_devices", JSON.stringify(limitedDevices))
        } catch (error) {
            console.error("Error loading devices:", error)
            toast.error("Failed to load devices")
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemoveDevice = (deviceId: string) => {
        if (devices.find(d => d.id === deviceId)?.isCurrent) {
            toast.error("Cannot remove current device")
            return
        }

        const updatedDevices = devices.filter(d => d.id !== deviceId)
        setDevices(updatedDevices)
        localStorage.setItem("connected_devices", JSON.stringify(updatedDevices))
        toast.success("Device removed successfully")
    }

    const formatLastActive = (date: Date): string => {
        const now = new Date()
        const diff = now.getTime() - new Date(date).getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (minutes < 1) return "Just now"
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
        if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
        return `${days} day${days > 1 ? "s" : ""} ago`
    }

    if (isLoading) {
        return (
            <Card className="liquid-glass-card">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="liquid-glass-card">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                        <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Connected Devices</CardTitle>
                        <p className="text-sm text-muted-foreground">Manage devices that have accessed your account</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {devices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No devices found</p>
                    </div>
                ) : (
                    devices.map((device, index) => (
                        <motion.div
                            key={device.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`p-3 rounded-lg ${
                                    device.isCurrent 
                                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" 
                                        : "bg-muted text-foreground"
                                }`}>
                                    {getDeviceIcon(device.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-sm">{device.name}</p>
                                        {device.isCurrent && (
                                            <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Current
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>{device.browser}</span>
                                        <span>•</span>
                                        <span>{device.os}</span>
                                        <span>•</span>
                                        <span>{formatLastActive(device.lastActive)}</span>
                                    </div>
                                </div>
                            </div>
                            {!device.isCurrent && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveDevice(device.id)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </motion.div>
                    ))
                )}
                <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="w-4 h-4" />
                        <p>Only devices you've logged in from are shown. Current device cannot be removed.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

