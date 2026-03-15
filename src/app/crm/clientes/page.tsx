"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Phone, Mail, Calendar, Euro, Users, Star, Clock } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Cliente = {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    empresa?: string;
    ciudad: string;
    eventos_totales: number;
    gasto_total: number;
    ultimo_evento: string;
    created_at: string;
    notas: string;
};

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_CLIENTES: Cliente[] = [
    { id: "1",  nombre: "Carmen e Iván Ballesteros",     email: "carmen.ballesteros@gmail.com",  telefono: "+34 611 230 948", empresa: "",                           ciudad: "El Escorial",       eventos_totales: 2, gasto_total: 2100,  ultimo_evento: "2025-09-20", created_at: "2025-07-12", notas: "Boda en Hacienda Queijal. Repitieron con nosotros para su aniversario. Muy buenos clientes." },
    { id: "2",  nombre: "Grupo Eurostars Hotels",        email: "eventos@eurostarshotels.es",    telefono: "+34 915 210 800", empresa: "Grupo Eurostars S.L.",       ciudad: "Madrid",            eventos_totales: 4, gasto_total: 3200,  ultimo_evento: "2026-04-25", created_at: "2024-09-01", notas: "Contrato anual de eventos corporativos. Pagan siempre a 30 días. Contacto: Marta Salas." },
    { id: "3",  nombre: "Diageo España",                 email: "eventos.madrid@diageo.com",     telefono: "+34 914 238 100", empresa: "Diageo España S.A.",         ciudad: "Madrid",            eventos_totales: 3, gasto_total: 5400,  ultimo_evento: "2025-11-15", created_at: "2024-06-20", notas: "Lanzamientos de productos de alta gama. Muy exigentes con la selección musical. Nada comercial." },
    { id: "4",  nombre: "Sofía y Marco Ballesteros",     email: "sofia.ballesteros@gmail.com",   telefono: "+34 633 781 902", empresa: "",                           ciudad: "El Escorial",       eventos_totales: 1, gasto_total: 1750,  ultimo_evento: "2026-07-18", created_at: "2026-02-18", notas: "Boda confirmada julio 2026 en Finca El Encín. Ya abonaron señal." },
    { id: "5",  nombre: "Eleven Madison Events",         email: "booking@elevenmadison.es",      telefono: "+34 917 815 500", empresa: "Eleven Madison Group",      ciudad: "La Moraleja",       eventos_totales: 6, gasto_total: 21000, ultimo_evento: "2025-08-10", created_at: "2023-05-10", notas: "Clientazo. Organiza fiestas privadas internacionales en villas de La Moraleja y Pozuelo. Siempre el pack más alto." },
    { id: "6",  nombre: "Ayuntamiento de Leganés",       email: "cultura@leganes.org",           telefono: "+34 916 942 300", empresa: "Ayuntamiento de Leganés",   ciudad: "Leganés",           eventos_totales: 2, gasto_total: 1700,  ultimo_evento: "2025-06-21", created_at: "2024-03-15", notas: "Fiesta de verano municipal cada año. Pagan por transferencia, a veces con retraso administrativo." },
    { id: "7",  nombre: "Real Club de Golf La Herrería", email: "eventos@golfherreria.com",      telefono: "+34 918 905 111", empresa: "R.C. Golf La Herrería",     ciudad: "El Escorial",       eventos_totales: 3, gasto_total: 2940,  ultimo_evento: "2025-07-04", created_at: "2024-01-22", notas: "Gala de premios anual + eventos privados de socios. Requiere equipo resistente para exterior." },
    { id: "8",  nombre: "Lucía Ramos Organizadora",      email: "lucia.ramos.eventos@gmail.com", telefono: "+34 621 987 654", empresa: "Lucía Ramos Eventos",       ciudad: "Madrid",            eventos_totales: 9, gasto_total: 7200,  ultimo_evento: "2026-02-14", created_at: "2023-11-01", notas: "Organizadora profesional en Madrid. Nos trae 2-3 eventos al año. Descuento acordado del 10%." },
    { id: "9",  nombre: "Alejandro Morales",              email: "alex.morales@hotmail.com",      telefono: "+34 677 320 541", empresa: "",                           ciudad: "Madrid",            eventos_totales: 2, gasto_total: 730,   ultimo_evento: "2026-05-10", created_at: "2025-01-10", notas: "Repitió para su 30 cumpleaños. Siempre con sus amigos en el mismo ático de Las Tablas." },
    { id: "10", nombre: "Rocío Fernández Vega",           email: "rocio.fvega@gmail.com",         telefono: "+34 612 441 870", empresa: "",                           ciudad: "Alcalá de Henares", eventos_totales: 1, gasto_total: 1350,  ultimo_evento: "2026-06-13", created_at: "2026-03-12", notas: "Boda en Finca Villa Luz. Primera vez con nosotros. Referida por Carmen Ballesteros." },
];

// ─── New Client Dialog ─────────────────────────────────────────────────────────
function NewClienteDialog({ onAdd }: { onAdd: (c: Cliente) => void }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ nombre: "", email: "", telefono: "", empresa: "", ciudad: "", notas: "" });

    const handleSubmit = () => {
        if (!form.nombre || !form.email) return;
        const newCliente: Cliente = {
            id: Date.now().toString(),
            ...form,
            eventos_totales: 0,
            gasto_total: 0,
            ultimo_evento: "—",
            created_at: new Date().toISOString().split("T")[0],
        };
        onAdd(newCliente);
        setOpen(false);
        setForm({ nombre: "", email: "", telefono: "", empresa: "", ciudad: "", notas: "" });
    };

    const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 bg-[#4684A0] hover:bg-[#3a7290] text-white border-none">
                    <Plus className="h-4 w-4" /> Nuevo Cliente
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#020617] border-white/10 text-foreground max-w-md">
                <DialogHeader>
                    <DialogTitle>Añadir Cliente</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">Nombre *</Label>
                        <Input placeholder="Nombre completo" value={form.nombre} onChange={f("nombre")} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Email *</Label>
                        <Input placeholder="email@ejemplo.com" value={form.email} onChange={f("email")} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Teléfono</Label>
                        <Input placeholder="+34 600 000 000" value={form.telefono} onChange={f("telefono")} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Empresa (opcional)</Label>
                        <Input placeholder="Empresa S.L." value={form.empresa} onChange={f("empresa")} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Ciudad</Label>
                        <Input placeholder="Ciudad" value={form.ciudad} onChange={f("ciudad")} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">Notas</Label>
                        <Input placeholder="Notas sobre el cliente..." value={form.notas} onChange={f("notas")} className="bg-white/5 border-white/10" />
                    </div>
                </div>
                <Button onClick={handleSubmit} className="w-full mt-2 bg-[#4684A0] hover:bg-[#3a7290] text-white">
                    Crear Cliente
                </Button>
            </DialogContent>
        </Dialog>
    );
}

// ─── Client Detail ─────────────────────────────────────────────────────────────
function ClienteDetail({ cliente, onClose }: { cliente: Cliente; onClose: () => void; }) {
    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="w-96 h-full bg-[#020617] border-l border-white/10 p-6 overflow-y-auto flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#4684A0]/20 border border-[#4684A0]/30 flex items-center justify-center text-lg font-bold text-[#4684A0]">
                            {cliente.nombre.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                {cliente.nombre}
                            </h2>
                            {cliente.empresa && <p className="text-xs text-muted-foreground">{cliente.empresa}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-white text-lg">&times;</button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Eventos", value: cliente.eventos_totales },
                        { label: "Gasto total", value: `€${cliente.gasto_total.toLocaleString()}` },
                        { label: "Ciudad", value: cliente.ciudad },
                    ].map(s => (
                        <div key={s.label} className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-3 text-center">
                            <p className="text-sm font-bold text-foreground">{s.value}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Contact */}
                <div className="space-y-3">
                    {[
                        { label: "Email", value: cliente.email, icon: <Mail className="h-3.5 w-3.5" /> },
                        { label: "Teléfono", value: cliente.telefono, icon: <Phone className="h-3.5 w-3.5" /> },
                        { label: "Último evento", value: cliente.ultimo_evento, icon: <Calendar className="h-3.5 w-3.5" /> },
                        { label: "Cliente desde", value: cliente.created_at, icon: <Clock className="h-3.5 w-3.5" /> },
                    ].map(({ label, value, icon }) => (
                        <div key={label} className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</span>
                            <span className="text-sm flex items-center gap-1.5 text-foreground">{icon}{value}</span>
                        </div>
                    ))}
                </div>

                {cliente.notas && (
                    <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Notas</span>
                        <p className="text-sm text-muted-foreground bg-white/[0.03] rounded-lg p-3 mt-1">{cliente.notas}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-auto pt-4 border-t border-white/[0.06] space-y-2">
                    <div className="flex gap-2">
                        <a href={`mailto:${cliente.email}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full border-white/10 hover:bg-white/5 gap-1.5">
                                <Mail className="h-3.5 w-3.5" /> Email
                            </Button>
                        </a>
                        <a href={`tel:${cliente.telefono}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full border-white/10 hover:bg-white/5 gap-1.5">
                                <Phone className="h-3.5 w-3.5" /> Llamar
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>(MOCK_CLIENTES);
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Cliente | null>(null);

    const filtered = clientes.filter(c => {
        const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()) ||
            c.ciudad.toLowerCase().includes(search.toLowerCase());
        return matchSearch;
    });

    const handleAdd = (c: Cliente) => setClientes(p => [c, ...p]);

    const totalGasto = clientes.reduce((a, b) => a + b.gasto_total, 0);
    const totalEventos = clientes.reduce((a, b) => a + b.eventos_totales, 0);
    const avgGasto = clientes.length > 0 ? Math.round(totalGasto / clientes.length) : 0;

    return (
        <div className="min-h-screen bg-background text-foreground p-6 font-sans selection:bg-primary/30">
            <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(70,132,160,0.12),rgba(255,255,255,0))]" />

            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground text-sm mt-1">Base de datos de clientes · GilcaSound Events</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Buscar cliente..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 w-52 bg-white/5 border-white/10 h-8 text-sm"
                        />
                    </div>
                    <NewClienteDialog onAdd={handleAdd} />
                </div>
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Clientes totales", value: clientes.length, sub: "en la base de datos", color: "text-foreground" },
                    { label: "Eventos realizados", value: totalEventos, sub: "en total", color: "text-blue-400" },
                    { label: "Facturación total", value: `€${totalGasto.toLocaleString()}`, sub: "todos los clientes", color: "text-green-400" },
                    { label: "Ticket medio", value: `€${avgGasto.toLocaleString()}`, sub: "por cliente", color: "text-[#4684A0]" },
                ].map(kpi => (
                    <Card key={kpi.label} className="bg-card/40 backdrop-blur-sm border-white/5">
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

            <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-muted-foreground ml-2">{filtered.length} clientes</span>
            </div>

            {/* Table */}
            <Card className="bg-card/40 backdrop-blur-sm border-white/5">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                                    {["Cliente", "Contacto", "Ciudad", "Eventos", "Gasto total", "Último evento", ""].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {filtered.map(cliente => (
                                    <tr
                                        key={cliente.id}
                                        className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                                        onClick={() => setSelected(cliente)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#4684A0]/15 border border-[#4684A0]/20 flex items-center justify-center text-xs font-bold text-[#4684A0]">
                                                    {cliente.nombre.split(" ").map(n => n[0]).slice(0, 2).join("")}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium flex items-center gap-1.5">
                                                        {cliente.nombre}
                                                    </p>
                                                    {cliente.empresa && <p className="text-[10px] text-muted-foreground">{cliente.empresa}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-xs text-muted-foreground">{cliente.email}</p>
                                            <p className="text-xs text-muted-foreground">{cliente.telefono}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{cliente.ciudad}</td>
                                        <td className="px-4 py-3 text-sm font-medium">{cliente.eventos_totales}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-[#4684A0]">€{cliente.gasto_total.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">{cliente.ultimo_evento}</td>
                                        <td className="px-4 py-3">
                                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white h-7 px-2 text-xs">
                                                Ver →
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {selected && (
                <ClienteDetail
                    cliente={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
}
