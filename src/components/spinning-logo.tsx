"use client";

import React from "react";

interface SpinningLogoProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
    sm: "w-32 h-16",
    md: "w-48 h-24",
    lg: "w-72 h-32",
    xl: "w-96 h-48",
};

export function SpinningLogo({ className = "", size = "lg" }: SpinningLogoProps) {
    return (
        <div className={`relative ${sizes[size]} flex items-center justify-center ${className}`}>
            {/* Static Text Layer */}
            <img
                src="/gilcasound_logo.png"
                alt="GilcaSound Logo"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{
                    maskImage: "radial-gradient(circle, transparent 20%, black 20.5%)",
                    WebkitMaskImage: "radial-gradient(circle, transparent 20%, black 20.5%)",
                }}
            />
            {/* Spinning Disk Layer */}
            <div className="animate-vinyl absolute flex items-center justify-center w-full h-full">
                <img
                    src="/gilcasound_logo.png"
                    alt="GilcaSound Disk"
                    className="w-full h-full object-contain"
                    style={{
                        maskImage: "radial-gradient(circle, black 20%, transparent 20.5%)",
                        WebkitMaskImage: "radial-gradient(circle, black 20%, transparent 20.5%)",
                    }}
                />
            </div>
        </div>
    );
}
