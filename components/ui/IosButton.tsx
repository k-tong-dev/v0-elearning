import React from 'react';
import { Button } from '@nextui-org/react';
import { motion } from 'framer-motion';

interface IOSButtonProps {
    label: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
}

const IOSButton: React.FC<IOSButtonProps> = ({
                                                 label,
                                                 onClick,
                                                 variant = 'primary',
                                                 size = 'md',
                                                 disabled = false,
                                                 className = '',
                                             }) => {
    const baseClasses = `
    relative overflow-hidden font-semibold transition-all duration-200 ease-out
    backdrop-blur-md backdrop-saturate-150
    border-1 border-white/20 dark:border-white/10
    shadow-lg hover:shadow-xl
    active:scale-95
  `;

    const variantClasses = {
        primary: `
      bg-gradient-to-br from-blue-500/80 via-blue-600/70 to-blue-700/80
      dark:from-blue-400/70 dark:via-blue-500/60 dark:to-blue-600/70
      text-white
      hover:from-blue-400/90 hover:via-blue-500/80 hover:to-blue-600/90
      dark:hover:from-blue-300/80 dark:hover:via-blue-400/70 dark:hover:to-blue-500/80
      active:from-blue-600/90 active:via-blue-700/80 active:to-blue-800/90
      dark:active:from-blue-500/80 dark:active:via-blue-600/70 dark:active:to-blue-700/80
    `,
        secondary: `
      bg-gradient-to-br from-gray-100/80 via-gray-200/70 to-gray-300/80
      dark:from-gray-700/70 dark:via-gray-800/60 dark:to-gray-900/70
      text-gray-900 dark:text-gray-100
      hover:from-gray-50/90 hover:via-gray-100/80 hover:to-gray-200/90
      dark:hover:from-gray-600/80 dark:hover:via-gray-700/70 dark:hover:to-gray-800/80
      active:from-gray-200/90 active:via-gray-300/80 active:to-gray-400/90
      dark:active:from-gray-800/80 dark:active:via-gray-900/70 dark:active:to-black/80
    `,
    };

    const sizeClasses = {
        sm: 'px-4 py-2 text-sm min-h-8 h-8',
        md: 'px-6 py-3 text-base min-h-10 h-10',
        lg: 'px-8 py-4 text-lg min-h-12 h-12',
    };

    const disabledClasses = disabled
        ? `
      opacity-50 cursor-not-allowed
      bg-gradient-to-br from-gray-300/60 via-gray-400/50 to-gray-500/60
      dark:from-gray-600/50 dark:via-gray-700/40 dark:to-gray-800/50
      text-gray-600 dark:text-gray-400
    `
        : '';

    return (
        <motion.div
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
            <Button
                onClick={disabled ? undefined : onClick}
                disabled={disabled}
                className={`
          ${baseClasses}
          ${disabled ? disabledClasses : variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
                radius="full"
                style={{
                    background: disabled ? undefined : 'inherit',
                }}
            >
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10"
                >
                    {label}
                </motion.span>

                {/* Glassmorphism overlay */}
                <div className="absolute inset-0 bg-white/10 dark:bg-white/5 rounded-full" />

                {/* Subtle inner glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/5 to-white/10 dark:via-white/3 dark:to-white/5" />

                {/* Hover shimmer effect */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0"
                    whileHover={!disabled ? {
                        opacity: [0, 1, 0],
                        x: [-100, 100]
                    } : {}}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                />
            </Button>
        </motion.div>
    );
};

export default IOSButton;
