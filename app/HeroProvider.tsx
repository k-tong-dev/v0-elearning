// app/providers.tsx

import {HeroUIProvider} from '@heroui/react'

export function HeroProviders({children}: { children: React.ReactNode }) {
    return (
        <HeroUIProvider>
            {children}
        </HeroUIProvider>
    )
}