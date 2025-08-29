import { addToast, ToastProvider, Button } from "@heroui/react";
import React from "react";

interface MyToastProps {
    position: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export default function MyToast({ position }: MyToastProps) {
    const [placement, setPlacement] = React.useState(position);

    return (
        <>
            <div className="fixed z-[100]">
                <ToastProvider
                    placement={placement}
                    toastOffset={placement.includes("top") ? 60 : 0}
                />
            </div>

            <div className="flex flex-wrap gap-2">
                <Button
                    variant={"flat"}
                    onPress={() => {
                        addToast({
                            title: "Toast title",
                            description: "Toast displayed successfully",
                        });
                    }}
                >
                    {placement}
                </Button>
            </div>
        </>
    );
}