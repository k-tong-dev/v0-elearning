"use client";

import { motion } from "framer-motion";
import { QuantumAvatar } from "@/components/ui/quantum-avatar";
import { AdvancedAvatarGroup } from "@/components/ui/advanced-avatar-group";
import { Sparkles, Atom, Zap, Layers } from "lucide-react";

// Sample avatar images from public folder
const sampleAvatars = [
  "/avatars/programmer.png",
  "/avatars/teacher.png",
  "/avatars/gamer.png",
  "/avatars/hacker-blue.png",
  "/avatars/astronaut.png",
  "/avatars/ninja.png",
];

const sizes = [
  { name: "Small", size: "sm" as const, pixel: "32px" },
  { name: "Medium", size: "md" as const, pixel: "40px" },
  { name: "Large", size: "lg" as const, pixel: "64px" },
  { name: "Extra Large", size: "xl" as const, pixel: "96px" },
  { name: "2X Large", size: "2xl" as const, pixel: "128px" },
];

const statuses = [
  { name: "Online", status: "online" as const },
  { name: "Offline", status: "offline" as const },
  { name: "Away", status: "away" as const },
  { name: "Focus", status: "focus" as const },
];

export default function AvatarShowcasePage() {
  // Generate particles for quantum background
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
  }));

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950">
      {/* Quantum Particle Field Background */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-cyan-400/20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
              x: [
                0,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
              ],
              y: [
                0,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
              ],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut",
            }}
          />
        ))}
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(cyan 1px, transparent 1px),
                linear-gradient(90deg, cyan 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Atom className="w-12 h-12 text-cyan-400" />
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Quantum Avatar Showcase
            </h1>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Atom className="w-12 h-12 text-purple-400" />
            </motion.div>
          </div>
          <p className="text-xl text-cyan-200/80 max-w-2xl mx-auto">
            Explore all variations of the Quantum avatar style - different sizes,
            statuses, and group formations with futuristic particle effects
          </p>
        </motion.div>

        {/* Size Variations Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Layers className="w-6 h-6 text-cyan-400" />
            <h2 className="text-3xl font-bold text-white">Size Variations</h2>
          </div>
          <div className="bg-black/30 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 justify-items-center">
              {sizes.map((size) => (
                <motion.div
                  key={size.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <div className="mb-4 flex justify-center">
                    <QuantumAvatar
                      src={sampleAvatars[0]}
                      alt="Avatar"
                      size={size.size}
                      variant="quantum"
                      showStatus
                      status="online"
                      interactive
                      animated
                      glow
                    />
                  </div>
                  <p className="text-cyan-200 font-semibold">{size.name}</p>
                  <p className="text-cyan-400/60 text-sm">{size.pixel}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Status Variations Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Zap className="w-6 h-6 text-purple-400" />
            <h2 className="text-3xl font-bold text-white">Status Types</h2>
          </div>
          <div className="bg-black/30 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
              {statuses.map((status) => (
                <motion.div
                  key={status.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <div className="mb-4 flex justify-center">
                    <QuantumAvatar
                      src={sampleAvatars[1]}
                      alt="Avatar"
                      size="xl"
                      variant="quantum"
                      showStatus
                      status={status.status}
                      interactive
                      animated
                      glow
                    />
                  </div>
                  <p className="text-purple-200 font-semibold">{status.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Group Layouts Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-6 h-6 text-pink-400" />
            <h2 className="text-3xl font-bold text-white">Group Layouts</h2>
          </div>

          {/* Stack Layout */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-cyan-300 mb-4">Stack Layout</h3>
            <div className="bg-black/30 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 flex justify-center">
              <AdvancedAvatarGroup
                avatars={sampleAvatars.slice(0, 5).map((src, i) => ({
                  src,
                  alt: `User ${i + 1}`,
                  status: ["online", "away", "offline", "focus", "online"][i] as any,
                  verified: i === 0,
                  level: i + 1,
                }))}
                variant="quantum"
                layout="stack"
                size={80}
              />
            </div>
          </div>

          {/* Wave Layout */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-purple-300 mb-4">Wave Layout</h3>
            <div className="bg-black/30 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 flex justify-center">
              <AdvancedAvatarGroup
                avatars={sampleAvatars.slice(0, 6).map((src, i) => ({
                  src,
                  alt: `User ${i + 1}`,
                  status: ["online", "away", "offline", "focus", "online", "away"][i] as any,
                  verified: i === 0 || i === 2,
                  level: i + 1,
                }))}
                variant="quantum"
                layout="wave"
                size={80}
              />
            </div>
          </div>

          {/* Grid Layout */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-pink-300 mb-4">Grid Layout</h3>
            <div className="bg-black/30 backdrop-blur-xl border border-pink-500/20 rounded-2xl p-8 flex justify-center">
              <AdvancedAvatarGroup
                avatars={sampleAvatars.slice(0, 4).map((src, i) => ({
                  src,
                  alt: `User ${i + 1}`,
                  status: ["online", "away", "offline", "focus"][i] as any,
                  verified: i === 0,
                  level: i + 1,
                }))}
                variant="quantum"
                layout="grid"
                size={100}
              />
            </div>
          </div>

          {/* Orbit Layout */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-indigo-300 mb-4">Orbit Layout</h3>
            <div className="bg-black/30 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-8 flex justify-center">
              <AdvancedAvatarGroup
                avatars={sampleAvatars.slice(0, 6).map((src, i) => ({
                  src,
                  alt: `User ${i + 1}`,
                  status: ["online", "away", "offline", "focus", "online", "away"][i] as any,
                  verified: i === 0,
                  level: i + 1,
                }))}
                variant="quantum"
                layout="orbit"
                size={80}
              />
            </div>
          </div>
        </motion.section>

        {/* Interactive Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <Atom className="w-6 h-6 text-cyan-400" />
            <h2 className="text-3xl font-bold text-white">Interactive Hero</h2>
          </div>
          <div className="bg-black/30 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-12">
            <div className="flex flex-col items-center gap-8">
              <div className="flex flex-col items-center gap-4">
                <QuantumAvatar
                  src={sampleAvatars[0]}
                  alt="Hero Avatar"
                  size="2xl"
                  variant="quantum"
                  showStatus
                  status="online"
                  verified
                  level={10}
                  interactive
                  animated
                  glow
                  borderGradient
                />
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Interactive Quantum Avatar
                  </h3>
                  <p className="text-cyan-200/80">
                    Hover over the avatar to see particle effects and animations
                  </p>
                </div>
              </div>

              {/* Multiple sizes showcase */}
              <div className="flex items-center justify-center gap-6 flex-wrap">
                {sizes.map((size) => (
                  <motion.div
                    key={size.name}
                    whileHover={{ scale: 1.1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <QuantumAvatar
                      src={sampleAvatars[Math.floor(Math.random() * sampleAvatars.length)]}
                      alt="Avatar"
                      size={size.size}
                      variant="quantum"
                      showStatus
                      status={statuses[Math.floor(Math.random() * statuses.length)].status}
                      interactive
                      animated
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Features Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-black/30 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-6">
            <Atom className="w-8 h-8 text-cyan-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Particle Effects</h3>
            <p className="text-cyan-200/70">
              Dynamic particle animations that respond to hover interactions
            </p>
          </div>
          <div className="bg-black/30 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6">
            <Zap className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Status Indicators</h3>
            <p className="text-purple-200/70">
              Four distinct status types with pulsing animations and colored glows
            </p>
          </div>
          <div className="bg-black/30 backdrop-blur-xl border border-pink-500/20 rounded-xl p-6">
            <Sparkles className="w-8 h-8 text-pink-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Multiple Layouts</h3>
            <p className="text-pink-200/70">
              Stack, wave, grid, and orbit layouts for different use cases
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

