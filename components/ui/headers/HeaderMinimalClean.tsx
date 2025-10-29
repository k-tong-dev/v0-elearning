"use client"

import { Bell, Search, Settings } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useEffect, useRef, useState } from "react"

export function DashboardHeaderMinimal() {
    const { user } = useAuth()
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const headerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (headerRef.current) {
                const rect = headerRef.current.getBoundingClientRect()
                setMousePosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                })
            }
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    return (
        <header ref={headerRef} className="relative overflow-hidden border-b border-gray-200 bg-white/80 backdrop-blur-2xl">
            {/* Subtle liquid blobs - Minimal theme */}
            <div className="pointer-events-none absolute inset-0">
                <div
                    className="absolute -left-20 -top-20 h-96 w-96 animate-[blob_12s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-gray-200/40 to-transparent blur-3xl"
                    style={{
                        transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
                <div
                    className="absolute -right-20 top-0 h-80 w-80 animate-[blob_10s_ease-in-out_infinite_2s] rounded-full bg-gradient-to-bl from-gray-300/30 to-transparent blur-3xl"
                    style={{
                        transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * 0.015}px)`,
                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
            </div>

            <div className="relative mx-auto max-w-7xl px-6 py-5">
                <div className="flex items-center justify-between">
                    {/* Left section */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black shadow-lg shadow-black/10 transition-transform duration-300 hover:scale-105">
                                    <span className="text-lg font-bold text-white">D</span>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-black">Dashboard</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-black" />
                                    <p className="text-xs font-medium text-gray-600">Live</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center section - Search */}
                    <div className="hidden md:block flex-1 max-w-md mx-8">
                        <div className="group relative">
                            <div className="relative flex items-center gap-3 rounded-2xl border border-gray-300 bg-gray-50 px-4 py-2.5 transition-all duration-300 group-hover:border-gray-400 group-hover:bg-white group-hover:shadow-lg group-hover:shadow-black/5">
                                <Search className="h-4 w-4 text-gray-400 transition-colors group-hover:text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Search anything..."
                                    className="flex-1 bg-transparent text-sm text-black placeholder-gray-400 outline-none"
                                />
                                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-gray-300 bg-white px-1.5 text-xs font-medium text-gray-500">
                                    ⌘K
                                </kbd>
                            </div>
                        </div>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center gap-4">
                        <button className="group relative rounded-xl border border-gray-300 bg-gray-50 p-2.5 transition-all duration-300 hover:border-gray-400 hover:bg-white hover:scale-105 hover:shadow-lg hover:shadow-black/5">
                            <Bell className="relative h-5 w-5 text-gray-600 transition-colors group-hover:text-black" />
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs font-bold text-white shadow-lg shadow-black/20">
                3
              </span>
                        </button>

                        <button className="group relative rounded-xl border border-gray-300 bg-gray-50 p-2.5 transition-all duration-300 hover:border-gray-400 hover:bg-white hover:scale-105 hover:shadow-lg hover:shadow-black/5">
                            <Settings className="relative h-5 w-5 text-gray-600 transition-colors group-hover:text-black" />
                        </button>

                        <div className="group relative ml-2">
                            <div className="relative flex items-center gap-3 rounded-2xl border border-gray-300 bg-gray-50 py-2 pl-3 pr-4 transition-all duration-300 group-hover:border-gray-400 group-hover:bg-white group-hover:shadow-lg group-hover:shadow-black/5">
                                <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-black shadow-lg shadow-black/10">
                                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                                        {user?.name?.charAt(0) || "U"}
                                    </div>
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-sm font-semibold text-black leading-tight">{user?.name || "User"}</p>
                                    <p className="text-xs text-gray-600 leading-tight">{user?.email || "user@example.com"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
      `}</style>
        </header>
    )
}
