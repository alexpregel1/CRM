"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Calendar, MapPin, Clock, Mail, CalendarDays,
    Disc3, User, Smile, ExternalLink, Link, Sparkles, CheckCircle2
} from "lucide-react";
import { DJ_CONFIG, DJName, PACK_CONFIG, PackType, tieneExtras } from "@/lib/djs";
import { supabase } from "@/utils/supabase/client";
import { X } from "lucide-react";

// Modal Component (Integrated)
function EventoDetail({ evento, onClose }: { evento: Evento; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300">
            <div className="flex-1 bg-black/60 backdrop-blur-md" onClick={onClose} />
            <div className="w-full max-w-md h-full bg-[#0a0a0a] border-l border-white/10 p-8 overflow-y-auto flex flex-col gap-6 shadow-2xl">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold leading-tight text-white uppercase">{evento.titulo}</h2>
                        <p className="text-[10px] text-[#4684A0] uppercase font-bold tracking-widest mt-1">Detalles del Evento</p>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {evento.djs_detectados?.map(dj => (
                        <Badge key={dj} className={`${DJ_CONFIG[dj as DJName]?.bg} ${DJ_CONFIG[dj as DJName]?.color} border ${DJ_CONFIG[dj as DJName]?.border} text-[10px] font-bold px-3 py-1`}>
                            DJ {dj}
                        </Badge>
                    ))}
                    {evento.packs_detectados?.map(p => (
                        <Badge key={p} className={`${PACK_CONFIG[p as PackType]?.bg} ${PACK_CONFIG[p as PackType]?.text} border ${PACK_CONFIG[p as PackType]?.border} text-[10px] font-bold px-3 py-1`}>
                            {p}
                        </Badge>
                    ))}
                    {evento.descripcion && tieneExtras(evento.descripcion) && (
                        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px] font-bold px-3 py-1">+ EXTRAS</Badge>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 bg-white/[0.02] rounded-2xl p-5 border border-white/[0.05]">
                    {[
                        { label: "Fecha", value: new Date(evento.fecha).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }), icon: <Calendar className="h-4 w-4 text-[#4684A0]" /> },
                        { label: "Horario", value: evento.hora_fin ? `${evento.hora_inicio} – ${evento.hora_fin}` : (evento.hora_inicio || "Todo el día"), icon: <Clock className="h-4 w-4 text-[#4684A0]" /> },
                        { label: "Ubicación", value: evento.ubicacion || "No especificada", icon: <MapPin className="h-4 w-4 text-[#4684A0]" /> },
                    ].map(({ label, value, icon }) => (
                        <div key={label} className="flex flex-col gap-1">
                            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground/40">{label}</span>
                            <span className="text-sm font-semibold flex items-center gap-2.5 text-white/90">{icon}{value}</span>
                        </div>
                    ))}
                </div>

                {evento.descripcion && (
                    <div className="flex flex-col gap-2">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground/40 px-1">Información Adicional</span>
                        <div className="text-sm text-muted-foreground/80 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 whitespace-pre-wrap leading-relaxed shadow-inner">
                            {evento.descripcion}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

interface Profile {
    name: string;
    given_name: string;
    email: string;
    picture: string;
}

interface Evento {
    id: string;
    titulo: string;
    fecha: string;
    hora_inicio?: string;
    hora_fin?: string;
    ubicacion?: string;
    descripcion?: string;
    status: "confirmado" | "pendiente" | "completado";
    djs_detectados?: string[];
    packs_detectados?: string[];
}

interface Email {
    id: string;
    subject: string;
    from_name: string;
    from_email: string;
    date: string;
    snippet: string;
}

export default function AgendaPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [sbUser, setSbUser] = useState<any>(null);
    const [events, setEvents] = useState<Evento[]>([]);
    const [emails, setEmails] = useState<Email[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loadingEmails, setLoadingEmails] = useState(true);
    const [needsAuth, setNeedsAuth] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split("T")[0];

    useEffect(() => {
        async function fetchData() {
            try {
                const [pRes, eRes, gRes] = await Promise.all([
                    fetch("/api/google/profile"),
                    fetch("/api/google/events"),
                    fetch("/api/google/gmail")
                ]);

                if (pRes.status === 401 || eRes.status === 401 || gRes.status === 401) {
                    setNeedsAuth(true);
                }

                if (pRes.ok) setProfile(await pRes.json());

                // Get Supabase User
                const { data: { user } } = await supabase.auth.getUser();
                setSbUser(user);

                if (eRes.ok) {
                    const data = await eRes.json();
                    setEvents(data.events || []);
                }
                if (gRes.ok) {
                    const data = await gRes.json();
                    setEmails(data.emails || []);
                }
            } catch (err) {
                console.error("Fetch failed", err);
            } finally {
                setLoadingProfile(false);
                setLoadingEvents(false);
                setLoadingEmails(false);
            }
        }
        fetchData();
    }, []);

    // Filters & Logic
    const userFirstName =
        profile?.given_name ||
        sbUser?.user_metadata?.full_name?.split(" ")[0] ||
        sbUser?.user_metadata?.name?.split(" ")[0] ||
        sbUser?.email?.split("@")[0] ||
        "";

    const userName = userFirstName;

    // 1. Next Event for current user (Wedding/Gig where user is assigned)
    const nextUserEvent = events
        .filter(ev => {
            const d = new Date(ev.fecha);
            const title = ev.titulo.toUpperCase();
            // Exclude availability markers (including typos and variants)
            if (title.includes("NO DISPONIBLE") ||
                title.includes("OCUPADO") ||
                title.includes("OCUPADOS") ||
                title.includes("BLOQUEADO") ||
                title.includes("DISPO") ||
                title.includes("DSIPONIBLES")) return false;

            const isWork = title.includes("BODA") ||
                title.includes("FIESTA") ||
                title.includes("SESSION");

            // Strictly check if the assigned user is in the detected list
            const isUserAssigned = ev.djs_detectados?.some(dj => dj.toLowerCase() === userName.toLowerCase());

            return isWork && isUserAssigned && d >= today && ev.status === "confirmado";
        })
        .sort((a, b) => a.fecha.localeCompare(b.fecha))[0];

    // 2. Personal Agenda (Meetings, Calls, Visits - Not big work events)
    const personalTasks = events.filter(ev => {
        const title = ev.titulo.toUpperCase();
        return (title.includes("REUNION") ||
            title.includes("LLAMADA") ||
            title.includes("VISITA") ||
            title.includes("CITA")) &&
            ev.fecha >= todayISO;
    }).slice(0, 5);

    // 3. Work Events (Weddings, Gigs for the week)
    const workEvents = events.filter(ev => {
        const title = ev.titulo.toUpperCase();
        const isWork = title.includes("BODA") || title.includes("FIESTA") || title.includes("SESSION") || title.includes("CUMPLE");
        const d = new Date(ev.fecha);
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        return isWork && d >= today && d < weekEnd;
    });

    const formatEmailDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
        }
        if (diffDays < 7) {
            const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
            return `${days[d.getDay()]} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
        return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    };

    // Group work events by day
    const groupedWork: { [key: string]: Evento[] } = {};
    workEvents.forEach(ev => {
        if (!groupedWork[ev.fecha]) groupedWork[ev.fecha] = [];
        groupedWork[ev.fecha].push(ev);
    });

    const sortedWorkDays = Object.keys(groupedWork).sort();

    if (needsAuth) {
        return (
            <div className="min-h-screen bg-background text-foreground p-6 font-sans">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
                    <p className="text-muted-foreground text-sm mt-1">Conecta con Google para ver tu resumen diario.</p>
                </header>
                <Card className="max-w-md bg-card border-border border-dashed">
                    <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                            <Calendar className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-1">Re-conecta tu cuenta</h3>
                            <p className="text-sm text-muted-foreground">
                                Hemos añadido nuevas funciones para que veas tu bandeja de entrada y perfil. Por favor, vuelve a autenticarte con Google.
                            </p>
                        </div>
                        <a href="/api/google/auth">
                            <Button className="gap-2 bg-foreground hover:bg-foreground/90 text-background">
                                <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                Conectar con Google
                            </Button>
                        </a>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-6 font-sans selection:bg-primary/30">
            {/* Header Area */}
            <div className="flex items-end justify-between mb-10 pb-6 border-b border-white/[0.05]">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
                        {loadingProfile ? "Cargando..." : `Hola, ${userName}`}
                        {!loadingProfile && <Disc3 className="h-5 w-5 text-[#4684A0] animate-spin-slow" />}
                    </h1>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium">
                        {today.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="h-10 text-xs border-white/10 bg-white/[0.02]">Nueva Cita</Button>
                    <Button className="h-10 text-xs bg-[#4684A0] hover:bg-[#4684A0]/90">Crear Evento</Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* LEFT COLUMN: Personal Agenda & Inbox */}
                <div className="col-span-12 lg:col-span-5 space-y-8">

                    {/* Widget: Personal Agenda (Meetings, Calls) */}
                    <Card className="bg-card/50 border-white/[0.05] shadow-2xl backdrop-blur-sm">
                        <CardHeader className="py-4 px-6 flex flex-row items-center justify-between border-b border-white/[0.05]">
                            <CardTitle className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-[#4684A0]" /> Agenda Personal
                            </CardTitle>
                            <Badge variant="outline" className="text-[10px] bg-white/[0.02] border-white/10 font-mono">
                                {personalTasks.length} TAREAS
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingEvents ? (
                                <div className="p-6 space-y-3">
                                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/[0.02] rounded-lg animate-pulse" />)}
                                </div>
                            ) : personalTasks.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground/50 italic text-sm">No tienes citas o llamadas pendientes</div>
                            ) : (
                                <div className="divide-y divide-white/[0.03]">
                                    {personalTasks.map(task => (
                                        <div key={task.id} className="p-4 px-6 hover:bg-white/[0.02] transition-all group cursor-pointer">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-mono text-muted-foreground/60">{task.fecha}</span>
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
                            )}
                        </CardContent>
                    </Card>

                    {/* Widget: Inbox Refined */}
                    <Card className="bg-card/50 border-white/[0.05] shadow-2xl backdrop-blur-sm">
                        <CardHeader className="py-4 px-6 flex flex-row items-center justify-between border-b border-white/[0.05]">
                            <CardTitle className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-[#4684A0]" /> Tu Inbox
                            </CardTitle>
                            <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-white/5 rounded-full">
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingEmails ? (
                                <div className="p-6 space-y-4">
                                    {[1, 2, 3].map(i => <div key={i} className="h-10 bg-white/[0.02] rounded-lg animate-pulse" />)}
                                </div>
                            ) : emails.length === 0 ? (
                                <p className="p-12 text-center text-sm text-muted-foreground font-medium italic">Sin correos nuevos</p>
                            ) : (
                                <div className="divide-y divide-white/[0.03]">
                                    {emails.slice(0, 5).map(email => (
                                        <div key={email.id} className="p-4 px-6 hover:bg-white/[0.02] transition-colors cursor-default">
                                            <div className="flex gap-4">
                                                <div className="h-10 w-10 shrink-0 rounded-full bg-[#4684A0]/10 flex items-center justify-center font-bold text-[#4684A0]">
                                                    {email.from_name[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-sm font-semibold truncate">{email.from_name}</span>
                                                        <span className="text-[10px] text-muted-foreground/40">{formatEmailDate(email.date)}</span>
                                                    </div>
                                                    <p className="text-xs font-medium text-foreground/80 truncate mb-1">{email.subject}</p>
                                                    <p className="text-[11px] text-muted-foreground/60 truncate leading-relaxed">{email.snippet}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Next Event & Work Schedule */}
                <div className="col-span-12 lg:col-span-7 space-y-8">

                    {/* Widget: Your Next Major Event */}
                    <Card className="bg-gradient-to-br from-[#4684A0]/20 to-transparent border-[#4684A0]/20 shadow-[0_0_50px_-12px_rgba(70,132,160,0.2)]">
                        <CardHeader className="py-3 px-6 border-b border-white/[0.05] flex flex-row items-center justify-between">
                            <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[#4684A0] flex items-center gap-2">
                                <Disc3 className="h-4 w-4 animate-spin-slow text-[#4684A0]" /> Tu Próximo Evento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {loadingEvents ? (
                                <div className="h-48 bg-white/[0.02] rounded-xl animate-pulse" />
                            ) : !nextUserEvent ? (
                                <div className="py-12 text-center flex flex-col items-center gap-4">
                                    <Smile className="h-12 w-12 text-muted-foreground/20" />
                                    <p className="text-sm text-muted-foreground text-center">No estás asignado a eventos esta semana.<br /><span className="text-[10px] font-mono mt-1 block">DISFRUTA DEL DESCANSO</span></p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge className="bg-[#4684A0] text-white hover:bg-[#4684A0] border-none text-[9px] px-2 py-0">PRÓXIMO</Badge>
                                            <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest">
                                                {new Date(nextUserEvent.fecha).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black tracking-tight mb-3 leading-tight text-white uppercase">{nextUserEvent.titulo}</h3>
                                        <div className="flex flex-wrap items-center gap-4 mt-4">
                                            <div className="flex items-center gap-2 text-base font-bold text-[#4684A0]">
                                                <MapPin className="h-4 w-4" /> {nextUserEvent.ubicacion || "A confirmar"}
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium border-l border-white/10 pl-4 h-5">
                                                <Clock className="h-3.5 w-3.5" /> {nextUserEvent.hora_inicio || "Todo el día"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 border-t border-white/[0.05] pt-6">
                                        <div className="space-y-2">
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground/40 tracking-[0.2em]">Configuración</p>
                                            <div className="flex flex-wrap gap-2">
                                                {nextUserEvent.packs_detectados?.map(p => (
                                                    <Badge key={p} className={`${PACK_CONFIG[p as PackType]?.bg} ${PACK_CONFIG[p as PackType]?.text} border ${PACK_CONFIG[p as PackType]?.border} text-[9px] font-bold px-2`}>
                                                        {p}
                                                    </Badge>
                                                ))}
                                                {tieneExtras(nextUserEvent.descripcion) && (
                                                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px] font-bold px-2">+ EXTRAS</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground/40 tracking-[0.2em]">Equipo DJ</p>
                                            <div className="flex flex-wrap gap-2">
                                                {nextUserEvent.djs_detectados?.map(dj => (
                                                    <Badge key={dj} className={`${DJ_CONFIG[dj as DJName]?.bg} ${DJ_CONFIG[dj as DJName]?.color} border ${DJ_CONFIG[dj as DJName]?.border} text-[9px] font-bold px-2`}>
                                                        {dj}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => setSelectedEvent(nextUserEvent)}
                                        className="w-full h-10 bg-white text-black hover:bg-white/90 font-bold uppercase tracking-widest text-[10px] rounded-xl shadow-[0_10px_30px_-10px_rgba(255,255,255,0.2)]"
                                    >
                                        Ver Detalles Completos
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Widget: Work Schedule for the Week */}
                    <Card className="bg-card/30 border-white/[0.05]">
                        <CardHeader className="border-b border-white/[0.05] py-4 bg-white/[0.01]">
                            <CardTitle className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" /> Eventos de Trabajo (Esta Semana)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {loadingEvents ? (
                                <div className="space-y-4">
                                    {[1, 2].map(i => <div key={i} className="h-14 bg-white/[0.02] rounded-lg animate-pulse" />)}
                                </div>
                            ) : sortedWorkDays.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground font-medium italic text-sm">Semana de trabajo despejada</div>
                            ) : (
                                <div className="space-y-8">
                                    {sortedWorkDays.map(dayStr => {
                                        const d = new Date(dayStr);
                                        const isToday = dayStr === todayISO;
                                        return (
                                            <div key={dayStr} className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-[#4684A0]' : 'text-muted-foreground/40'}`}>
                                                        {d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" })}
                                                    </span>
                                                    <div className="h-px flex-1 bg-white/[0.05]" />
                                                    {isToday && <Badge className="bg-[#4684A0]/10 text-[#4684A0] border-[#4684A0]/20 text-[9px] h-4">HOY</Badge>}
                                                </div>
                                                <div className="grid gap-3">
                                                    {groupedWork[dayStr].map(ev => (
                                                        <div key={ev.id} className="flex items-center justify-between group p-3 px-4 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] transition-all">
                                                            <div className="flex items-center gap-5 min-w-0">
                                                                <span className="text-[10px] font-mono text-muted-foreground/30 w-12">{ev.hora_inicio || "--:--"}</span>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-foreground/90 truncate">{ev.titulo}</span>
                                                                    <span className="text-[10px] text-muted-foreground/40 uppercase tracking-tighter">{ev.ubicacion || 'Sin Ubicación'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex -space-x-2">
                                                                {ev.djs_detectados?.map(dj => (
                                                                    <div key={dj} className={`w-3 h-3 rounded-full border border-black ${DJ_CONFIG[dj as DJName]?.dot}`} title={dj} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <EventoDetail
                    evento={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                />
            )}
        </div>
    );
}
