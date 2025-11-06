"use client"

import { Bell, Search, Settings } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useEffect, useRef, useState } from "react"

export function HeaderVibrant() {
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
        <header
            ref={headerRef}
            className="relative overflow-hidden border-b border-pink-500/20 bg-gradient-to-r from-purple-900/60 via-pink-900/60 to-orange-900/60 backdrop-blur-2xl"
        >
            {/* Animated liquid blobs - Vibrant theme */}
            <div className="pointer-events-none absolute inset-0">
                <div
                    className="absolute -left-20 -top-20 h-96 w-96 animate-[blob_12s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-pink-500/50 via-rose-500/40 to-transparent blur-3xl"
                    style={{
                        transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
                <div
                    className="absolute -right-20 top-0 h-80 w-80 animate-[blob_10s_ease-in-out_infinite_2s] rounded-full bg-gradient-to-bl from-orange-500/50 via-amber-500/40 to-transparent blur-3xl"
                    style={{
                        transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * 0.015}px)`,
                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
                <div
                    className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 animate-[blob_15s_ease-in-out_infinite_4s] rounded-full bg-gradient-to-tr from-purple-500/40 via-fuchsia-500/30 to-transparent blur-3xl"
                    style={{
                        transform: `translate(calc(-50% + ${mousePosition.x * 0.01}px), calc(-50% + ${mousePosition.y * 0.01}px))`,
                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
            </div>

            {/* Neon glow overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-pink-500/10 via-transparent to-orange-500/10" />

            <div className="relative mx-auto max-w-7xl px-6 py-5">
                <div className="flex items-center justify-between">
                    {/* Left section */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 blur-lg opacity-80" />
                                <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 shadow-2xl shadow-pink-500/60">
                                    <span className="text-lg font-bold text-white drop-shadow-lg">D</span>
                                </div>
                            </div>
                            <div>
                                <h1 className="bg-gradient-to-r from-pink-300 via-rose-200 to-orange-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent drop-shadow-lg">
                                    Dashboard
                                </h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse shadow-lg shadow-lime-400/80" />
                                    <p className="text-xs font-medium text-pink-200">Live</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center section - Search */}
                    <div className="hidden md:block flex-1 max-w-md mx-8">
                        <div className="group relative">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/40 via-rose-500/40 to-orange-500/40 opacity-60 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                            <div className="relative flex items-center gap-3 rounded-2xl border border-pink-400/30 bg-white/10 px-4 py-2.5 backdrop-blur-xl transition-all duration-300 group-hover:border-pink-400/50 group-hover:bg-white/20 group-hover:shadow-lg group-hover:shadow-pink-500/30">
                                <Search className="h-4 w-4 text-pink-200 transition-colors group-hover:text-white" />
                                <input
                                    type="text"
                                    placeholder="Search anything..."
                                    className="flex-1 bg-transparent text-sm text-white placeholder-pink-300/60 outline-none"
                                />
                                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-pink-400/30 bg-pink-500/20 px-1.5 text-xs font-medium text-pink-200">
                                    ⌘K
                                </kbd>
                            </div>
                        </div>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center gap-4">
                        <button className="group relative rounded-xl border border-pink-400/30 bg-white/10 p-2.5 backdrop-blur-xl transition-all duration-300 hover:border-pink-400/50 hover:bg-white/20 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/30">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/30 to-orange-500/30 opacity-0 blur transition-opacity duration-300 group-hover:opacity-100" />
                            <Bell className="relative h-5 w-5 text-pink-200 transition-colors group-hover:text-white" />
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-lime-400 to-blue-500 text-xs font-bold text-gray-900 shadow-lg shadow-lime-400/60 animate-pulse">
                3
              </span>
                        </button>

                        <button className="group relative rounded-xl border border-pink-400/30 bg-white/10 p-2.5 backdrop-blur-xl transition-all duration-300 hover:border-pink-400/50 hover:bg-white/20 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/30">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/30 to-orange-500/30 opacity-0 blur transition-opacity duration-300 group-hover:opacity-100" />
                            <Settings className="relative h-5 w-5 text-pink-200 transition-colors group-hover:text-white" />
                        </button>

                        <div className="group relative ml-2">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/50 via-rose-500/50 to-orange-500/50 opacity-60 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                            <div className="relative flex items-center gap-3 rounded-2xl border border-pink-400/30 bg-white/10 py-2 pl-3 pr-4 backdrop-blur-xl transition-all duration-300 group-hover:border-pink-400/50 group-hover:bg-white/20 group-hover:shadow-lg group-hover:shadow-pink-500/30">
                                <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 shadow-lg shadow-pink-500/50">
                                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white drop-shadow">
                                        {user?.name?.charAt(0) || "U"}
                                    </div>
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-sm font-semibold text-white leading-tight drop-shadow">{user?.name || "User"}</p>
                                    <p className="text-xs text-pink-200 leading-tight">{user?.email || "user@example.com"}</p>
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
