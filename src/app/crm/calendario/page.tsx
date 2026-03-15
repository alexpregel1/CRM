"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, Loader2, ExternalLink, Disc3, Link } from "lucide-react";

import { DJ_CONFIG, DJ_NAMES, DJName, detectarDJs, PackType, PACK_CONFIG, tieneExtras } from "@/lib/djs";

// ─── DJ Config ────────────────────────────────────────────────────────────────

function detectarDJ(titulo: string): DJName | null {
    const detectados = detectarDJs(titulo);
    return detectados.length > 0 ? detectados[0] : null;
}

function esEventoDisponibilidad(titulo: string): boolean {
    const t = titulo.toUpperCase();
    return t.includes("NO DISPONIBLE") ||
        t.includes("OCUPADO") ||
        t.includes("OCUPADOS") ||
        t.includes("BLOQUEADO") ||
        t.includes("DISPO") ||
        t.includes("DSIPONIBLES");
}

// ─── Types ────────────────────────────────────────────────────────────────────
type EventoStatus = "confirmado" | "tentativo" | "completado" | "cancelado";

type Evento = {
    id: string;
    titulo: string;
    descripcion: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    ubicacion: string;
    status: EventoStatus;
    googleLink: string;
    packs_detectados?: PackType[];
    djs_detectados?: DJName[];
};

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<EventoStatus, { label: string; dot: string; bg: string; border: string; text: string }> = {
    confirmado: { label: "Confirmado", dot: "bg-green-400", bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
    tentativo: { label: "Tentativo", dot: "bg-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
    completado: { label: "Completado", dot: "bg-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
    cancelado: { label: "Cancelado", dot: "bg-red-400", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
};

const DAYS_SHORT = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function getFirstDayOfMonth(year: number, month: number): number {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

// ─── Event Detail Drawer ───────────────────────────────────────────────────────
function EventoDetail({ evento, onClose }: { evento: Evento; onClose: () => void }) {
    const cfg = STATUS_CFG[evento.status];

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="w-96 h-full bg-card border-l border-border p-6 overflow-y-auto flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold leading-tight">{evento.titulo}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Google Calendar</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">&times;</button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {evento.djs_detectados?.length ? (
                        evento.djs_detectados.map(dj => {
                            const djCfg = DJ_CONFIG[dj];
                            if (!djCfg) return null;
                            return (
                                <span key={dj} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${djCfg.bg} ${djCfg.border} ${djCfg.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${djCfg.dot}`} />
                                    DJ {dj}
                                </span>
                            );
                        })
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-red-500/10 border-red-500/20 text-red-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Equipo por confirmar
                        </span>
                    )}
                    {evento.packs_detectados?.map(pack => {
                        const packCfg = PACK_CONFIG[pack];
                        if (!packCfg) return null;
                        return (
                            <span key={pack} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${packCfg.bg} ${packCfg.border} ${packCfg.text}`}>
                                {pack}
                            </span>
                        );
                    })}
                    {evento.descripcion && tieneExtras(evento.descripcion) && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-purple-500/10 border-purple-500/20 text-purple-400">
                            + Extras
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {[
                        { label: "Fecha", value: evento.fecha, icon: <Calendar className="h-3.5 w-3.5" /> },
                        { label: "Horario", value: evento.hora_fin ? `${evento.hora_inicio} – ${evento.hora_fin}` : evento.hora_inicio, icon: <Clock className="h-3.5 w-3.5" /> },
                        { label: "Ubicación", value: evento.ubicacion || "No especificada", icon: <MapPin className="h-3.5 w-3.5" /> },
                    ].map(({ label, value, icon }) => (
                        <div key={label} className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</span>
                            <span className="text-sm flex items-center gap-1.5 text-foreground">{icon}{value}</span>
                        </div>
                    ))}
                </div>

                {evento.descripcion && (
                    <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Descripción</span>
                        <p className="text-sm text-muted-foreground bg-secondary rounded-lg p-3 mt-1 whitespace-pre-wrap">{evento.descripcion}</p>
                    </div>
                )}

                {evento.googleLink && (
                    <div className="mt-auto pt-4 border-t border-border">
                        <a href={evento.googleLink} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="w-full border-border hover:bg-secondary gap-1.5">
                                <ExternalLink className="h-3.5 w-3.5" /> Ver en Google Calendar
                            </Button>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Connect Prompt ────────────────────────────────────────────────────────────
function ConnectPrompt() {
    return (
        <Card className="bg-card border-border">
            <CardContent className="p-12 text-center flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                    <Calendar className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-1">Conecta tu Google Calendar</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Conecta tu cuenta de Google para ver los eventos del calendario &quot;FECHAS DJ&apos;S&quot; directamente aquí.
                    </p>
                </div>
                <a href="/api/google/auth">
                    <Button className="gap-2 bg-foreground hover:bg-foreground/90 text-background">
                        <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        Conectar Google Calendar
                    </Button>
                </a>
            </CardContent>
        </Card>
    );
}

// ─── Bookings View ───────────────────────────────────────────────────────────────
function BookingsView({ eventos }: { eventos: Evento[] }) {
    const [numWeekends, setNumWeekends] = useState(6);
    const [selectedDate, setSelectedDate] = useState<string>("");

    // Calculate upcoming weekends
    const weekends = [];
    let d = new Date();
    if (selectedDate) {
        d = new Date(selectedDate);
    }
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diffToFriday = day === 0 ? -2 : (day === 6 ? -1 : 5 - day);
    d.setDate(d.getDate() + diffToFriday);

    const limit = selectedDate ? 1 : numWeekends;

    for (let i = 0; i < limit; i++) {
        const fri = new Date(d);
        const sat = new Date(d); sat.setDate(sat.getDate() + 1);
        weekends.push({ fri, sat });
        d.setDate(d.getDate() + 7);
    }

    const processDay = (date: Date) => {
        const dateStr = date.toDateString();
        const dayEvents = eventos.filter(ev => new Date(ev.fecha).toDateString() === dateStr);

        return DJ_NAMES.map(dj => {
            const evForDj = dayEvents.find(ev => ev.djs_detectados?.includes(dj));
            if (evForDj) {
                if (esEventoDisponibilidad(evForDj.titulo)) {
                    return { dj, status: "no_disponible" as const, event: evForDj };
                } else {
                    return { dj, status: "evento" as const, event: evForDj };
                }
            }
            return { dj, status: "libre" as const };
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <h3 className="font-bold text-lg">Disponibilidad de Fin de Semana</h3>
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            className="w-auto h-8 text-xs"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        {selectedDate && (
                            <Button variant="ghost" size="sm" onClick={() => setSelectedDate("")} className="h-8 px-2 text-xs">
                                Limpiar
                            </Button>
                        )}
                    </div>
                </div>
                {!selectedDate && (
                    <Button variant="outline" size="sm" onClick={() => setNumWeekends(n => n + 4)} className="border-border">
                        Cargar más findes
                    </Button>
                )}
            </div>
            {weekends.map((wk, i) => {
                const titleStr = `${wk.fri.getDate()} ${MONTHS[wk.fri.getMonth()].slice(0, 3)} - ${wk.sat.getDate()} ${MONTHS[wk.sat.getMonth()].slice(0, 3)}`;

                return (
                    <Card key={i} className="bg-card border-border overflow-hidden">
                        <CardHeader className="bg-secondary/30 pb-3 pt-4 px-4 border-b border-border">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                <Calendar className="h-4 w-4 text-[#4684A0]" /> Fin de semana: {titleStr}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                            {[{ label: "Viernes", date: wk.fri }, { label: "Sábado", date: wk.sat }].map(dInfo => {
                                const statusList = processDay(dInfo.date);
                                const libres = statusList.filter(s => s.status === "libre");
                                const ocupados = statusList.filter(s => s.status !== "libre");

                                return (
                                    <div key={dInfo.label} className="p-4">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{dInfo.label} {dInfo.date.getDate()}</h4>

                                        <div className="space-y-4">
                                            {ocupados.length > 0 && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground/50 mb-2 font-medium uppercase">Ocupados / No Disp</p>
                                                    <div className="space-y-1.5">
                                                        {ocupados.map((o, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-white/[0.02] border border-white/5 flex-wrap gap-2">
                                                                <span className="font-bold text-sm flex items-center gap-2 text-foreground">
                                                                    <span className={`w-2 h-2 rounded-full ${o.status === 'no_disponible' ? 'bg-red-500' : 'bg-orange-500'}`} />
                                                                    {o.dj}
                                                                </span>
                                                                <span className={`text-[11px] truncate max-w-full md:max-w-[200px] ${o.status === 'no_disponible' ? 'text-red-400/80' : 'text-orange-400/80'}`}>
                                                                    {o.event?.titulo}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {libres.length > 0 && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground/50 mb-2 font-medium uppercase">Libres</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {libres.map(l => (
                                                            <span key={l.dj} className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                                                {l.dj}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CalendarioPage() {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selected, setSelected] = useState<Evento | null>(null);
    const [view, setView] = useState<"mes" | "lista" | "bookings" | "anual">("mes");
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);
    const [needsAuth, setNeedsAuth] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [djFilter, setDjFilter] = useState<string>("todos");
    const [copied, setCopied] = useState(false);

    const handleCopyFormLink = async () => {
        const url = `${window.location.origin}/disponibilidad.html`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            prompt("Copia este enlace:", url);
        }
    };

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/google/events");
            if (res.status === 401) {
                setNeedsAuth(true);
                setLoading(false);
                return;
            }
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error fetching events");
            }
            const data = await res.json();
            setEventos(data.events || []);
            setNeedsAuth(false);
        } catch (err: unknown) {
            const e = err as Error;
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    const firstDay = getFirstDayOfMonth(year, month);
    const daysInMonth = getDaysInMonth(year, month);

    // Mark past confirmed events as "completado"
    const processedEventos = eventos.map(e => {
        const eventDate = new Date(e.fecha);
        if (eventDate < today && e.status === "confirmado") {
            return { ...e, status: "completado" as EventoStatus };
        }
        return e;
    });

    // Apply DJ filter
    const filteredEventos = djFilter === "todos"
        ? processedEventos
        : processedEventos.filter(e => detectarDJ(e.titulo) === djFilter);

    // REAL BUSINESS EVENTS (Excluding "No disponible", "Ocupados", etc.)
    const eventosReales = filteredEventos.filter(e => !esEventoDisponibilidad(e.titulo));

    const eventosThisMonth = eventosReales.filter(e => {
        const d = new Date(e.fecha);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    const eventosThisYear = eventosReales.filter(e => {
        const d = new Date(e.fecha);
        return d.getFullYear() === year;
    });

    const getMonthCount = (mIndex: number) => {
        return eventosReales.filter(e => {
            const d = new Date(e.fecha);
            return d.getFullYear() === year && d.getMonth() === mIndex;
        }).length;
    };

    const eventosByDay: Record<number, Evento[]> = {};
    // Note: We use filteredEventos for the grid to keep seeing availability markers
    filteredEventos.filter(e => {
        const d = new Date(e.fecha);
        return d.getFullYear() === year && d.getMonth() === month;
    }).forEach(e => {
        const day = new Date(e.fecha).getDate();
        if (!eventosByDay[day]) eventosByDay[day] = [];
        eventosByDay[day].push(e);
    });

    const upcomingEventos = eventosReales
        .filter(e => new Date(e.fecha) >= today && e.status !== "cancelado")
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // Helper: get chip style for an event (Availability red > DJ color > status color)
    function getChipStyle(ev: Evento) {
        if (esEventoDisponibilidad(ev.titulo)) {
            return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" };
        }
        const dj = detectarDJ(ev.titulo);
        if (dj) {
            const cfg = DJ_CONFIG[dj];
            return { bg: cfg.bg, border: cfg.border, text: cfg.color };
        }
        const cfg = STATUS_CFG[ev.status];
        return { bg: cfg.bg, border: cfg.border, text: cfg.text };
    }

    // ─── Render ─────────────────────────────────────────────────────────────────
    if (needsAuth) {
        return (
            <div className="min-h-screen bg-background text-foreground p-6 font-sans">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
                    <p className="text-muted-foreground text-sm mt-1">Agenda de eventos · SanderTone Events</p>
                </header>
                <ConnectPrompt />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-6 font-sans selection:bg-primary/30">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Agenda de eventos · GilcaSound Events
                        {!loading && <span className="ml-2 text-xs text-green-400">● Google Calendar conectado</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* DJ filter */}
                    <Select value={djFilter} onValueChange={setDjFilter}>
                        <SelectTrigger className={`h-8 w-40 text-xs border-border bg-secondary ${djFilter !== "todos" && DJ_CONFIG[djFilter as DJName] ? `${DJ_CONFIG[djFilter as DJName].color} ${DJ_CONFIG[djFilter as DJName].border} ${DJ_CONFIG[djFilter as DJName].bg}` : ""}`}>
                            <Disc3 className="h-3.5 w-3.5 mr-1 opacity-60 shrink-0" />
                            <SelectValue placeholder="Filtrar DJ" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                            <SelectItem value="todos">Todos los DJs</SelectItem>
                            {DJ_NAMES.map(dj => (
                                <SelectItem key={dj} value={dj}>
                                    <span className={`flex items-center gap-2 ${DJ_CONFIG[dj].color}`}>
                                        <span className={`w-2 h-2 rounded-full ${DJ_CONFIG[dj].dot}`} />
                                        {dj}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Navigation Dropdowns */}
                    <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-lg border border-border/40">
                        <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                            <SelectTrigger className="h-7 w-32 border-none bg-transparent font-bold text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#020617] border-white/10 z-[100]">
                                {MONTHS.map((m, i) => (
                                    <SelectItem key={m} value={i.toString()} className="text-xs">{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                            <SelectTrigger className="h-7 w-20 border-none bg-transparent font-bold text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#020617] border-white/10 z-[100]">
                                {[2024, 2025, 2026, 2027].map(y => (
                                    <SelectItem key={y} value={y.toString()} className="text-xs">{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-0.5 border-l border-border/40 ml-1 pl-1">
                            <button onClick={prevMonth} className="p-1 rounded hover:bg-white/10 text-muted-foreground transition-colors">
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={nextMonth} className="p-1 rounded hover:bg-white/10 text-muted-foreground transition-colors">
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <div className="flex items-center h-8 rounded-md border border-border bg-secondary/30 overflow-hidden transition-all hover:border-border/80">
                            <a
                                href="/disponibilidad.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 h-full text-xs font-medium hover:bg-secondary transition-colors border-r border-border"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Form. Disponibilidad
                            </a>
                            <button
                                onClick={handleCopyFormLink}
                                className={`flex items-center justify-center w-8 h-full transition-all hover:bg-secondary ${copied ? "text-green-400 bg-green-500/10" : "text-muted-foreground"}`}
                                title="Copiar enlace"
                            >
                                <Link className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* View toggle iOS style */}
                    <div className="relative flex items-center bg-secondary/50 p-1 rounded-full border border-border/40 w-[360px] h-9">
                        {/* Sliding selector */}
                        <div
                            className="absolute top-1 bottom-1 left-1 rounded-full bg-foreground shadow-lg transition-all duration-300 ease-out"
                            style={{
                                width: "calc(25% - 2px)",
                                transform: `translateX(${view === "mes" ? "0%" : view === "lista" ? "101.5%" : view === "bookings" ? "203%" : "304.5%"})`
                            }}
                        />

                        {(["mes", "lista", "bookings", "anual"] as const).map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`relative z-10 flex-1 h-full text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${view === v ? "text-background" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {v === "mes" ? "Mes" : v === "lista" ? "Lista" : v === "bookings" ? "Bookings" : "Anual"}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Este mes", value: loading ? "..." : eventosThisMonth.length, sub: djFilter !== "todos" ? `DJ ${djFilter}` : "eventos", color: "text-foreground" },
                    { label: "Total este Año", value: loading ? "..." : eventosThisYear.length, sub: `en el año ${year}`, color: "text-green-400" },
                    { label: "Total cargados", value: loading ? "..." : eventosReales.length, sub: djFilter !== "todos" ? `DJ ${djFilter}` : "todos los DJs", color: "text-foreground" },
                    { label: "Próximo evento", value: loading ? "..." : (upcomingEventos[0]?.fecha || "—"), sub: loading ? "" : (upcomingEventos[0]?.titulo || ""), color: "text-blue-400" },
                ].map(kpi => (
                    <Card key={kpi.label} className="bg-card border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground tracking-wider uppercase">{kpi.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{kpi.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {loading ? (
                <Card className="bg-card border-border">
                    <CardContent className="p-12 text-center flex flex-col items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Cargando eventos de Google Calendar...</p>
                    </CardContent>
                </Card>
            ) : error ? (
                <Card className="bg-card border-border">
                    <CardContent className="p-8 text-center">
                        <p className="text-sm text-red-400 mb-4">{error}</p>
                        <Button variant="outline" onClick={fetchEvents} className="border-border">Reintentar</Button>
                    </CardContent>
                </Card>
            ) : view === "mes" ? (
                <Card className="bg-card border-border">
                    <CardHeader className="border-b border-border py-4 px-6 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            {MONTHS[month]} <span className="text-muted-foreground/50">{year}</span>
                        </CardTitle>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={prevMonth}
                                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                                title="Mes anterior"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                                title="Siguiente mes"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 mb-2">
                            {DAYS_SHORT.map(d => (
                                <div key={d} className="text-center text-[10px] uppercase tracking-wider text-muted-foreground py-2">{d}</div>
                            ))}
                        </div>
                        {/* Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                                const dayEvents = eventosByDay[day] || [];
                                return (
                                    <div
                                        key={day}
                                        className={`min-h-[72px] rounded-lg p-1.5 border transition-colors ${isToday ? "border-foreground/30 bg-foreground/5" : "border-border hover:border-muted-foreground/20 hover:bg-secondary/30"}`}
                                    >
                                        <p className={`text-xs font-medium mb-1 ${isToday ? "text-foreground" : "text-muted-foreground"}`}>{day}</p>
                                        <div className="space-y-0.5">
                                            {dayEvents.slice(0, 2).map(ev => {
                                                const { bg, border, text } = getChipStyle(ev);
                                                return (
                                                    <button
                                                        key={ev.id}
                                                        onClick={() => setSelected(ev)}
                                                        className={`w-full text-left text-[9px] px-1.5 py-0.5 rounded truncate border ${bg} ${border} ${text} hover:opacity-80 transition-opacity`}
                                                    >
                                                        {ev.titulo}
                                                    </button>
                                                );
                                            })}
                                            {dayEvents.length > 2 && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button className="text-[9px] text-muted-foreground px-1 w-full text-left hover:text-white transition-colors cursor-pointer block">+{dayEvents.length - 2} más</button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-56 p-2 bg-[#020617] border-white/10 z-50">
                                                        <p className="text-xs font-semibold px-2 pb-2 mb-2 border-b border-white/10 text-foreground">Eventos del día {day}</p>
                                                        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                                                            {dayEvents.map(ev => {
                                                                const { bg, border, text } = getChipStyle(ev);
                                                                return (
                                                                    <button
                                                                        key={ev.id}
                                                                        onClick={() => setSelected(ev)}
                                                                        className={`w-full text-left text-xs px-2 py-1.5 rounded border ${bg} ${border} ${text} hover:opacity-80 transition-opacity flex flex-col gap-0.5`}
                                                                    >
                                                                        <span className="font-semibold truncate w-full">{ev.titulo}</span>
                                                                        <span className="text-[10px] opacity-80 truncate w-full leading-tight font-medium">{ev.ubicacion || 'Sin ubicación'}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 mt-6 pt-5 border-t border-border flex-wrap">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-3 font-semibold">Leyenda</span>

                            <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                                <span className={`w-2 h-2 rounded-full ${STATUS_CFG['confirmado'].dot}`} />
                                Confirmado
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                                <span className={`w-2 h-2 rounded-full ${STATUS_CFG['completado'].dot}`} />
                                Completado
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                                <span className={`w-2 h-2 rounded-full bg-red-400`} />
                                Ocupado / No Disponible
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : view === "anual" ? (
                /* Yearly overview */
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {MONTHS.map((m, i) => {
                            const count = getMonthCount(i);
                            const isCurrentMonth = i === today.getMonth() && year === today.getFullYear();
                            return (
                                <Card
                                    key={m}
                                    className={`bg-card border-border hover:border-[#4684A0]/50 transition-all cursor-pointer group shadow-lg ${isCurrentMonth ? 'ring-1 ring-[#4684A0]/50 bg-[#4684A0]/5' : ''}`}
                                    onClick={() => { setMonth(i); setView("mes"); }}
                                >
                                    <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                                        <p className={`text-[10px] uppercase tracking-wider font-semibold ${isCurrentMonth ? 'text-[#4684A0]' : 'text-zinc-500'}`}>{m}</p>
                                        <div className="text-2xl font-black text-foreground group-hover:scale-110 transition-transform duration-300">{count}</div>
                                        <p className="text-[8px] text-foreground/50 font-bold uppercase tracking-wider">Eventos</p>
                                        <div className={`w-6 h-0.5 rounded-full mt-1.5 transition-all group-hover:w-10 ${count > 0 ? 'bg-[#4684A0]' : 'bg-muted-foreground/10'}`} />
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* DJ Workload Section */}
                    <Card className="bg-card/30 border-white/[0.05] overflow-hidden">
                        <CardHeader className="py-4 px-6 border-b border-white/[0.05] bg-white/[0.01]">
                            <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 flex items-center gap-2">
                                <Disc3 className="h-4 w-4 text-[#4684A0]" /> Ranking de Carga DJ - {year}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {DJ_NAMES.map(dj => {
                                    const djEvents = eventosThisYear.filter(e => e.djs_detectados?.includes(dj));
                                    const djTotal = djEvents.length;
                                    const cfg = DJ_CONFIG[dj];
                                    return (
                                        <Popover key={dj}>
                                            <PopoverTrigger asChild>
                                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-all cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${cfg.bg} ${cfg.color} border ${cfg.border} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                                                            {dj[0]}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-foreground/90 group-hover:text-[#4684A0] transition-colors">{dj}</span>
                                                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Ver eventos</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`text-xl font-black ${cfg.color}`}>{djTotal}</div>
                                                        <div className="text-[8px] text-muted-foreground/50 uppercase font-bold tracking-tighter">Eventos Anuales</div>
                                                    </div>
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 bg-[#020617] border-white/10 p-0 shadow-2xl z-[150]" side="bottom" align="end">
                                                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Eventos {dj} - {year}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black bg-secondary px-2 py-0.5 rounded-full">{djTotal}</span>
                                                </div>
                                                <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                                                    {djEvents.length === 0 ? (
                                                        <div className="p-8 text-center text-xs text-muted-foreground italic">
                                                            No hay eventos asignados este año
                                                        </div>
                                                    ) : (
                                                        <div className="py-2">
                                                            {MONTHS.map((m, mIdx) => {
                                                                const monthEvents = djEvents.filter(e => new Date(e.fecha).getMonth() === mIdx);
                                                                if (monthEvents.length === 0) return null;
                                                                return (
                                                                    <div key={m} className="mb-4 last:mb-0">
                                                                        <div className="px-4 py-1.5 bg-white/[0.03] text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 italic">
                                                                            {m}
                                                                        </div>
                                                                        {monthEvents.map(ev => {
                                                                            const d = new Date(ev.fecha);
                                                                            return (
                                                                                <div key={ev.id} className="px-4 py-2 hover:bg-white/[0.03] transition-colors flex flex-col gap-0.5 border-b border-white/[0.02] last:border-0">
                                                                                    <div className="text-[11px] font-bold text-foreground/90 leading-tight">{ev.titulo}</div>
                                                                                    <div className="text-[9px] text-muted-foreground/50 flex items-center gap-1.5 font-medium">
                                                                                        <Calendar className="h-2.5 w-2.5" />
                                                                                        {d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : view === "lista" ? (
                /* Lista view */
                <div className="space-y-3">
                    {upcomingEventos.length === 0 ? (
                        <Card className="bg-card border-border">
                            <CardContent className="p-8 text-center text-muted-foreground">
                                {djFilter !== "todos" ? `No hay eventos próximos para DJ ${djFilter}` : "No hay eventos próximos"}
                            </CardContent>
                        </Card>
                    ) : (
                        upcomingEventos.map(ev => {
                            const cfg = STATUS_CFG[ev.status];
                            const d = new Date(ev.fecha);
                            const isNoDisponible = ev.titulo.toUpperCase().includes("NO DISPONIBLE");
                            return (
                                <Card key={ev.id} className={`bg-card transition-all cursor-pointer border ${isNoDisponible ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50 hover:bg-red-500/10' : 'border-border hover:border-muted-foreground/20'}`} onClick={() => setSelected(ev)}>
                                    <CardContent className="p-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 text-center flex-shrink-0">
                                                <p className={`text-lg font-bold leading-none ${isNoDisponible ? 'text-red-400' : ''}`}>{d.getDate()}</p>
                                                <p className={`text-[10px] uppercase ${isNoDisponible ? 'text-red-400/70' : 'text-muted-foreground'}`}>{MONTHS[d.getMonth()].slice(0, 3)}</p>
                                            </div>
                                            <div className={`w-px h-10 ${isNoDisponible ? 'bg-red-500/30' : 'bg-border'}`} />
                                            <div>
                                                <p className={`font-semibold text-sm ${isNoDisponible ? 'text-red-400' : ''}`}>{ev.titulo}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ev.hora_inicio}</span>
                                                    {ev.ubicacion && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.ubicacion}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                                            {ev.djs_detectados?.length ? (
                                                ev.djs_detectados.map(dj => {
                                                    const djCfg = DJ_CONFIG[dj];
                                                    if (!djCfg) return null;
                                                    return (
                                                        <span key={dj} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border font-medium ${isNoDisponible ? 'border-red-500/30 text-red-400' : `${djCfg.bg} ${djCfg.border} ${djCfg.color}`}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${isNoDisponible ? 'bg-red-400' : djCfg.dot}`} />
                                                            {dj}
                                                        </span>
                                                    );
                                                })
                                            ) : !isNoDisponible ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs border bg-red-500/10 border-red-500/20 text-red-500 font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                    ! Equipo por confirmar
                                                </span>
                                            ) : null}
                                            {ev.packs_detectados?.map(pack => {
                                                const p = PACK_CONFIG[pack];
                                                if (!p) return null;
                                                return (
                                                    <span key={pack} className={`inline-flex items-center px-2 py-1 rounded text-xs border font-medium ${isNoDisponible ? 'border-red-500/30 text-red-400/80 bg-red-500/5' : `${p.bg} ${p.border} ${p.text}`}`}>
                                                        {pack}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            ) : (
                <BookingsView eventos={filteredEventos} />
            )}

            {selected && <EventoDetail evento={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}
