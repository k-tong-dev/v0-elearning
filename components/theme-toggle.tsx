"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
        <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10" disabled>
          <Sun className="h-5 w-5" />
        </Button>
    )
  }

  return (
      <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-xl w-10 h-10 hover:bg-white/40 dark:hover:bg-white/10 transition-all duration-300 relative overflow-hidden"
          style={{
            backdropFilter: "blur(10px)",
          }}
      >
        <motion.div
            initial={false}
            animate={{
              scale: theme === "dark" ? 0 : 1,
              rotate: theme === "dark" ? 90 : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute"
        >
          <Sun className="h-5 w-5" />
        </motion.div>
        <motion.div
            initial={false}
            animate={{
              scale: theme === "dark" ? 1 : 0,
              rotate: theme === "dark" ? 0 : -90,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute"
        >
          <Moon className="h-5 w-5" />
        </motion.div>
        <span className="sr-only">Toggle theme</span>
      </Button>
  )
}
