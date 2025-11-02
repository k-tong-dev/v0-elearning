/**
 * Liquid Glass Theme Configuration
 * 
 * This file exports theme configuration and utility functions for the
 * iOS 26 Liquid Glass design system.
 * 
 * Usage:
 *   import { getGlassSurface, getGlassDepth } from '@/lib/liquid-glass-theme'
 */

export interface GlassSurfaceConfig {
    blur: number
    saturation: number
    opacity: number
    borderOpacity: number
    shadow: string
}

export interface GlassTheme {
    light: {
        surface: GlassSurfaceConfig
        card: GlassSurfaceConfig
        modal: GlassSurfaceConfig
        navbar: GlassSurfaceConfig
    }
    dark: {
        surface: GlassSurfaceConfig
        card: GlassSurfaceConfig
        modal: GlassSurfaceConfig
        navbar: GlassSurfaceConfig
    }
}

/**
 * Default Liquid Glass theme configuration
 */
export const liquidGlassTheme: GlassTheme = {
    light: {
        surface: {
            blur: 20,
            saturation: 180,
            opacity: 0.12,
            borderOpacity: 0.15,
            shadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(255, 255, 255, 0.15)'
        },
        card: {
            blur: 24,
            saturation: 200,
            opacity: 0.15,
            borderOpacity: 0.2,
            shadow: '0 12px 40px rgba(0, 0, 0, 0.1), inset 0 2px 0 rgba(255, 255, 255, 0.35), inset 0 -2px 0 rgba(255, 255, 255, 0.2)'
        },
        modal: {
            blur: 40,
            saturation: 200,
            opacity: 0.2,
            borderOpacity: 0.3,
            shadow: '0 24px 80px rgba(0, 0, 0, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 0 rgba(255, 255, 255, 0.25)'
        },
        navbar: {
            blur: 24,
            saturation: 180,
            opacity: 0.15,
            borderOpacity: 0.2,
            shadow: '0 4px 20px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        }
    },
    dark: {
        surface: {
            blur: 20,
            saturation: 180,
            opacity: 0.06,
            borderOpacity: 0.08,
            shadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(255, 255, 255, 0.05)'
        },
        card: {
            blur: 24,
            saturation: 200,
            opacity: 0.08,
            borderOpacity: 0.12,
            shadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 0 rgba(255, 255, 255, 0.08)'
        },
        modal: {
            blur: 40,
            saturation: 200,
            opacity: 0.12,
            borderOpacity: 0.2,
            shadow: '0 24px 80px rgba(0, 0, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 0 rgba(255, 255, 255, 0.1)'
        },
        navbar: {
            blur: 24,
            saturation: 180,
            opacity: 0.08,
            borderOpacity: 0.12,
            shadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }
    }
}

/**
 * Get glass surface style object for inline styles
 */
export function getGlassSurface(
    theme: 'light' | 'dark',
    variant: 'surface' | 'card' | 'modal' | 'navbar'
): React.CSSProperties {
    const config = liquidGlassTheme[theme][variant]
    
    return {
        background: `linear-gradient(
            135deg,
            rgba(255, 255, 255, ${config.opacity}) 0%,
            rgba(255, 255, 255, ${config.opacity * 0.5}) 50%,
            rgba(255, 255, 255, ${config.opacity}) 100%
        )`,
        backdropFilter: `blur(${config.blur}px) saturate(${config.saturation}%)`,
        WebkitBackdropFilter: `blur(${config.blur}px) saturate(${config.saturation}%)`,
        border: `1px solid rgba(255, 255, 255, ${config.borderOpacity})`,
        boxShadow: config.shadow,
        borderRadius: '20px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }
}

/**
 * Get glass depth class based on elevation
 */
export function getGlassDepth(elevation: 1 | 2 | 3 | 4): string {
    return `liquid-depth-${elevation}`
}

/**
 * Get glass blur class
 */
export function getGlassBlur(intensity: 'sm' | 'md' | 'lg' | 'xl'): string {
    return `liquid-blur-${intensity}`
}

/**
 * Get glass surface class
 */
export function getGlassSurfaceClass(variant: 'light' | 'medium' | 'heavy' | 'ultra' = 'medium'): string {
    return `liquid-glass-${variant}`
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get transition duration based on user preference
 */
export function getTransitionDuration(defaultDuration: string = '0.3s'): string {
    return prefersReducedMotion() ? '0.01ms' : defaultDuration
}

/**
 * Glass color utilities
 */
export const glassColors = {
    light: {
        primary: 'rgba(59, 130, 246, 0.15)',
        secondary: 'rgba(139, 92, 246, 0.15)',
        success: 'rgba(16, 185, 129, 0.15)',
        warning: 'rgba(245, 158, 11, 0.15)',
        error: 'rgba(239, 68, 68, 0.15)',
    },
    dark: {
        primary: 'rgba(59, 130, 246, 0.1)',
        secondary: 'rgba(139, 92, 246, 0.1)',
        success: 'rgba(16, 185, 129, 0.1)',
        warning: 'rgba(245, 158, 11, 0.1)',
        error: 'rgba(239, 68, 68, 0.1)',
    }
}

/**
 * Preset glass component configurations
 */
export const glassPresets = {
    card: {
        className: 'liquid-glass-card',
        hover: true,
        depth: 2
    },
    button: {
        className: 'liquid-glass-button',
        hover: true,
        active: true
    },
    input: {
        className: 'liquid-glass-input',
        focus: true
    },
    modal: {
        className: 'liquid-modal',
        centered: true,
        backdrop: true
    },
    navbar: {
        className: 'liquid-navbar',
        fixed: true
    },
    sidebar: {
        className: 'liquid-sidebar',
        overlay: false
    },
    footer: {
        className: 'liquid-footer',
        borderTop: true
    }
}

