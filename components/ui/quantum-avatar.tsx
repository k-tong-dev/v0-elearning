"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/utils/utils";
import { CheckCircle } from "lucide-react";

interface QuantumAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "quantum" | "holographic" | "neon" | "crystal" | "aurora";
  showStatus?: boolean;
  status?: "online" | "offline" | "away" | "focus";
  verified?: boolean;
  level?: number;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  animated?: boolean;
  glow?: boolean;
  borderGradient?: boolean;
}

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
  "2xl": 128,
};

const statusConfig = {
  online: { color: "#00ff88", glow: "rgba(0, 255, 136, 0.5)" },
  offline: { color: "#666666", glow: "rgba(102, 102, 102, 0.5)" },
  away: { color: "#ffd600", glow: "rgba(255, 214, 0, 0.5)" },
  focus: { color: "#ff006e", glow: "rgba(255, 0, 110, 0.5)" },
};

export function QuantumAvatar({
  src,
  alt = "User avatar",
  fallback,
  size = "md",
  variant = "quantum",
  showStatus = false,
  status = "online",
  verified = false,
  level,
  className,
  onClick,
  interactive = false,
  animated = true,
  glow = false,
  borderGradient = true,
  ...props
}: QuantumAvatarProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const pixelSize = sizeMap[size];
  const statusColor = statusConfig[status];

  // 3D tilt effect based on mouse position
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);
  
  // Specular highlight position based on mouse (0-100%)
  const highlightX = useTransform(mouseX, [-0.5, 0.5], ["30%", "70%"]);
  const highlightY = useTransform(mouseY, [-0.5, 0.5], ["30%", "70%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !animated) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "relative",
        interactive && "cursor-pointer",
        className
      )}
      style={{
        width: pixelSize,
        height: pixelSize,
        perspective: "1000px",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      {...props}
    >
      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX: animated ? rotateX : 0,
          rotateY: animated ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Outer glow rings */}
        <motion.div
          className="absolute inset-0"
          style={{ transform: "translateZ(-20px)" }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full"
              style={{
                border: `2px solid ${statusColor.color}`,
                opacity: 0.3 - i * 0.1,
              }}
              animate={{
                scale: isHovered ? [1, 1.3 + i * 0.1, 1] : 1,
                opacity: isHovered ? [0.3 - i * 0.1, 0, 0.3 - i * 0.1] : 0.3 - i * 0.1,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </motion.div>

        {/* Quantum variant */}
        {variant === "quantum" && (
          <>
            {/* Particle field */}
            <div className="absolute inset-[-20px]">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-cyan-400"
                  style={{
                    left: "50%",
                    top: "50%",
                  }}
                  animate={{
                    x: [
                      0,
                      Math.cos(i * 30 * (Math.PI / 180)) * (pixelSize / 2 + 20),
                      0,
                    ],
                    y: [
                      0,
                      Math.sin(i * 30 * (Math.PI / 180)) * (pixelSize / 2 + 20),
                      0,
                    ],
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
            
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-900/40 to-cyan-900/40 backdrop-blur-2xl border border-cyan-400/30 overflow-hidden">
              <Avatar className="relative w-full h-full">
                <AvatarImage 
                  src={src || "/placeholder.svg"} 
                  alt={alt} 
                  className="object-cover w-full h-full" 
                />
                <AvatarFallback className="text-white font-semibold bg-gradient-to-br from-purple-500 via-cyan-500 to-pink-500">
                  {fallback || "U"}
                </AvatarFallback>
              </Avatar>
              
              {/* Energy waves */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(
                    circle,
                    rgba(0, 255, 255, 0.3) 0%,
                    transparent 70%
                  )`,
                }}
                animate={{
                  scale: isHovered ? [1, 1.5, 1] : 1,
                  opacity: isHovered ? [0.3, 0, 0.3] : 0,
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </>
        )}

        {/* Holographic variant */}
        {variant === "holographic" && (
          <>
            <motion.div
              className="absolute inset-[-8px] rounded-full"
              style={{
                background: `conic-gradient(
                  from 0deg,
                  #ff00ff, #00ffff, #ffff00, #ff00ff
                )`,
                filter: "blur(8px)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-2xl border-2 border-white/20 overflow-hidden">
              <motion.div
                className="absolute inset-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
                animate={{ y: [-10, pixelSize + 10] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              
              <Avatar className="relative w-full h-full">
                <AvatarImage src={src || "/placeholder.svg"} alt={alt} className="object-cover w-full h-full" />
                <AvatarFallback className="text-white font-semibold bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600">
                  {fallback || "U"}
                </AvatarFallback>
              </Avatar>
              
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(
                    135deg,
                    rgba(255, 0, 255, 0.2) 0%,
                    rgba(0, 255, 255, 0.2) 50%,
                    rgba(255, 255, 0, 0.2) 100%
                  )`,
                  mixBlendMode: "overlay",
                }}
                animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
              />
            </div>
          </>
        )}

        {/* Neon variant */}
        {variant === "neon" && (
          <>
            <motion.div
              className="absolute inset-[-4px] rounded-full"
              style={{
                boxShadow: `
                  0 0 20px ${statusColor.glow},
                  0 0 40px ${statusColor.glow},
                  inset 0 0 20px ${statusColor.glow}
                `,
              }}
              animate={{
                opacity: isHovered ? [0.8, 1, 0.8] : 0.6,
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            
            <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-xl border border-white/30 overflow-hidden">
              <Avatar className="relative w-full h-full">
                <AvatarImage src={src || "/placeholder.svg"} alt={alt} className="object-cover w-full h-full" />
                <AvatarFallback className="text-white font-semibold bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600">
                  {fallback || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(${statusColor.color} 1px, transparent 1px),
                    linear-gradient(90deg, ${statusColor.color} 1px, transparent 1px)
                  `,
                  backgroundSize: "20px 20px",
                }}
              />
            </div>
          </>
        )}

        {/* Crystal variant */}
        {variant === "crystal" && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(
                    ${i * 60}deg,
                    rgba(255, 255, 255, 0.3) 0%,
                    transparent 50%
                  )`,
                  transform: `rotate(${i * 60}deg)`,
                  clipPath: "polygon(50% 50%, 50% 0%, 100% 50%)",
                }}
                animate={{
                  opacity: isHovered ? [0.3, 0.6, 0.3] : 0.2,
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
            
            <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-3xl border-2 border-white/40 overflow-hidden">
              <Avatar className="relative w-full h-full">
                <AvatarImage src={src || "/placeholder.svg"} alt={alt} className="object-cover w-full h-full" />
                <AvatarFallback className="text-white font-semibold bg-gradient-to-br from-indigo-400 via-blue-500 to-violet-600">
                  {fallback || "U"}
                </AvatarFallback>
              </Avatar>
              
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(
                    circle at 30% 30%,
                    rgba(255, 255, 255, 0.4) 0%,
                    transparent 60%
                  )`,
                }}
                animate={{
                  background: isHovered
                    ? [
                        "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)",
                        "radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)",
                      ]
                    : "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)",
                }}
                transition={{ duration: 2 }}
              />
            </div>
          </>
        )}

        {/* Aurora variant */}
        {variant === "aurora" && (
          <>
            <motion.div
              className="absolute inset-[-8px] rounded-full overflow-hidden"
              style={{ filter: "blur(12px)" }}
            >
              <motion.div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(
                    45deg,
                    #ff00ff 0%, #00ffff 25%, #00ff88 50%, #ffff00 75%, #ff00ff 100%
                  )`,
                  backgroundSize: "200% 200%",
                }}
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
              />
            </motion.div>
            
            <div className="absolute inset-0 rounded-full bg-black/50 backdrop-blur-3xl border border-white/20 overflow-hidden">
              <Avatar className="relative w-full h-full">
                <AvatarImage src={src || "/placeholder.svg"} alt={alt} className="object-cover w-full h-full" />
                <AvatarFallback className="text-white font-semibold bg-gradient-to-br from-pink-400 via-rose-500 to-orange-600">
                  {fallback || "U"}
                </AvatarFallback>
              </Avatar>
              
              <motion.div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `linear-gradient(
                    135deg,
                    transparent 0%,
                    rgba(255, 0, 255, 0.5) 25%,
                    rgba(0, 255, 255, 0.5) 50%,
                    rgba(255, 255, 0, 0.5) 75%,
                    transparent 100%
                  )`,
                  backgroundSize: "200% 200%",
                  mixBlendMode: "screen",
                }}
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
              />
            </div>
          </>
        )}

        {/* Specular highlight that follows mouse */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
          style={{
            opacity: isHovered ? 1 : 0.5,
          }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "60%",
              height: "60%",
              background: `radial-gradient(
                circle,
                rgba(255, 255, 255, 0.6) 0%,
                rgba(255, 255, 255, 0.2) 50%,
                transparent 100%
              )`,
              left: highlightX,
              top: highlightY,
              transform: "translate(-50%, -50%)",
            }}
          />
        </motion.div>

        {/* Status indicator */}
        {showStatus && (
          <motion.div
            className="absolute bottom-[5%] right-[5%] rounded-full"
            style={{
              width: pixelSize * 0.2,
              height: pixelSize * 0.2,
              backgroundColor: statusColor.color,
              boxShadow: `
                0 0 10px ${statusColor.glow},
                0 0 20px ${statusColor.glow},
                inset 0 0 10px rgba(255, 255, 255, 0.5)
              `,
              border: "3px solid rgba(0, 0, 0, 0.3)",
              transform: "translateZ(20px)",
            }}
            animate={{
              scale: status === "online" || status === "focus" ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: statusColor.color,
              }}
              animate={{
                scale: [1, 2],
                opacity: [0.6, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}

        {/* Verified badge */}
        {verified && (
          <motion.div
            className="absolute -top-1 -right-1 z-50 p-0.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"
            style={{ transform: "translateZ(20px)" }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="bg-white rounded-full p-0.5">
              <CheckCircle className="w-3 h-3 text-blue-600" />
            </div>
          </motion.div>
        )}

        {/* Level badge */}
        {level && level > 0 && (
          <motion.div
            className="absolute -bottom-1 left-0 z-50 px-1.5 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full border border-white/20 text-white text-xs font-bold shadow-lg"
            style={{ transform: "translateZ(20px)" }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            Lv{level}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Export default variant
export default QuantumAvatar;

