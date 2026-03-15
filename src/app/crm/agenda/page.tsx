"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, CalendarDays, Disc3, Settings } from "lucide-react";
import { DJ_CONFIG, DJName, PACK_CONFIG, PackType } from "@/lib/djs";

// ─── CONFIGURA TU CALENDAR ID AQUÍ ───────────────────────────────────────────
// Para usar tu calendario principal, pon tu Gmail.
// Para un calendario compartido de empresa, pon el Calendar ID (Settings > Integrations).
// El calendario DEBE estar en modo público para que el embed funcione.
const CALENDAR_ID = "c_f790766d18a929bc588ac04a5d523515d22f0ad7194fba9fb3fcf6b8352afdc9@group.calendar.google.com";
const CALENDAR_TIMEZONE = "Europe/Madrid";
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_EVENTS = [
    {
        id: "1",
        titulo: "BODA MARTÍNEZ · Finca Villa Luz",
        fecha: "2026-03-21",
        hora_inicio: "18:00",
        hora_fin: "03:00",
        ubicacion: "Finca Villa Luz, Alcalá de Henares",
        status: "confirmado" as const,
        djs_detectados: ["Diego", "Felipe"],
        packs_detectados: ["PACK PREMIUM"],
    },
    {
        id: "2",
        titulo: "FIESTA CORPORATIVA · Eurostars Tower",
        fecha: "2026-03-28",
        hora_inicio: "20:00",
        hora_fin: "02:00",
        ubicacion: "Hotel Eurostars Madrid Tower",
        status: "confirmado" as const,
        djs_detectados: ["Luis"],
        packs_detectados: ["PACK BÁSICO"],
    },
    {
        id: "3",
        titulo: "CUMPLE VIP · La Moraleja",
        fecha: "2026-04-05",
        hora_inicio: "19:00",
        hora_fin: "01:00",
        ubicacion: "La Moraleja, Madrid",
        status: "confirmado" as const,
        djs_detectados: ["Peche", "Ichi"],
        packs_detectados: ["PACK PREMIUM"],
    },
];

const MOCK_TASKS = [
    { id: "t1", titulo: "Reunión cliente Diageo España", fecha: "2026-03-17", hora_inicio: "10:00", ubicacion: "Zoom" },
    { id: "t2", titulo: "Visita Finca El Encín", fecha: "2026-03-18", hora_inicio: "12:30", ubicacion: "Alcalá de Henares" },
    { id: "t3", titulo: "Llamada con Raiboc — set cerrado", fecha: "2026-03-19", hora_inicio: "16:00", ubicacion: "" },
    { id: "t4", titulo: "Entrega propuesta Real Club Golf", fecha: "2026-03-20", hora_inicio: "09:00", ubicacion: "" },
];

type ViewMode = "agenda" | "calendario";

export default function AgendaPage() {
    const [view, setView] = useState<ViewMode>("agenda");

    const today = new Date();
    const todayISO = today.toISOString().split("T")[0];

    const nextEvent = MOCK_EVENTS.sort((a, b) => a.fecha.localeCompare(b.fecha))[0];

    const upcomingEvents = MOCK_EVENTS.filter(e => e.fecha >= todayISO)
        .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const calendarEmbedUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(CALENDAR_ID)}&ctz=${encodeURIComponent(CALENDAR_TIMEZONE)}&showTitle=0&showNav=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0&mode=WEEK&bgcolor=%23000000&color=%234684A0`;

    return (
        <div className="min-h-screen bg-background text-foreground p-6 font-sans selection:bg-primary/30">

            {/* Header */}
            <div className="flex items-end justify-between mb-8 pb-6 border-b border-white/[0.05]">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
                        Agenda
                        <Disc3 className="h-5 w-5 text-[#4684A0] animate-spin-slow" />
                    </h1>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium">
                        {today.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setView("agenda")}
                            className={`h-8 px-4 text-xs rounded-lg transition-all ${view === "agenda" ? "bg-[#4684A0] text-white hover:bg-[#4684A0]" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                        >
                            <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> Agenda
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setView("calendario")}
                            className={`h-8 px-4 text-xs rounded-lg transition-all ${view === "calendario" ? "bg-[#4684A0] text-white hover:bg-[#4684A0]" : "text-muted-foreground hover:text-white hover:bg-white/5"}`}
                        >
                            <Calendar className="h-3.5 w-3.5 mr-1.5" /> Calendario
                        </Button>
                    </div>
                    <Button className="h-9 text-xs bg-[#4684A0] hover:bg-[#4684A0]/90 px-4">
                        + Nuevo Evento
                    </Button>
                </div>
            </div>

            {view === "agenda" ? (
                /* ─── AGENDA VIEW ─── */
                <div className="grid grid-cols-12 gap-8">
                    {/* LEFT: Tasks + Next Event */}
                    <div className="col-span-12 lg:col-span-5 space-y-8">

                        {/* Próximo Evento Hero */}
                        <Card className="bg-gradient-to-br from-[#4684A0]/20 to-transparent border-[#4684A0]/20 shadow-[0_0_50px_-12px_rgba(70,132,160,0.2)]">
                            <CardHeader className="py-3 px-6 border-b border-white/[0.05]">
                                <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[#4684A0] flex items-center gap-2">
                                    <Disc3 className="h-4 w-4 animate-spin-slow" /> Próximo Evento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div>
                                    <Badge className="bg-[#4684A0] text-white border-none text-[9px] px-2 py-0 mb-2">CONFIRMADO</Badge>
                                    <h3 className="text-lg font-black tracking-tight text-white uppercase leading-tight">
                                        {nextEvent.titulo}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 mt-3">
                                        <div className="flex items-center gap-2 text-sm font-bold text-[#4684A0]">
                                            <MapPin className="h-4 w-4" /> {nextEvent.ubicacion}
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground text-xs border-l border-white/10 pl-4">
                                            <Clock className="h-3.5 w-3.5" /> {nextEvent.hora_inicio} – {nextEvent.hora_fin}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                                    <div className="flex flex-wrap gap-1.5">
                                        {nextEvent.djs_detectados?.map(dj => (
                                            <Badge key={dj} className={`${DJ_CONFIG[dj as DJName]?.bg} ${DJ_CONFIG[dj as DJName]?.color} border ${DJ_CONFIG[dj as DJName]?.border} text-[9px] font-bold px-2`}>
                                                DJ {dj}
                                            </Badge>
                                        ))}
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground/50">
                                        {new Date(nextEvent.fecha + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tareas / Reuniones */}
                        <Card className="bg-card/50 border-white/[0.05]">
                            <CardHeader className="py-4 px-6 flex flex-row items-center justify-between border-b border-white/[0.05]">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-[#4684A0]" /> Agenda Personal
                                </CardTitle>
                                <Badge variant="outline" className="text-[10px] bg-white/[0.02] border-white/10 font-mono">
                                    {MOCK_TASKS.length} TAREAS
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-white/[0.03]">
                                    {MOCK_TASKS.map(task => (
                                        <div key={task.id} className="p-4 px-6 hover:bg-white/[0.02] transition-all group cursor-pointer">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-mono text-muted-foreground/60">
                                                    {new Date(task.fecha + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })} · {task.hora_inicio}
                                                </span>
                                                <Clock className="h-3 w-3 text-muted-foreground/30 group-hover:text-[#4684A0] transition-colors" />
                                            </div>
                                            <h4 className="text-sm font-semibold text-foreground/90">{task.titulo}</h4>
                                            {task.ubicacion && (
                                                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground/50">
                                                    <MapPin className="h-3 w-3" /> {task.ubicacion}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT: Upcoming Work Events */}
                    <div className="col-span-12 lg:col-span-7">
                        <Card className="bg-card/30 border-white/[0.05] h-full">
                            <CardHeader className="border-b border-white/[0.05] py-4 bg-white/[0.01]">
                                <CardTitle className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" /> Próximos Eventos GilcaSound
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {upcomingEvents.map((ev) => (
                                    <div key={ev.id} className="flex items-center justify-between group p-4 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] transition-all cursor-pointer">
                                        <div className="flex items-center gap-5 min-w-0">
                                            <div className="text-center shrink-0 w-10">
                                                <div className="text-[10px] font-mono text-muted-foreground/40 uppercase">
                                                    {new Date(ev.fecha + "T12:00:00").toLocaleDateString("es-ES", { month: "short" })}
                                                </div>
                                                <div className="text-xl font-black text-foreground/80">
                                                    {new Date(ev.fecha + "T12:00:00").getDate()}
                                                </div>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold text-foreground/90 truncate">{ev.titulo}</span>
                                                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-tighter mt-0.5">
                                                    {ev.hora_inicio} · {ev.ubicacion}
                                                </span>
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {ev.djs_detectados?.map(dj => (
                                                        <Badge key={dj} className={`${DJ_CONFIG[dj as DJName]?.bg} ${DJ_CONFIG[dj as DJName]?.color} border ${DJ_CONFIG[dj as DJName]?.border} text-[8px] font-bold px-1.5 py-0`}>
                                                            {dj}
                                                        </Badge>
                                                    ))}
                                                    {ev.packs_detectados?.map(p => (
                                                        <Badge key={p} className={`${PACK_CONFIG[p as PackType]?.bg} ${PACK_CONFIG[p as PackType]?.text} border ${PACK_CONFIG[p as PackType]?.border} text-[8px] font-bold px-1.5 py-0`}>
                                                            {p}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[9px] shrink-0 ml-4">
                                            CONFIRMADO
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                /* ─── CALENDARIO EMBED VIEW ─── */
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/50 bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3">
                        <Settings className="h-3.5 w-3.5 text-[#4684A0]" />
                        <span>Mostrando el calendario de <span className="text-[#4684A0] font-mono">{CALENDAR_ID}</span> — el calendario debe ser público para que aparezcan los eventos.</span>
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl" style={{ height: "calc(100vh - 260px)", minHeight: "600px" }}>
                        <iframe
                            src={calendarEmbedUrl}
                            style={{ border: 0, width: "100%", height: "100%", background: "#000" }}
                            frameBorder="0"
                            scrolling="no"
                            title="Google Calendar GilcaSound"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
