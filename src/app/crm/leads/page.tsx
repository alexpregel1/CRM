"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Plus, Search, Phone, Mail, Calendar, Clock, CheckCircle2, XCircle,
    Send, ChevronRight, Link, ChevronDown, BadgeCheck, TrendingUp, BarChart3, Users
} from "lucide-react";

import { DJ_CONFIG, DJ_NAMES, DJName } from "@/lib/djs";

type LeadStatus = "nuevo" | "contactado" | "presupuesto_enviado" | "confirmado" | "perdido";

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; border: string; dotColor: string; icon: React.ReactNode }> = {
    nuevo: { label: "NUEVO", color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", dotColor: "bg-slate-400", icon: <Clock className="h-4 w-4" /> },
    contactado: { label: "CONTACTADO", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", dotColor: "bg-yellow-400", icon: <Phone className="h-4 w-4" /> },
    presupuesto_enviado: { label: "PRESUPUESTO ENVIADO", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", dotColor: "bg-blue-400", icon: <Send className="h-4 w-4" /> },
    confirmado: { label: "CONFIRMADO", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dotColor: "bg-emerald-400", icon: <CheckCircle2 className="h-4 w-4" /> },
    perdido: { label: "PERDIDO", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", dotColor: "bg-red-400", icon: <XCircle className="h-4 w-4" /> },
};

type Lead = {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    tipo_evento: string;
    fecha_evento: string;
    ubicacion: string;
    pack_seleccionado: string;
    equipo_extra: string;
    presupuesto_estimado: number;
    status: LeadStatus;
    fecha_ultimo_contacto: string;
    created_at: string;
    notas: string;
    dj_asignado?: DJName | "";
};

const MOCK_LEADS: Lead[] = [
    { id: "1",  nombre: "Rocío Fernández Vega",      email: "rocio.fvega@gmail.com",       telefono: "+34 612 441 870", tipo_evento: "Boda",              fecha_evento: "2026-06-13", ubicacion: "Finca Villa Luz, Alcalá de Henares",        pack_seleccionado: "Pack Premium",  equipo_extra: "Máquina de humo vertical + 2x Par LED", presupuesto_estimado: 1350, status: "nuevo",               fecha_ultimo_contacto: "",            created_at: "2026-03-12", notas: "Ceremonia civil al atardecer. Quieren que empiece suave y acabe con mucho ambiente. Piden humo espeso para el primer baile.", dj_asignado: "Felipe" },
    { id: "2",  nombre: "Grupo Eurostars Hotels",    email: "eventos@eurostarshotels.es", telefono: "+34 915 210 800", tipo_evento: "Evento Corporativo", fecha_evento: "2026-04-25", ubicacion: "Hotel Eurostars Madrid Tower",               pack_seleccionado: "Pack Básico",   equipo_extra: "", presupuesto_estimado: 720, status: "contactado",          fecha_ultimo_contacto: "2026-03-11", created_at: "2026-03-08", notas: "Cena de empresa para 150 personas. Solo música ambiental y animación al final de la noche.", dj_asignado: "Diego" },
    { id: "3",  nombre: "Alejandro Morales Ruiz",    email: "alex.morales@hotmail.com",   telefono: "+34 677 320 541", tipo_evento: "Cumpleaños",         fecha_evento: "2026-05-10", ubicacion: "Ático privado, Las Tablas (Madrid)",        pack_seleccionado: "MiniPack",      equipo_extra: "Máquina de humo vertical", presupuesto_estimado: 380, status: "presupuesto_enviado", fecha_ultimo_contacto: "2026-03-06", created_at: "2026-03-04", notas: "30 años. Fiesta íntima en ático. Unos 40 invitados. Prefiere música electrónica y house.", dj_asignado: "Peche" },
    { id: "4",  nombre: "Carmen y David Iglesias",   email: "carmen.iglesias@outlook.es", telefono: "+34 633 781 902", tipo_evento: "Boda",              fecha_evento: "2026-07-18", ubicacion: "Finca El Encín, Alcalá de Henares",         pack_seleccionado: "Pack Premium",  equipo_extra: "Truss 4m + Sonido ceremonia exterior", presupuesto_estimado: 1750, status: "confirmado",          fecha_ultimo_contacto: "2026-03-01", created_at: "2026-02-18", notas: "Confirmado. Señal recibida el 28 feb. Boda de 200 pax. Necesitan cobertura también en la ceremonia exterior.", dj_asignado: "Felipe" },
    { id: "5",  nombre: "Lola Castillo Reyes",       email: "lola.c@gmail.com",           telefono: "+34 699 054 317", tipo_evento: "Cumpleaños",         fecha_evento: "2026-04-05", ubicacion: "Getafe",                                    pack_seleccionado: "Pack Básico",   equipo_extra: "", presupuesto_estimado: 410, status: "perdido",             fecha_ultimo_contacto: "2026-03-02", created_at: "2026-02-22", notas: "Eligió otro proveedor. Fue por precio.", dj_asignado: "Diego" },
    { id: "6",  nombre: "Diageo España",             email: "eventos.madrid@diageo.com",  telefono: "+34 914 238 100", tipo_evento: "Evento Privado",     fecha_evento: "2026-05-23", ubicacion: "Palacio de Cibeles, Madrid",                pack_seleccionado: "Pack Premium",  equipo_extra: "2x Cabeza móvil Varytech + DJ booth", presupuesto_estimado: 1800, status: "contactado",          fecha_ultimo_contacto: "2026-03-10", created_at: "2026-03-09", notas: "Lanzamiento de producto. Quieren ambiente muy selecto. Nada comercial.", dj_asignado: "Ichi" },
    { id: "7",  nombre: "Sofía y Marco Ballesteros", email: "sofia.ballesteros@gmail.com", telefono: "+34 611 230 948", tipo_evento: "Boda",             fecha_evento: "2026-09-19", ubicacion: "Hacienda Queijal, El Escorial",             pack_seleccionado: "Personalizado", equipo_extra: "Sonido + luces ceremonia + cena completa", presupuesto_estimado: 2100, status: "confirmado",          fecha_ultimo_contacto: "2026-02-20", created_at: "2026-02-08", notas: "Boda grande, 250 pax. Quieren a Diego para el baile. Ya reservado para el día completo.", dj_asignado: "Diego" },
    { id: "8",  nombre: "Ayuntamiento de Leganés",   email: "cultura@leganes.org",        telefono: "+34 916 942 300", tipo_evento: "Evento Corporativo", fecha_evento: "2026-06-21", ubicacion: "Parque de las Comunidades, Leganés",        pack_seleccionado: "Pack Básico",   equipo_extra: "Sonido outdoor + pantalla LED 3x2m", presupuesto_estimado: 850, status: "presupuesto_enviado", fecha_ultimo_contacto: "2026-03-07", created_at: "2026-03-05", notas: "Fiesta de verano municipal. Evento público al aire libre. Aforo estimado 600 personas.", dj_asignado: "Raiboc" },
    { id: "9",  nombre: "Isabel Herrera Montoya",    email: "isabel.h@yahoo.es",          telefono: "+34 625 739 416", tipo_evento: "Graduación",         fecha_evento: "2026-06-27", ubicacion: "Teatro Circo Price, Madrid",                pack_seleccionado: "Pack Básico",   equipo_extra: "", presupuesto_estimado: 540, status: "nuevo",               fecha_ultimo_contacto: "",            created_at: "2026-03-13", notas: "Graduación de medicina UAM. 100 personas aprox. Quieren una noche con barra libre y mucho baile.", dj_asignado: "" },
    { id: "10", nombre: "Eleven Madison Events",     email: "booking@elevenmadison.es",   telefono: "+34 917 815 500", tipo_evento: "Evento Privado",     fecha_evento: "2026-08-02", ubicacion: "Villa privada, La Moraleja",                pack_seleccionado: "Personalizado", equipo_extra: "Line array Maga Engineering + DJ booth premium + Beams Varytech", presupuesto_estimado: 3800, status: "contactado",          fecha_ultimo_contacto: "2026-03-09", created_at: "2026-03-08", notas: "Cliente VIP. Fiesta privada internacional en villa de lujo. Piden rider técnico completo.", dj_asignado: "Juan Cavero" },
    { id: "11", nombre: "Real Club de Golf La Herrería", email: "eventos@golfherreria.com", telefono: "+34 918 905 111", tipo_evento: "Evento Corporativo", fecha_evento: "2026-07-04", ubicacion: "Real Club de Golf La Herrería, El Escorial", pack_seleccionado: "Pack Premium",  equipo_extra: "Sonido exterior + Stairville PAR", presupuesto_estimado: 980, status: "presupuesto_enviado", fecha_ultimo_contacto: "2026-03-04", created_at: "2026-03-01", notas: "Gala de premios anual del club. Requiere equipo para exterior con posible viento.", dj_asignado: "Luis" },
    { id: "12", nombre: "Valentina Ríos Soria",      email: "valen.rios@gmail.com",       telefono: "+34 688 124 507", tipo_evento: "Cumpleaños",         fecha_evento: "2026-04-12", ubicacion: "Pozuelo de Alarcón",                       pack_seleccionado: "MiniPack",      equipo_extra: "", presupuesto_estimado: 340, status: "perdido",             fecha_ultimo_contacto: "2026-02-28", created_at: "2026-02-25", notas: "Lo organizó al final en casa con Spotify. Sin presupuesto real.", dj_asignado: "" },
];

const TIPOS_EVENTO = ["Boda", "Evento Corporativo", "Cumpleaños", "Evento Privado", "Graduación", "Otro"];
const PACKS = ["MiniPack", "Pack Básico", "Pack Premium", "Personalizado"];

type ColumnFilters = {
    status: Set<LeadStatus>;
    tipo_evento: Set<string>;
};

type SortConfig = {
    key: keyof Lead | null;
    direction: "asc" | "desc" | null;
};

// ─── Utils ───────────────────────────────────────────────────────────────────
function tiempoRelativo(fecha: string): string {
    if (!fecha) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(fecha);
    date.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - date.getTime();
    if (diffMs < 0) return "";

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "hoy";
    if (diffDays === 1) return "ayer";
    return `hace ${diffDays}d`;
}

// ─── ColumnFilterPopover ──────────────────────────────────────────────────────
function ColumnFilterPopover<T extends string>({
    title,
    options,
    selected,
    onToggle,
    onClear,
}: {
    title: string;
    options: { value: T; label: string; dotColor?: string }[];
    selected: Set<T>;
    onToggle: (value: T) => void;
    onClear: () => void;
}) {
    const isActive = selected.size > 0;
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    onClick={e => e.stopPropagation()}
                    className={`inline-flex items-center gap-1.5 hover:text-foreground transition-colors ${isActive ? "text-foreground" : ""}`}
                >
                    {title}
                    <ChevronDown className={`h-3 w-3 transition-colors ${isActive ? "text-foreground" : "text-muted-foreground/50"}`} />
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-48 p-2 bg-card border-border shadow-xl z-50"
                align="start"
                onClick={e => e.stopPropagation()}
            >
                <div className="space-y-0.5">
                    {options.map(opt => (
                        <label
                            key={opt.value}
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-secondary cursor-pointer text-xs"
                        >
                            <Checkbox
                                checked={selected.has(opt.value)}
                                onCheckedChange={() => onToggle(opt.value)}
                                className="h-3.5 w-3.5 border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                            />
                            {opt.dotColor && (
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${opt.dotColor}`} />
                            )}
                            <span className="text-foreground/80">{opt.label}</span>
                        </label>
                    ))}
                </div>
                {isActive && (
                    <button
                        onClick={onClear}
                        className="w-full mt-1.5 pt-1.5 border-t border-border text-[10px] text-muted-foreground hover:text-foreground text-center transition-colors"
                    >
                        Limpiar filtro
                    </button>
                )}
            </PopoverContent>
        </Popover>
    );
}

// ─── New Lead Dialog ───────────────────────────────────────────────────────────
function NewLeadDialog({ onAdd }: { onAdd: (lead: Lead) => void }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        nombre: "", email: "", telefono: "", tipo_evento: "", fecha_evento: "",
        ubicacion: "", pack_seleccionado: "", equipo_extra: "", presupuesto_estimado: "",
        notas: "", dj_asignado: "" as DJName | "",
        fecha_ultimo_contacto: ""
    });

    const handleSubmit = () => {
        if (!form.nombre || !form.email) return;
        const newLead: Lead = {
            id: Date.now().toString(),
            ...form,
            presupuesto_estimado: parseFloat(form.presupuesto_estimado) || 0,
            status: "nuevo",
            created_at: new Date().toISOString().split("T")[0],
        };
        onAdd(newLead);
        setOpen(false);
        setForm({ nombre: "", email: "", telefono: "", tipo_evento: "", fecha_evento: "", ubicacion: "", pack_seleccionado: "", equipo_extra: "", presupuesto_estimado: "", notas: "", dj_asignado: "", fecha_ultimo_contacto: "" });
    };

    const f = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button
                onClick={() => setOpen(true)}
                size="sm"
                className="gap-1.5 bg-[#4684A0] hover:bg-[#3a7290] text-white border-none"
            >
                <Plus className="h-4 w-4" /> Nuevo Lead
            </Button>
            <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nuevo Lead / Solicitud</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">Nombre *</Label>
                        <Input placeholder="Nombre completo" value={form.nombre} onChange={e => f("nombre")(e.target.value)} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Email *</Label>
                        <Input placeholder="email@ejemplo.com" value={form.email} onChange={e => f("email")(e.target.value)} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Teléfono</Label>
                        <Input placeholder="+34 600 000 000" value={form.telefono} onChange={e => f("telefono")(e.target.value)} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Tipo de Evento</Label>
                        <Select onValueChange={f("tipo_evento")}>
                            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                {TIPOS_EVENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Fecha del evento</Label>
                        <Input type="date" value={form.fecha_evento} onChange={e => f("fecha_evento")(e.target.value)} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Ubicación</Label>
                        <Input placeholder="Ciudad / Venue" value={form.ubicacion} onChange={e => f("ubicacion")(e.target.value)} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Pack seleccionado</Label>
                        <Select onValueChange={f("pack_seleccionado")}>
                            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                {PACKS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">DJ asignado</Label>
                        <Select value={form.dj_asignado} onValueChange={v => setForm(p => ({ ...p, dj_asignado: v as DJName | "" }))}>
                            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                <SelectItem value="">Sin asignar</SelectItem>
                                {DJ_NAMES.map(dj => <SelectItem key={dj} value={dj}>{dj}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Último contacto</Label>
                        <Input type="date" value={form.fecha_ultimo_contacto} onChange={e => f("fecha_ultimo_contacto")(e.target.value)} className="bg-secondary border-border" />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Presupuesto estimado (€)</Label>
                        <Input type="number" placeholder="0" value={form.presupuesto_estimado} onChange={e => f("presupuesto_estimado")(e.target.value)} className="bg-secondary border-border" />
                    </div>

                    <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">Equipo extra / notas del pedido</Label>
                        <Input placeholder="Ej: 2x Par LED, máquina de humo..." value={form.equipo_extra} onChange={e => f("equipo_extra")(e.target.value)} className="bg-secondary border-border" />
                    </div>
                    <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">Notas internas</Label>
                        <Input placeholder="Notas..." value={form.notas} onChange={e => f("notas")(e.target.value)} className="bg-secondary border-border" />
                    </div>
                </div>
                <Button onClick={handleSubmit} className="w-full mt-2 bg-[#4684A0] hover:bg-[#3a7290] text-white">
                    Crear Lead
                </Button>
            </DialogContent>
        </Dialog>
    );
}

// ─── Lead Detail Drawer ────────────────────────────────────────────────────────
function LeadDetail({
    lead,
    onClose,
    onStatusChange,
    onDJChange,
}: {
    lead: Lead;
    onClose: () => void;
    onStatusChange: (id: string, status: LeadStatus) => void;
    onDJChange: (id: string, dj: DJName | "") => void;
}) {
    const cfg = STATUS_CONFIG[lead.status];

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="w-96 h-full bg-[#020617] border-l border-white/10 p-6 overflow-y-auto flex flex-col gap-6 shadow-2xl animate-in slide-in-from-right">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#4684A0]/20 border border-[#4684A0]/30 flex items-center justify-center text-lg font-bold text-[#4684A0]">
                            {lead.nombre.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">
                                {lead.nombre}
                            </h2>
                            <p className="text-xs text-muted-foreground">{lead.tipo_evento}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-white text-lg">&times;</button>
                </div>

                {/* Body - Selectors */}
                <div className="flex flex-col gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Estado de Lead</Label>
                        <Select value={lead.status} onValueChange={(v) => onStatusChange(lead.id, v as LeadStatus)}>
                            <SelectTrigger className={`h-10 bg-white/5 border-white/10 text-sm font-medium rounded-lg ${cfg.color}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                    <SelectItem key={k} value={k} className="text-xs font-medium uppercase">
                                        {v.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">DJ Asignado</Label>
                        <Select value={lead.dj_asignado || ""} onValueChange={v => onDJChange(lead.id, v as DJName | "")}>
                            <SelectTrigger className={`h-10 bg-white/5 border-white/10 text-sm font-medium rounded-lg ${lead.dj_asignado ? DJ_CONFIG[lead.dj_asignado as DJName].color : "text-muted-foreground/30"}`}>
                                <SelectValue placeholder="SIN ASIGNAR" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10">
                                <SelectItem value="" className="text-xs font-medium uppercase text-muted-foreground/40 italic">SIN ASIGNAR</SelectItem>
                                {DJ_NAMES.map(dj => (
                                    <SelectItem key={dj} value={dj} className="text-xs font-medium uppercase">
                                        {dj}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-8 mt-4">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 gap-6">
                        {[
                            { label: "Canal de Contacto", value: lead.email.toLowerCase(), icon: <Mail className="h-3.5 w-3.5" />, color: "text-sky-400" },
                            { label: "Teléfono Directo", value: lead.telefono, icon: <Phone className="h-3.5 w-3.5" />, color: "text-emerald-400" },
                            { label: "Servicios Requeridos", value: `${lead.tipo_evento} - ${lead.pack_seleccionado}`, icon: <Users className="h-3.5 w-3.5" />, color: "text-purple-400" },
                            { label: "Cronología Evento", value: lead.fecha_evento, icon: <Calendar className="h-3.5 w-3.5" />, color: "text-amber-400" },
                            { label: "Localización", value: lead.ubicacion, icon: <Link className="h-3.5 w-3.5" />, color: "text-blue-400" },
                        ].map(({ label, value, icon, color }) => (
                            <div key={label} className="group flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</span>
                                <div className="flex items-center gap-2 text-sm font-medium text-white/90">
                                    <div className={`p-1.5 rounded-lg bg-white/5 ${color}/10 border border-white/5`}>
                                        {icon}
                                    </div>
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Budget Card */}
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 shadow-sm text-center">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2">Valoración Estimada</p>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-sm font-bold text-sky-400">€</span>
                            <span className="text-3xl font-bold tracking-tight text-white line-clamp-1">
                                {lead.presupuesto_estimado.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Internal Notes */}
                    {lead.notas && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Notas Internas</span>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 italic text-sm text-muted-foreground/60 leading-relaxed">
                                "{lead.notas}"
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-6 border-t border-white/5">
                    <Button
                        onClick={() => window.open(`mailto:${lead.email}`)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-white/10 hover:bg-white/5 gap-1.5"
                    >
                        <Mail className="h-3.5 w-3.5" /> Email
                    </Button>
                    <Button
                        onClick={() => window.open(`tel:${lead.telefono}`)}
                        size="sm"
                        className="flex-1 bg-[#4684A0] hover:bg-[#3a7290] text-white border-none gap-1.5"
                    >
                        <Phone className="h-3.5 w-3.5" /> Llamar
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Lead | null>(null);
    const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
        status: new Set(),
        tipo_evento: new Set(),
    });


    // ─── Filter logic ─────────────────────────────────────────────────────────
    const toggleFilter = <K extends keyof ColumnFilters>(
        column: K,
        value: ColumnFilters[K] extends Set<infer T> ? T : never
    ) => {
        setColumnFilters(prev => {
            const next = new Set(prev[column]) as ColumnFilters[K];
            if ((next as Set<unknown>).has(value)) {
                (next as Set<unknown>).delete(value);
            } else {
                (next as Set<unknown>).add(value);
            }
            return { ...prev, [column]: next };
        });
    };

    const clearFilter = (column: keyof ColumnFilters) => {
        setColumnFilters(prev => ({ ...prev, [column]: new Set() }));
    };

    const hasActiveFilters = Object.values(columnFilters).some(s => s.size > 0);

    // ─── Filtered and Sorted leads ──────────────────────────────────────────────
    const filtered = leads.filter(l => {
        const matchesSearch =
            l.nombre.toLowerCase().includes(search.toLowerCase()) ||
            l.email.toLowerCase().includes(search.toLowerCase()) ||
            l.tipo_evento.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = columnFilters.status.size === 0 || columnFilters.status.has(l.status);
        const matchesTipo = columnFilters.tipo_evento.size === 0 || columnFilters.tipo_evento.has(l.tipo_evento);
        return matchesSearch && matchesStatus && matchesTipo;
    });



    // ─── Handlers ──────────────────────────────────────────────────────────────
    const handleAdd = (lead: Lead) => setLeads(p => [lead, ...p]);

    const handleStatusChange = (id: string, status: LeadStatus) => {
        setLeads(p => p.map(l => l.id === id ? { ...l, status } : l));
        setSelected(prev => prev?.id === id ? { ...prev, status } : prev);
    };



    const handleDJChange = (id: string, dj: DJName | "") => {
        const value = dj;
        setLeads(p => p.map(l => l.id === id ? { ...l, dj_asignado: value } : l));
        setSelected(prev => prev?.id === id ? { ...prev, dj_asignado: value } : prev);
    };





    // ─── KPIs ──────────────────────────────────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const conversionRate = leads.length > 0 ? Math.round((leads.filter(l => l.status === "confirmado").length / leads.length) * 100) : 0;

    const pipelineValue = leads
        .filter(l => l.status !== "perdido" && l.status !== "confirmado")
        .reduce((sum, l) => sum + l.presupuesto_estimado, 0);

    const activeLeadsCount = leads.filter(l => l.status !== "perdido" && l.status !== "confirmado").length;



    return (
        <div className="min-h-screen bg-background text-foreground p-6 font-sans selection:bg-primary/30">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leads & Pipeline</h1>
                    <p className="text-muted-foreground text-sm mt-1">Pipeline de solicitudes · GilcaSound Events</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    {/* Status Toggle Premium style */}
                    <div className="relative flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.05] w-[420px] h-10 shadow-2xl backdrop-blur-md">
                        {/* Sliding selector */}
                        <div
                            className="absolute top-1 bottom-1 left-1 rounded-lg bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                            style={{
                                width: "calc(25% - 2px)",
                                transform: `translateX(${columnFilters.status.size === 0 ? "0%" : columnFilters.status.has("nuevo") ? "100.5%" : columnFilters.status.has("contactado") ? "201%" : "301.5%"})`
                            }}
                        />
                        {[
                            { id: "all", label: "TODOS" },
                            { id: "nuevo", label: "NUEVOS" },
                            { id: "contactado", label: "CONTACTO" },
                            { id: "confirmado", label: "GANADOS" }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => {
                                    if (f.id === "all") clearFilter("status");
                                    else {
                                        clearFilter("status");
                                        toggleFilter("status", f.id as any);
                                    }
                                }}
                                className={`relative z-10 flex-1 h-full text-[10px] font-bold tracking-wider transition-colors duration-300 ${(f.id === "all" && columnFilters.status.size === 0) || (f.id !== "all" && columnFilters.status.has(f.id as any))
                                    ? "text-white"
                                    : "text-muted-foreground/40 hover:text-white/60"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <NewLeadDialog onAdd={handleAdd} />
                </div>
            </header>

            {/* KPI Row - Redesigned with Glassmorphism */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    {
                        label: "Pipeline Value",
                        value: `€${pipelineValue.toLocaleString()}`,
                        sub: `${activeLeadsCount} leads activos`,
                        color: "text-sky-400"
                    },
                    {
                        label: "Total Leads",
                        value: leads.length,
                        sub: `${leads.filter(l => l.status === "nuevo").length} por calificar`,
                        color: "text-foreground"
                    },
                    {
                        label: "Leads Fríos",
                        value: leads.filter(l => {
                            const date = new Date(l.fecha_ultimo_contacto || l.created_at);
                            const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                            return diffDays > 7 && l.status !== "perdido" && l.status !== "confirmado";
                        }).length,
                        sub: "Sin contacto > 7d",
                        color: "text-amber-400"
                    },
                    {
                        label: "Win Rate",
                        value: `${conversionRate}%`,
                        sub: "leads → ganados",
                        color: "text-purple-400"
                    },
                ].map(kpi => (
                    <Card key={kpi.label} className="bg-card/40 backdrop-blur-sm border-white/5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground tracking-wider uppercase">{kpi.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                            <th className="text-left select-none text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-3">
                                Lead / Contacto
                            </th>
                            <th className="text-left select-none text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-3">
                                <ColumnFilterPopover
                                    title="TIPO EVENTO"
                                    options={TIPOS_EVENTO.map(t => ({ value: t, label: t }))}
                                    selected={columnFilters.tipo_evento}
                                    onToggle={v => toggleFilter("tipo_evento", v)}
                                    onClear={() => clearFilter("tipo_evento")}
                                />
                            </th>
                            <th className="text-left select-none text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-3">
                                Ubicación / Venue
                            </th>
                            <th className="text-left select-none text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-3 text-center">
                                Fecha Evento
                            </th>
                            <th className="text-left select-none text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-3">
                                Último Contacto
                            </th>
                            <th className="text-left select-none text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-4 py-3">
                                <ColumnFilterPopover
                                    title="ESTADO PIPELINE"
                                    options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({
                                        value: k as LeadStatus,
                                        label: v.label,
                                        dotColor: v.dotColor,
                                    }))}
                                    selected={columnFilters.status}
                                    onToggle={v => toggleFilter("status", v)}
                                    onClear={() => clearFilter("status")}
                                />
                            </th>
                            <th className="px-4 py-3 w-12"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                    No se encontraron leads
                                </td>
                            </tr>
                        ) : (
                            filtered.map((lead, i) => {
                                const cfg = STATUS_CONFIG[lead.status];

                                const notasText = lead.notas || "";
                                const shortNotas = notasText.length > 45 ? notasText.substring(0, 45) + "..." : notasText;

                                const tiempoObj = tiempoRelativo(lead.fecha_ultimo_contacto);

                                return (
                                    <tr
                                        key={lead.id}
                                        onClick={() => setSelected(lead)}
                                        className={`
                                            group border-b border-white/[0.03] last:border-b-0 cursor-pointer
                                            hover:bg-white/[0.03] transition-all duration-300
                                            ${i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"}
                                        `}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <p className="text-sm font-medium flex items-center gap-1.5">
                                                    {lead.nombre}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-xs text-muted-foreground">
                                                        {lead.email.toLowerCase()}
                                                    </p>
                                                </div>
                                                {shortNotas && (
                                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mt-1 border-l border-white/10 pl-2">
                                                        {shortNotas}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        {/* Evento */}
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-muted-foreground">
                                                {lead.tipo_evento}
                                            </span>
                                        </td>
                                        {/* Ubicación */}
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-muted-foreground">
                                                {lead.ubicacion}
                                            </span>
                                        </td>
                                        {/* Fecha */}
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-[10px] font-medium text-muted-foreground/80 tabular-nums">
                                                {new Date(lead.fecha_evento).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
                                            </span>
                                        </td>
                                        {/* Último Contacto */}
                                        <td className="px-4 py-3">
                                            {tiempoObj ? (
                                                <span className="text-[10px] font-bold text-sky-400/80 uppercase tracking-tight">
                                                    {tiempoObj}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-bold text-muted-foreground/20 tracking-widest uppercase">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        {/* Estado */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-start gap-2">
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.border} ${cfg.color} uppercase tracking-wider shadow-sm`}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Table Footer */}
            <div className="flex items-center justify-between mt-6 px-2">
                <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                        Mostrando {filtered.length} de {leads.length} leads en sistema
                    </p>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={() => setColumnFilters({ status: new Set(), tipo_evento: new Set() })}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-[9px] font-bold text-red-400 uppercase tracking-widest hover:bg-red-500/20 hover:border-red-500/40 transition-all"
                    >
                        <XCircle className="h-3 w-3" /> Limpiar filtros
                    </button>
                )}
            </div>

            {/* Detail Drawer */}
            {selected && (
                <LeadDetail
                    lead={selected}
                    onClose={() => setSelected(null)}
                    onStatusChange={handleStatusChange}

                    onDJChange={handleDJChange}
                />
            )}
        </div>
    );
}
