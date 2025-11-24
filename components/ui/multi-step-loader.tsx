"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";

interface LoadingState {
  text: string;
}

interface MultiStepLoaderProps {
  loadingStates: LoadingState[];
  loading: boolean;
  duration?: number;
  loop?: boolean;
  currentStep?: number;
}

export function MultiStepLoader({
  loadingStates,
  loading,
  duration = 2000,
  loop = true,
  currentStep = 0,
}: MultiStepLoaderProps) {
  if (!loading) return null;

  const currentState = loadingStates[currentStep] || loadingStates[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md px-4">
        <div className="rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/[0.03] backdrop-blur-2xl border border-white/20 p-8 shadow-2xl">
          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="space-y-3">
              <AnimatePresence mode="wait">
                {loadingStates.map((state, index) => {
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30"
                          : isCompleted
                          ? "bg-green-500/10 border border-green-400/20"
                          : "bg-white/5 border border-white/10"
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : isActive ? (
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            isActive
                              ? "text-white"
                              : isCompleted
                              ? "text-green-300"
                              : "text-white/50"
                          }`}
                        >
                          {state.text}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: "0%" }}
                animate={{
                  width: `${((currentStep + 1) / loadingStates.length) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Current Step Info */}
            <div className="text-center">
              <p className="text-sm text-white/70">
                Step {currentStep + 1} of {loadingStates.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

