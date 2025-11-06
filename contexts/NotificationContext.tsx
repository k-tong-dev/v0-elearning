"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

interface NotificationContextType {
    isNotificationSidebarOpen: boolean
    openNotificationSidebar: () => void
    closeNotificationSidebar: () => void
    toggleNotificationSidebar: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false)

    const openNotificationSidebar = useCallback(() => {
        setIsNotificationSidebarOpen(true)
    }, [])

    const closeNotificationSidebar = useCallback(() => {
        setIsNotificationSidebarOpen(false)
    }, [])

    const toggleNotificationSidebar = useCallback(() => {
        setIsNotificationSidebarOpen(prev => !prev)
    }, [])

    return (
        <NotificationContext.Provider
            value={{
                isNotificationSidebarOpen,
                openNotificationSidebar,
                closeNotificationSidebar,
                toggleNotificationSidebar,
            }}
        >
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotification() {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider')
    }
    return context
}

