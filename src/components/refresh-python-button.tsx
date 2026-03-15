"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function RefreshPythonButton() {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const router = useRouter();

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch("/api/refresh-data", { method: "POST" });
            if (res.ok) {
                // Tells Next.js to re-run Server Components and fetch the latest JSON
                router.refresh();
            } else {
                console.error("Failed to refresh data. The backend python script might have failed.");
            }
        } catch (error) {
            console.error("Error refreshing:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="rounded-full px-5 text-muted-foreground hover:text-white transition-colors h-8 text-xs backdrop-blur-md bg-slate-900/60"
            style={{
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
        >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : "text-muted-foreground"}`} />
            {isRefreshing ? "Running Data Pipeline..." : "Refresh Intelligence"}
        </Button>
    );
}
