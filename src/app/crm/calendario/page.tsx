"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, LayoutGrid, List } from "lucide-react";

const CALENDAR_ID = "c_f790766d18a929bc588ac04a5d523515d22f0ad7194fba9fb3fcf6b8352afdc9@group.calendar.google.com";
const CALENDAR_TIMEZONE = "Europe/Madrid";

type CalendarMode = "WEEK" | "MONTH" | "AGENDA";

export default function CalendarioPage() {
    const [mode, setMode] = useState<CalendarMode>("WEEK");

    const buildUrl = (m: CalendarMode) =>
        `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(CALENDAR_ID)}&ctz=${encodeURIComponent(CALENDAR_TIMEZONE)}&showTitle=0&showNav=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0&mode=${m}&bgcolor=%230a0a0a&color=%234684A0`;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col" style={{ height: "100vh" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] shrink-0">
                <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-[#4684A0]" />
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Calendario GilcaSound</h1>
                        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-medium">Eventos y Disponibilidad</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px] border-[#4684A0]/30 text-[#4684A0] bg-[#4684A0]/5 font-mono px-3">
                        EN VIVO
                    </Badge>
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
                        {([
                            { label: "Semana", value: "WEEK" as CalendarMode, icon: <List className="h-3.5 w-3.5" /> },
                            { label: "Mes",    value: "MONTH" as CalendarMode, icon: <LayoutGrid className="h-3.5 w-3.5" /> },
                            { label: "Agenda", value: "AGENDA" as CalendarMode, icon: <CalendarDays className="h-3.5 w-3.5" /> },
                        ]).map(({ label, value, icon }) => (
                            <Button
                                key={value}
                                variant="ghost"
                                size="sm"
                                onClick={() => setMode(value)}
                                className={`h-8 px-3 text-xs rounded-lg gap-1.5 transition-all ${mode === value ? "bg-[#4684A0] text-white hover:bg-[#4684A0]" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                            >
                                {icon} {label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Calendar Embed */}
            <div className="flex-1 relative overflow-hidden">
                <iframe
                    key={mode}
                    src={buildUrl(mode)}
                    style={{
                        border: 0,
                        width: "100%",
                        height: "100%",
                        background: "#0a0a0a",
                        display: "block",
                    }}
                    frameBorder="0"
                    scrolling="no"
                    title="Calendario GilcaSound"
                />
            </div>
        </div>
    );
}
