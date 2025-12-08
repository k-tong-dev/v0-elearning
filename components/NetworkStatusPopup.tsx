'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Draggable from 'react-draggable';

interface NetworkStatusPopupProps {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType?: string;
}

export function NetworkStatusPopup({ isOnline, isSlowConnection, effectiveType }: NetworkStatusPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
      setHasBeenOffline(true);
    } else if (hasBeenOffline && isOnline) {
      // Show "back online" message briefly
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setHasBeenOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else if (isSlowConnection) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isSlowConnection, hasBeenOffline]);

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        title: 'No Internet Connection',
        message: 'Please check your network settings and try again.',
        icon: '📡',
        gradient: 'from-red-500/20 via-orange-500/20 to-red-500/20',
        borderGradient: 'from-red-500 via-orange-500 to-red-500',
        glowColor: 'rgba(239, 68, 68, 0.5)',
        iconColor: 'text-red-500',
      };
    } else if (hasBeenOffline) {
      return {
        title: 'Back Online',
        message: 'Your internet connection has been restored.',
        icon: '✓',
        gradient: 'from-green-500/20 via-emerald-500/20 to-green-500/20',
        borderGradient: 'from-green-500 via-emerald-500 to-green-500',
        glowColor: 'rgba(34, 197, 94, 0.5)',
        iconColor: 'text-green-500',
      };
    } else if (isSlowConnection) {
      return {
        title: 'Slow Connection',
        message: `Your connection is slow (${effectiveType}). Some features may be limited.`,
        icon: '⚠️',
        gradient: 'from-yellow-500/20 via-amber-500/20 to-yellow-500/20',
        borderGradient: 'from-yellow-500 via-amber-500 to-yellow-500',
        glowColor: 'rgba(234, 179, 8, 0.5)',
        iconColor: 'text-yellow-500',
      };
    }
    return null;
  };

  const config = getStatusConfig();
  if (!config || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <Draggable
          nodeRef={nodeRef}
          defaultPosition={{ x: 0, y: 0 }}
          handle=".drag-handle"
          cancel=".no-drag"
        >
          <motion.div
            ref={nodeRef}
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto"
            style={{
              filter: `drop-shadow(0 10px 40px ${config.glowColor})`,
            }}
          >
          <motion.div
            animate={{
              boxShadow: [
                `0 0 20px ${config.glowColor}`,
                `0 0 40px ${config.glowColor}`,
                `0 0 20px ${config.glowColor}`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`
              relative overflow-hidden rounded-2xl
              bg-gradient-to-br ${config.gradient}
              backdrop-blur-2xl
              border-2 border-transparent
              min-w-[320px] max-w-[450px]
            `}
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255,255,255,0.1) 0%,
                  rgba(255,255,255,0.05) 100%
                ),
                linear-gradient(to right, 
                  var(--tw-gradient-from),
                  var(--tw-gradient-via),
                  var(--tw-gradient-to)
                )
              `,
            }}
          >
            {/* Animated border gradient */}
            <div 
              className={`absolute inset-0 rounded-2xl opacity-75 bg-gradient-to-r ${config.borderGradient}`}
              style={{
                padding: '2px',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />

            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-32 h-32 rounded-full opacity-20 bg-gradient-to-br ${config.gradient}`}
                  animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3 + i,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.5,
                  }}
                  style={{
                    left: `${i * 30}%`,
                    top: `${i * 20}%`,
                  }}
                />
              ))}
            </div>

            {/* Drag Handle */}
            <div className="drag-handle cursor-move flex items-center justify-center py-2 bg-white/5 hover:bg-white/10 transition-all rounded-t-2xl group">
              <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="w-1 h-1 rounded-full bg-white/50" />
                <div className="w-1 h-1 rounded-full bg-white/50" />
                <div className="w-1 h-1 rounded-full bg-white/50" />
                <div className="w-1 h-1 rounded-full bg-white/50" />
              </div>
            </div>

            {/* Content */}
            <div className="relative p-6 pt-4 flex items-start gap-4">
              {/* Animated Icon */}
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`
                  flex-shrink-0 w-12 h-12 rounded-xl
                  flex items-center justify-center text-2xl
                  ${config.iconColor}
                  bg-white/10 dark:bg-black/10
                  backdrop-blur-sm
                  shadow-lg
                `}
              >
                {config.icon}
              </motion.div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <motion.h3
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`
                    text-lg font-bold mb-1
                    ${config.iconColor}
                    dark:text-white
                  `}
                >
                  {config.title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-gray-700 dark:text-gray-200"
                >
                  {config.message}
                </motion.p>
              </div>

              {/* Close Button */}
              {(isSlowConnection || hasBeenOffline) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsVisible(false)}
                  className={`
                    no-drag
                    flex-shrink-0 w-8 h-8 rounded-lg
                    flex items-center justify-center
                    ${config.iconColor}
                    bg-white/10 dark:bg-black/10
                    backdrop-blur-sm
                    hover:bg-white/20 dark:hover:bg-black/20
                    transition-colors
                  `}
                  aria-label="Close notification"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 4L4 12M4 4L12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </motion.button>
              )}
            </div>

            {/* Progress bar for auto-dismiss */}
            {(isSlowConnection || hasBeenOffline) && (
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{
                  duration: hasBeenOffline ? 4 : 6,
                  ease: 'linear',
                }}
                className={`h-1 bg-gradient-to-r ${config.borderGradient} origin-left`}
              />
            )}
          </motion.div>
        </motion.div>
        </Draggable>
      )}
    </AnimatePresence>
  );
}

