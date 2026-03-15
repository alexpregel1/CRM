"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    if (isLoginPage) {
        return <main className="w-full h-screen overflow-hidden bg-[#09090b]">{children}</main>;
    }

    return (
        <div className="flex h-screen w-full overflow-hidden">
            <TooltipProvider delayDuration={80}>
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-background relative z-0">
                    {children}
                </main>
            </TooltipProvider>
        </div>
    );
}
