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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, FileText, CheckCircle2, Clock, AlertCircle, Euro, TrendingUp, Search, Filter, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type FacturaStatus = "pendiente" | "pagada" | "vencida";

type Factura = {
    id: string;
    numero: string;
    cliente: string;
    concepto: string;
    importe: number;
    fecha_emision: string;
    fecha_vencimiento: string;
    fecha_pago?: string;
    status: FacturaStatus;
};

// ─── Mock data generator ────────────────────────────────────────────────────────
const generateMockFacturas = (): Factura[] => {
    const clients = ["Miguel Torres", "Carlos Ruiz", "Lucía Fernández", "Empresa S.L.", "Gala Events", "Juan Pérez", "Marta Sánchez", "Boda Dreams", "Corporate Co.", "Studio X"];
    const concepts = ["PRODUCCIÓN", "PACK 2 + DJ SESSION", "MINIPACK", "DJ SESSION", "PACK 1", "PACK 3", "PACK 2 + EXTRAS"];
    const facturas: Factura[] = [];

    // Generate 60 invoices across 2025 and 2026
    for (let i = 1; i <= 60; i++) {
        const year = i <= 35 ? 2025 : 2026;
        const month = Math.floor(Math.random() * 12) + 1;
        const day = Math.floor(Math.random() * 28) + 1;
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const importe = Math.floor(Math.random() * 2500) + 300;
        const status: FacturaStatus = Math.random() > 0.3 ? "pagada" : (Math.random() > 0.5 ? "pendiente" : "vencida");

        facturas.push({
            id: i.toString(),
            numero: `GS-${year}-${String(i).padStart(3, "0")}`,
            cliente: clients[Math.floor(Math.random() * clients.length)],
            concepto: concepts[Math.floor(Math.random() * concepts.length)],
            importe,
            fecha_emision: dateStr,
            fecha_vencimiento: `${year}-${String(month).padStart(2, "0")}-${String(day + 10).padStart(2, "0")}`,
            status
        });
    }
    return facturas.sort((a, b) => b.fecha_emision.localeCompare(a.fecha_emision));
};

const MOCK_FACTURAS: Factura[] = generateMockFacturas();

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<FacturaStatus, { label: string; icon: React.ReactNode; bg: string; border: string; text: string }> = {
    pendiente: { label: "Pendiente", icon: <Clock className="h-3 w-3" />, bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
    pagada: { label: "Pagada", icon: <CheckCircle2 className="h-3 w-3" />, bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-400" },
    vencida: { label: "Vencida", icon: <AlertCircle className="h-3 w-3" />, bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400" },
};

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// ─── Custom tooltip para el chart ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#020617] border border-white/10 rounded-lg px-3 py-2 text-xs">
            <p className="text-muted-foreground mb-1">{label}</p>
            {payload.map((p) => (
                <p key={p.name} className="font-medium">
                    <span className="text-muted-foreground">{p.name === "facturado" ? "Facturado" : "Cobrado"}: </span>
                    <span className={p.name === "facturado" ? "text-[#4684A0]" : "text-green-400"}>€{p.value.toLocaleString()}</span>
                </p>
            ))}
        </div>
    );
}

// ─── New Invoice Dialog ────────────────────────────────────────────────────────
function NewFacturaDialog({ onAdd }: { onAdd: (f: Factura) => void }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ cliente: "", concepto: "", importe: "", fecha_emision: "", fecha_vencimiento: "" });

    const year = new Date().getFullYear();
    const nextNum = `GS-${year}-${String(MOCK_FACTURAS.length + 1).padStart(3, "0")}`;

    const handleSubmit = () => {
        if (!form.cliente || !form.importe) return;
        onAdd({
            id: Date.now().toString(),
            numero: nextNum,
            ...form,
            importe: parseFloat(form.importe),
            status: "pendiente",
        });
        setOpen(false);
        setForm({ cliente: "", concepto: "", importe: "", fecha_emision: "", fecha_vencimiento: "" });
    };

    const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 bg-[#4684A0] hover:bg-[#3a7290] text-white border-none">
                    <Plus className="h-4 w-4" /> Nueva Factura
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#020617] border-white/10 text-foreground max-w-md">
                <DialogHeader>
                    <DialogTitle>Nueva Factura · <span className="text-muted-foreground font-normal">{nextNum}</span></DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">Cliente *</Label>
                        <Input placeholder="Nombre del cliente" value={form.cliente} onChange={f("cliente")} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">Concepto</Label>
                        <Input placeholder="Descripción del servicio" value={form.concepto} onChange={f("concepto")} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Importe (€) *</Label>
                        <Input type="number" placeholder="0" value={form.importe} onChange={f("importe")} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Fecha emisión</Label>
                        <Input type="date" value={form.fecha_emision} onChange={f("fecha_emision")} className="bg-white/5 border-white/10" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Fecha vencimiento</Label>
                        <Input type="date" value={form.fecha_vencimiento} onChange={f("fecha_vencimiento")} className="bg-white/5 border-white/10" />
                    </div>
                </div>
                <Button onClick={handleSubmit} className="w-full mt-2 bg-[#4684A0] hover:bg-[#3a7290] text-white">
                    Crear Factura
                </Button>
            </DialogContent>
        </Dialog>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FacturacionPage() {
    const [facturas, setFacturas] = useState<Factura[]>(MOCK_FACTURAS);
    const [statusFilter, setStatusFilter] = useState<"all" | FacturaStatus>("all");
    const [periodFilter, setPeriodFilter] = useState<"2025" | "2026" | "all">("all");
    const [monthFilter, setMonthFilter] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [clientFilter, setClientFilter] = useState("");
    const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);

    const handleAdd = (f: Factura) => setFacturas(p => [f, ...p]);
    const handleMarkPaid = (id: string) => {
        setFacturas(p => p.map(f => f.id === id ? { ...f, status: "pagada" as FacturaStatus, fecha_pago: new Date().toISOString().split("T")[0] } : f));
    };

    // Dynamic Data Derivation
    const filteredFacturasForLogic = facturas.filter(f => {
        if (periodFilter !== "all" && !f.fecha_emision.startsWith(periodFilter)) return false;
        return true;
    });

    const monthlyData = monthNames.map((name, idx) => {
        const invoicesInMonth = filteredFacturasForLogic.filter(f => new Date(f.fecha_emision).getMonth() === idx);
        return {
            mes: name,
            facturado: invoicesInMonth.reduce((acc, f) => acc + f.importe, 0),
            cobrado: invoicesInMonth.filter(f => f.status === "pagada").reduce((acc, f) => acc + f.importe, 0)
        };
    });

    const uniqueConcepts = Array.from(new Set(facturas.map(f => f.concepto))).sort();

    const filtered = facturas
        .filter(f => statusFilter === "all" || f.status === statusFilter)
        .filter(f => {
            if (!monthFilter) return true;
            const fMonthIndex = new Date(f.fecha_emision).getMonth();
            return monthNames[fMonthIndex] === monthFilter;
        })
        .filter(f => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return f.cliente.toLowerCase().includes(q) || f.numero.toLowerCase().includes(q) || f.concepto.toLowerCase().includes(q);
        })
        .filter(f => {
            if (!clientFilter) return true;
            return f.cliente.toLowerCase().includes(clientFilter.toLowerCase());
        })
        .filter(f => {
            if (selectedConcepts.length === 0) return true;
            return selectedConcepts.includes(f.concepto);
        });

    // KPIs based on current filtered set (or logical set)
    const totalFacturado = filteredFacturasForLogic.reduce((a, b) => a + b.importe, 0);
    const totalCobrado = filteredFacturasForLogic.filter(f => f.status === "pagada").reduce((a, b) => a + b.importe, 0);
    const pendiente = filteredFacturasForLogic.filter(f => f.status === "pendiente").reduce((a, b) => a + b.importe, 0);
    const vencido = filteredFacturasForLogic.filter(f => f.status === "vencida").reduce((a, b) => a + b.importe, 0);

    return (
        <div className="min-h-screen bg-background text-foreground p-6 font-sans selection:bg-primary/30">
            <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(70,132,160,0.12),rgba(255,255,255,0))]" />

            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
                    <p className="text-muted-foreground text-sm mt-1">Ingresos y facturas · GilcaSound Events</p>
                </div>
                <NewFacturaDialog onAdd={handleAdd} />
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total Facturado", value: `€${totalFacturado.toLocaleString()}`, sub: `${facturas.length} facturas`, color: "text-white", accent: "text-sky-400", shadow: "shadow-sky-500/10", grad: "from-sky-500/10", icon: <FileText className="h-4 w-4" /> },
                    { label: "Cobrado", value: `€${totalCobrado.toLocaleString()}`, sub: `${facturas.filter(f => f.status === "pagada").length} pagadas`, color: "text-emerald-400", accent: "text-emerald-400", shadow: "shadow-emerald-500/10", grad: "from-emerald-500/10", icon: <CheckCircle2 className="h-4 w-4" /> },
                    { label: "Pendiente", value: `€${pendiente.toLocaleString()}`, sub: `${facturas.filter(f => f.status === "pendiente").length} facturas`, color: "text-amber-400", accent: "text-amber-400", shadow: "shadow-amber-500/10", grad: "from-amber-500/10", icon: <Clock className="h-4 w-4" /> },
                    { label: "Vencido", value: `€${vencido.toLocaleString()}`, sub: `${facturas.filter(f => f.status === "vencida").length} facturas`, color: "text-rose-400", accent: "text-rose-400", shadow: "shadow-rose-500/10", grad: "from-rose-500/10", icon: <AlertCircle className="h-4 w-4" /> },
                ].map(kpi => (
                    <Card key={kpi.label} className={`relative overflow-hidden bg-white/[0.02] backdrop-blur-xl border-white/[0.05] transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] group ${kpi.shadow}`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${kpi.grad} to-transparent opacity-10 group-hover:opacity-20 transition-opacity`} />
                        <CardHeader className="pb-1 relative z-10 px-5 pt-5">
                            <CardTitle className="text-[10px] font-black tracking-[0.25em] uppercase flex items-center justify-between text-muted-foreground/50">
                                {kpi.label}
                                <span className={`${kpi.accent} opacity-80 group-hover:opacity-100 transition-all transform group-hover:scale-110`}>{kpi.icon}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 px-5 pb-5">
                            <div className={`text-2xl font-bold tracking-tight ${kpi.color} drop-shadow-sm`}>{kpi.value}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`w-1 h-3 rounded-full ${kpi.accent.replace('text-', 'bg-')}/30`} />
                                <p className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest">{kpi.sub}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Chart */}
                <Card className="lg:col-span-2 bg-white/[0.01] backdrop-blur-md border-white/[0.05] overflow-hidden">
                    <CardHeader className="py-3 px-6 border-b border-white/[0.03] flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                            <CardTitle className="text-[10px] font-black tracking-[0.3em] uppercase text-muted-foreground/60 flex items-center gap-2">
                                <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
                                Evolución Facturación
                            </CardTitle>
                            <p className="text-[11px] font-bold text-sky-400/80 uppercase tracking-tighter">
                                {periodFilter === "all" ? "Histórico Total" : `Periodo Fiscal ${periodFilter}`}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/[0.05]">
                            {/* Unified Control Bar */}
                            <Select value={monthFilter || "all"} onValueChange={(v) => setMonthFilter(v === "all" ? null : v)}>
                                <SelectTrigger className="h-8 w-36 bg-white/[0.03] border-white/5 text-[9px] font-black uppercase tracking-wider focus:ring-0 rounded-lg hover:bg-white/[0.05] transition-colors">
                                    <SelectValue placeholder="MES" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-white/10">
                                    <SelectItem value="all" className="text-[10px] font-bold">AÑO COMPLETO</SelectItem>
                                    {monthNames.map(m => (
                                        <SelectItem key={m} value={m} className="text-[10px] font-bold uppercase">{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="h-4 w-px bg-white/10 mx-1" />

                            <div className="relative flex items-center h-8 w-[190px]">
                                <div
                                    className="absolute top-0 bottom-0 left-0 rounded-lg bg-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                                    style={{
                                        width: "33.33%",
                                        transform: `translateX(${periodFilter === "2025" ? "0%" : periodFilter === "2026" ? "100%" : "200%"})`
                                    }}
                                />
                                {(["2025", "2026", "all"] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriodFilter(p)}
                                        className={`relative z-10 flex-1 h-full text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${periodFilter === p ? "text-white" : "text-muted-foreground/40 hover:text-white/80"}`}
                                    >
                                        {p === "all" ? "TODO" : p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart
                                data={monthlyData}
                                barGap={6}
                                onClick={(data) => {
                                    if (data && data.activeLabel) {
                                        const label = data.activeLabel as string;
                                        setMonthFilter(prev => prev === label ? null : label);
                                    }
                                }}
                                style={{ cursor: "pointer" }}
                            >
                                <XAxis dataKey="mes" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} width={40} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                                <Bar dataKey="facturado" name="facturado" radius={[3, 3, 0, 0]} maxBarSize={32}>
                                    {monthlyData.map((m, i) => (
                                        <Cell
                                            key={`cell-f-${i}`}
                                            fill={monthFilter === null || monthFilter === m.mes ? "rgba(70,132,160,1)" : "rgba(70,132,160,0.2)"}
                                            className="transition-all duration-500"
                                        />
                                    ))}
                                </Bar>
                                <Bar dataKey="cobrado" name="cobrado" radius={[3, 3, 0, 0]} maxBarSize={32}>
                                    {monthlyData.map((m, i) => (
                                        <Cell
                                            key={`cell-c-${i}`}
                                            fill={monthFilter === null || monthFilter === m.mes ? "rgba(34,197,94,1)" : "rgba(34,197,94,0.2)"}
                                            className="transition-all duration-500"
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="flex items-center gap-4 mt-2 justify-center">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <span className="w-3 h-2 rounded-sm bg-[#4684A0]/50" />Facturado
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <span className="w-3 h-2 rounded-sm bg-green-500/60" />Cobrado
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick stats */}
                <Card className="bg-card/40 backdrop-blur-md border-white/5 overflow-hidden">
                    <CardHeader className="py-2 px-4">
                        <CardTitle className="text-[9px] font-black tracking-[0.2em] uppercase text-muted-foreground/80">Resumen de cobros</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {/* Collection rate */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                            <div className="flex justify-between items-end mb-2">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground opacity-60 tracking-widest">Tasa de cobro</p>
                                    <p className="text-lg font-bold text-green-400">{totalFacturado > 0 ? Math.round((totalCobrado / totalFacturado) * 100) : 0}%</p>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium mb-1">{totalCobrado.toLocaleString()} / {totalFacturado.toLocaleString()} €</span>
                            </div>
                            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500/50 to-green-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${totalFacturado > 0 ? (totalCobrado / totalFacturado) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Per status */}
                        <div className="space-y-2">
                            {(["pagada", "pendiente", "vencida"] as FacturaStatus[]).map(s => {
                                const cfg = STATUS_CFG[s];
                                const count = facturas.filter(f => f.status === s).length;
                                const amount = facturas.filter(f => f.status === s).reduce((a, b) => a + b.importe, 0);
                                return (
                                    <div key={s} className={`group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg} ${cfg.text} transition-transform group-hover:scale-110`}>
                                                {cfg.icon}
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold capitalize">{cfg.label}</p>
                                                <p className="text-[10px] text-muted-foreground">{count} factura{count !== 1 ? "s" : ""}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-bold ${cfg.text}`}>€{amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices table */}
            <Card className="bg-white/[0.01] backdrop-blur-md border-white/[0.05] overflow-hidden">
                <CardHeader className="py-5 px-6 border-b border-white/[0.03] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="space-y-0.5">
                            <CardTitle className="text-[10px] font-black tracking-[0.3em] uppercase text-muted-foreground/60">Facturación Detallada</CardTitle>
                            <p className="text-[11px] font-bold text-sky-400/80 uppercase tracking-tighter">Registros de emisión</p>
                        </div>
                        {(monthFilter || searchQuery || clientFilter || selectedConcepts.length > 0) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setMonthFilter(null);
                                    setSearchQuery("");
                                    setClientFilter("");
                                    setSelectedConcepts([]);
                                }}
                                className="h-6 px-3 text-[9px] font-black uppercase tracking-widest bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 rounded-full flex items-center gap-1.5 transition-all"
                            >
                                Reset <Plus className="h-3 w-3 rotate-45" />
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center">
                        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/[0.05]">
                            <div className="relative flex items-center h-8 w-[320px]">
                                {/* Sliding selector */}
                                <div
                                    className="absolute top-0 bottom-0 left-0 rounded-lg bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                                    style={{
                                        width: "25%",
                                        transform: `translateX(${statusFilter === "all" ? "0%" : statusFilter === "pendiente" ? "100%" : statusFilter === "pagada" ? "200%" : "300%"})`
                                    }}
                                />
                                {(["all", "pendiente", "pagada", "vencida"] as const).map(f => {
                                    const label = f === "all" ? "TODAS" : STATUS_CFG[f]?.label;
                                    return (
                                        <button
                                            key={f}
                                            onClick={() => setStatusFilter(f)}
                                            className={`relative z-10 flex-1 h-full text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${statusFilter === f ? "text-white" : "text-muted-foreground/40 hover:text-white/60"}`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                                    <th className="text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-black w-[150px]">Documento</th>
                                    <th className="text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-black w-[180px]">
                                        <div className="flex items-center gap-2">
                                            <span>Cliente</span>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button className="hover:text-sky-400 transition-colors">
                                                        <Search className={`h-3 w-3 ${clientFilter ? "text-sky-400" : ""}`} />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[200px] p-2 bg-black border-white/10 shadow-2xl">
                                                    <Input
                                                        placeholder="FILTRAR CLIENTE..."
                                                        value={clientFilter}
                                                        onChange={(e) => setClientFilter(e.target.value)}
                                                        className="h-8 text-[10px] font-bold uppercase tracking-wider mb-1 bg-white/5 border-white/10 focus:border-sky-500/50"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </th>
                                    <th className="text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-black">
                                        <div className="flex items-center gap-2">
                                            <span>Concepto</span>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button className="hover:text-sky-400 transition-colors">
                                                        <Filter className={`h-3 w-3 ${selectedConcepts.length > 0 ? "text-sky-400" : ""}`} />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[240px] p-0 bg-black border-white/10 shadow-2xl">
                                                    <div className="p-2 border-b border-white/5 flex items-center justify-between">
                                                        <span className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">FILTRAR PACKS</span>
                                                        {selectedConcepts.length > 0 && (
                                                            <button onClick={() => setSelectedConcepts([])} className="text-[9px] font-black text-sky-400 hover:underline tracking-tighter">RESET</button>
                                                        )}
                                                    </div>
                                                    <div className="max-h-[200px] overflow-y-auto p-1">
                                                        {uniqueConcepts.map(c => (
                                                            <div
                                                                key={c}
                                                                className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-md cursor-pointer transition-colors"
                                                                onClick={() => {
                                                                    setSelectedConcepts(prev =>
                                                                        prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                                                                    );
                                                                }}
                                                            >
                                                                <Checkbox checked={selectedConcepts.includes(c)} className="h-3 w-3 border-white/20 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" />
                                                                <span className="text-[10px] uppercase font-bold tracking-tight text-white/80 truncate">{c}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </th>
                                    <th className="text-right px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-black w-[110px]">Importe</th>
                                    <th className="text-right px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-black w-[110px]">Emisión</th>
                                    <th className="text-right px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-black w-[110px]">Vencimiento</th>
                                    <th className="text-right px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-black w-[180px]">Estado / Gestión</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {filtered.map(factura => {
                                    const cfg = STATUS_CFG[factura.status];
                                    return (
                                        <tr
                                            key={factura.id}
                                            className="group border-b border-white/[0.02] hover:bg-white/[0.01] transition-all"
                                        >
                                            <td className="py-5 px-6">
                                                <span className="text-[10px] font-black tracking-wider text-sky-500/60 uppercase whitespace-nowrap">{factura.numero}</span>
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className="text-[11px] font-bold text-white group-hover:text-sky-400 transition-colors uppercase tracking-tight truncate block">{factura.cliente}</span>
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider line-clamp-1">{factura.concepto}</span>
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <span className="text-[12px] font-bold text-white tracking-tighter">€{factura.importe.toLocaleString()}</span>
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <span className="text-[10px] font-bold text-muted-foreground/60 tabular-nums">
                                                    {new Date(factura.fecha_emision).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 text-right">
                                                <span className="text-[10px] font-bold text-muted-foreground/60 tabular-nums">
                                                    {new Date(factura.fecha_vencimiento).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex items-center justify-end gap-3 min-w-[150px]">
                                                    <div className="flex flex-col items-end mr-3 flex-shrink-0">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${cfg.bg} ${cfg.border} ${cfg.text} uppercase tracking-[0.15em] shadow-sm whitespace-nowrap`}>
                                                            {cfg.label}
                                                        </span>
                                                        {factura.status === "pagada" && factura.fecha_pago && (
                                                            <span className="text-[8px] text-muted-foreground/30 italic mt-1 uppercase tracking-tighter">LIQUIDADA {factura.fecha_pago}</span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0 w-[50px] justify-end">
                                                        {factura.status === "pendiente" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMarkPaid(factura.id);
                                                                }}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground/40 hover:bg-white/5 hover:text-white transition-colors">
                                                            <FileText className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
