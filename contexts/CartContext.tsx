"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { toast } from "sonner"

export interface CartItem {
    id: number
    courseId: number
    title: string
    description: string
    image: string
    price: number
    priceFormatted: string
    instructor: string
    addedAt: Date
}

interface CartContextType {
    items: CartItem[]
    itemCount: number
    totalPrice: number
    totalPriceFormatted: string
    addToCart: (course: {
        id: number
        title: string
        description: string
        image: string
        priceValue: number
        price: string
        educator: string
    }) => void
    removeFromCart: (courseId: number) => void
    clearCart: () => void
    isInCart: (courseId: number) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("cart")
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart)
                setItems(parsed.map((item: any) => ({
                    ...item,
                    addedAt: new Date(item.addedAt)
                })))
            } catch (error) {
                console.error("Failed to parse cart from localStorage:", error)
            }
        }
    }, [])

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(items))
    }, [items])

    const addToCart = (course: {
        id: number
        title: string
        description: string
        image: string
        priceValue: number
        price: string
        educator: string
    }) => {
        // Check if already in cart
        if (items.some(item => item.courseId === course.id)) {
            toast.info("Course is already in cart")
            return
        }

        const newItem: CartItem = {
            id: Date.now(),
            courseId: course.id,
            title: course.title,
            description: course.description,
            image: course.image,
            price: course.priceValue,
            priceFormatted: course.price,
            instructor: course.educator,
            addedAt: new Date()
        }

        setItems(prev => [...prev, newItem])
        toast.success(`Added "${course.title}" to cart`)
    }

    const removeFromCart = (courseId: number) => {
        setItems(prev => prev.filter(item => item.courseId !== courseId))
        toast.success("Removed from cart")
    }

    const clearCart = () => {
        setItems([])
        toast.success("Cart cleared")
    }

    const isInCart = (courseId: number) => {
        return items.some(item => item.courseId === courseId)
    }

    const itemCount = items.length

    const totalPrice = items.reduce((sum, item) => sum + item.price, 0)

    const totalPriceFormatted = `$${totalPrice.toFixed(2)}`

    return (
        <CartContext.Provider
            value={{
                items,
                itemCount,
                totalPrice,
                totalPriceFormatted,
                addToCart,
                removeFromCart,
                clearCart,
                isInCart
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
