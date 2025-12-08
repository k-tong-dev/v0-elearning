"use client";

import { motion } from "framer-motion";
import { QuantumAvatar } from "./quantum-avatar";

interface Avatar {
  src: string;
  alt?: string;
  status?: "online" | "offline" | "away" | "focus";
  verified?: boolean;
  level?: number;
}

interface AdvancedAvatarGroupProps {
  avatars: Avatar[];
  variant?: "quantum" | "holographic" | "neon" | "crystal" | "aurora";
  layout?: "stack" | "grid" | "orbit" | "wave";
  size?: number;
}

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
  "2xl": 128,
};

export function AdvancedAvatarGroup({
  avatars,
  variant = "quantum",
  layout = "stack",
  size = 80,
}: AdvancedAvatarGroupProps) {
  // Convert numeric size to size class
  const sizeClass: "sm" | "md" | "lg" | "xl" | "2xl" =
    size <= 32
      ? "sm"
      : size <= 40
      ? "md"
      : size <= 64
      ? "lg"
      : size <= 96
      ? "xl"
      : "2xl";

  if (layout === "stack") {
    return (
      <div className="relative flex items-center">
        {avatars.map((avatar, index) => (
          <motion.div
            key={index}
            className="relative"
            style={{
              marginLeft: index > 0 ? -size * 0.3 : 0,
              zIndex: avatars.length - index,
            }}
            initial={{ opacity: 0, x: -20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: index * 0.1, type: "spring" }}
            whileHover={{ scale: 1.1, zIndex: 100 }}
          >
            <QuantumAvatar
              src={avatar.src}
              alt={avatar.alt}
              size={sizeClass}
              variant={variant}
              status={avatar.status}
              showStatus={true}
              verified={avatar.verified}
              level={avatar.level}
              animated={false}
            />
          </motion.div>
        ))}
      </div>
    );
  }

  if (layout === "grid") {
    return (
      <div className="grid grid-cols-2 gap-4">
        {avatars.map((avatar, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, type: "spring" }}
          >
            <QuantumAvatar
              src={avatar.src}
              alt={avatar.alt}
              size={sizeClass}
              variant={variant}
              status={avatar.status}
              showStatus={true}
              verified={avatar.verified}
              level={avatar.level}
            />
          </motion.div>
        ))}
      </div>
    );
  }

  if (layout === "orbit") {
    const radius = size * 1.5;
    return (
      <div
        className="relative"
        style={{ width: radius * 2.5, height: radius * 2.5 }}
      >
        {/* Center avatar */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <QuantumAvatar
            src={avatars[0]?.src}
            alt={avatars[0]?.alt}
            size={sizeClass}
            variant={variant}
            status={avatars[0]?.status}
            showStatus={true}
            verified={avatars[0]?.verified}
            level={avatars[0]?.level}
            animated={false}
          />
        </div>

        {/* Orbiting avatars */}
        {avatars.slice(1).map((avatar, index) => {
          const angle = (index * 360) / (avatars.length - 1);
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;

          return (
            <motion.div
              key={index}
              className="absolute top-1/2 left-1/2"
              style={{
                x,
                y,
                translateX: "-50%",
                translateY: "-50%",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: 360,
              }}
              transition={{
                delay: index * 0.1,
                rotate: {
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
            >
              <QuantumAvatar
                src={avatar.src}
                alt={avatar.alt}
                size={sizeClass}
                variant={variant}
                status={avatar.status}
                showStatus={true}
                verified={avatar.verified}
                level={avatar.level}
                animated={false}
              />
            </motion.div>
          );
        })}
      </div>
    );
  }

  if (layout === "wave") {
    return (
      <div className="flex items-center gap-6">
        {avatars.map((avatar, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            animate={{
              opacity: 1,
              y: [0, -20, 0],
            }}
            transition={{
              delay: index * 0.1,
              y: {
                duration: 2,
                repeat: Infinity,
                delay: index * 0.2,
              },
            }}
          >
            <QuantumAvatar
              src={avatar.src}
              alt={avatar.alt}
              size={sizeClass}
              variant={variant}
              status={avatar.status}
              showStatus={true}
              verified={avatar.verified}
              level={avatar.level}
            />
          </motion.div>
        ))}
      </div>
    );
  }

  return null;
}

