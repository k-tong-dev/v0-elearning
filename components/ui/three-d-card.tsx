import React, {useRef, useState} from "react";
import {cn} from "@/utils/utils";

type ThreeDCardProps = {
    children: React.ReactNode;
    className?: string;
    rotationMultiplier?: number;
};

export function ThreeDCard({children, className, rotationMultiplier = 15}: ThreeDCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({});

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const element = ref.current;
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * rotationMultiplier;
        const rotateY = ((x - centerX) / centerX) * -rotationMultiplier;

        setStyle({
            transform: `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02,1.02,1.02)`,
            // boxShadow: `${-rotateY * 2}px ${rotateX * 2}px 50px rgba(99, 102, 241, 0.25)`,
        });
    };

    const reset = () => {
        setStyle({
            transform: "rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",
            // boxShadow: "0 20px 45px rgba(0,0,0,0.2)",
        });
    };

    return (
        <div
            style={{perspective: "1200px"}}
            className={cn("group relative", className)}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseMove}
            onMouseLeave={reset}
        >
            <div
                ref={ref}
                style={style}
                className="transition-transform duration-200 ease-out will-change-transform"
            >
                {children}
            </div>
        </div>
    );
}


