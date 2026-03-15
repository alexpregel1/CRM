"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, CalendarDays, FileText, TrendingUp, Settings, Box, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";

const crmNavigation = [
    { name: "Agenda", href: "/crm/agenda", icon: LayoutDashboard },
    { name: "Leads & Pipeline", href: "/crm/leads", icon: TrendingUp },
    { name: "Clientes", href: "/crm/clientes", icon: Users },
    { name: "Calendario", href: "/crm/calendario", icon: CalendarDays },
    { name: "Inventario", href: "/crm/inventario", icon: Box },
    { name: "Facturación", href: "/crm/facturacion", icon: FileText },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        // Initial check
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <div
            className="flex h-screen w-64 flex-col border-r border-[#333338]"
            style={{
                background: "#1a1a1d",
            }}
        >
            {/* Logo */}
            <Link href="/crm/leads" className="flex h-16 shrink-0 items-center px-6 mt-4 hover:opacity-90 transition-opacity">
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-10 h-10 flex items-center justify-center overflow-hidden"
                    >
                        <img
                            src="/gilcasound_logo.png"
                            alt="GilcaSound Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div>
                        <p className="text-[15px] font-bold tracking-tight text-white leading-none">GilcaSound</p>
                        <p className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5">CRM</p>
                    </div>
                </div>
            </Link>

            {/* Nav */}
            <div className="flex flex-1 flex-col overflow-y-auto">
                <nav className="flex-1 space-y-1 px-3 py-6">
                    {crmNavigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-center px-3 py-3 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "text-white"
                                        : "text-muted-foreground hover:text-white"
                                )}
                                style={{
                                    borderRadius: 999,
                                    ...(isActive ? {
                                        background: "#2a2a2e",
                                        border: "1px solid #3a3a3f",
                                    } : {})
                                }}
                            >
                                <item.icon
                                    className={cn(
                                        "mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200",
                                        isActive ? "text-white" : "text-muted-foreground group-hover:text-white"
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Settings & Logout */}
            <div className="border-t border-[#333338] p-4 space-y-1">
                <button
                    className="flex w-full items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors duration-200"
                    style={{ borderRadius: 999 }}
                >
                    <Settings className="mr-3 h-5 w-5" />
                    Ajustes
                </button>
                {user && (
                    <button
                        onClick={handleSignOut}
                        className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-400/10 transition-colors duration-200"
                        style={{ borderRadius: 999 }}
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Cerrar sesión
                    </button>
                )}
            </div>
        </div>
    );
}
