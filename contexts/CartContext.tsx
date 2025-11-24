"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { CourseCardData } from "@/types/courseCard"

export interface CartItem {
    id: number
    title: string
    price: number
    priceLabel: string
    image: string
    level: string
    category: string
    educator: string
    preview?: CourseCardData["preview"]
}

interface CartContextValue {
    items: CartItem[]
    addItem: (course: CourseCardData) => void
    removeItem: (courseId: number) => void
    clear: () => void
    isInCart: (courseId: number) => boolean
    total: number
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const STORAGE_KEY = "n4l-cart-items"

const parsePriceValue = (course: CourseCardData): number => {
    if (typeof course.priceValue === "number") return course.priceValue
    const value = parseFloat(course.price.replace(/[^0-9.]/g, ""))
    return Number.isFinite(value) ? value : 0
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([])
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        try {
            const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
            if (stored) {
                setItems(JSON.parse(stored))
            }
        } catch (error) {
            console.warn("Failed to restore cart items:", error)
        } finally {
            setIsReady(true)
        }
    }, [])

    useEffect(() => {
        if (!isReady) return
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        } catch (error) {
            console.warn("Failed to persist cart items:", error)
        }
    }, [items, isReady])

    const addItem = useCallback((course: CourseCardData) => {
        setItems(prev => {
            if (prev.some(item => item.id === course.id)) return prev
            const next: CartItem = {
                id: course.id,
                title: course.title,
                price: parsePriceValue(course),
                priceLabel: course.price,
                image: course.image,
                level: course.level,
                category: course.category,
                educator: course.educator,
                preview: course.preview,
            }
            return [...prev, next]
        })
    }, [])

    const removeItem = useCallback((courseId: number) => {
        setItems(prev => prev.filter(item => item.id !== courseId))
    }, [])

    const clear = useCallback(() => {
        setItems([])
    }, [])

    const isInCart = useCallback(
        (courseId: number) => {
            return items.some(item => item.id === courseId)
        },
        [items],
    )

    const total = useMemo(() => {
        return items.reduce((sum, item) => sum + item.price, 0)
    }, [items])

    const value = useMemo(
        () => ({
            items,
            addItem,
            removeItem,
            clear,
            isInCart,
            total,
        }),
        [items, addItem, removeItem, clear, isInCart, total],
    )

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = (): CartContextValue => {
    const ctx = useContext(CartContext)
    if (!ctx) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return ctx
}

