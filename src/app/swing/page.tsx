"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ScanLine, TrendingUp, TrendingDown, Zap, BarChart2,
    RefreshCw, AlertCircle, Loader2, ExternalLink,
    ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ScanResult {
    ticker: string;
    name: string;
    sector: string;
    price: number | null;
    rsi: number | null;
    ma50: number | null;
    ma200: number | null;
    macd: number | null;
    macd_signal: number | null;
    bb_lower: number | null;
    bb_upper: number | null;
    rel_volume: number | null;
    pct_from_52w_high: number | null;
    pct_from_52w_low: number | null;
    eps_growth: number | null;
    eps_5yr_cagr: number | null;
    sales_5yr_cagr: number | null;
    eps_qoq: number | null;
    sales_qoq: number | null;
    signals: string[];
    signal_count: number;
}

interface ScanFilters {
    // Technical
    rsi_min: number | null;
    rsi_max: number | null;
    golden_cross: boolean | null;
    death_cross: boolean | null;
    price_above_ma50: boolean | null;
    macd_bullish: boolean | null;
    macd_bearish: boolean | null;
    bb_oversold: boolean | null;
    bb_overbought: boolean | null;
    rel_volume_min: number | null;
    // 52w
    near_52w_high: boolean | null;
    near_52w_low: boolean | null;
    // Fundamental
    eps_growth_min: number | null;
    eps_5yr_min: number | null;
    sales_5yr_min: number | null;
    eps_qoq_min: number | null;
    sales_qoq_min: number | null;
    universe: string;
}

const DEFAULT_FILTERS: ScanFilters = {
    rsi_min: null, rsi_max: null,
    golden_cross: null, death_cross: null,
    price_above_ma50: null,
    macd_bullish: null, macd_bearish: null,
    bb_oversold: null, bb_overbought: null,
    rel_volume_min: null,
    near_52w_high: null, near_52w_low: null,
    eps_growth_min: null, eps_5yr_min: null,
    sales_5yr_min: null, eps_qoq_min: null,
    sales_qoq_min: null,
    universe: "sp500",
};

// ── Presets ────────────────────────────────────────────────────────────────

interface Preset {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    filters: Partial<ScanFilters>;
}

const PRESETS: Preset[] = [
    {
        id: "oversold",
        label: "Oversold Bounce",
        icon: <TrendingDown className="h-3.5 w-3.5" />,
        color: "#10b981",
        filters: { rsi_min: 20, rsi_max: 35, macd_bullish: true },
    },
    {
        id: "golden",
        label: "Golden Cross",
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        color: "#f59e0b",
        filters: { golden_cross: true, price_above_ma50: true, macd_bullish: true },
    },
    {
        id: "volume",
        label: "Volume Breakout",
        icon: <Zap className="h-3.5 w-3.5" />,
        color: "#3b82f6",
        filters: { rel_volume_min: 2.0, price_above_ma50: true },
    },
    {
        id: "macd",
        label: "MACD Reversal",
        icon: <BarChart2 className="h-3.5 w-3.5" />,
        color: "#8b5cf6",
        filters: { macd_bullish: true, rsi_max: 60 },
    },
    {
        id: "near52high",
        label: "Near 52W High",
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        color: "#f97316",
        filters: { near_52w_high: true, golden_cross: true },
    },
    {
        id: "growth",
        label: "Fundamental Growth",
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        color: "#06b6d4",
        filters: { eps_growth_min: 0.10, sales_5yr_min: 0.05, eps_qoq_min: 0.05 },
    },
    {
        id: "bb_bounce",
        label: "BB Bounce",
        icon: <RefreshCw className="h-3.5 w-3.5" />,
        color: "#ec4899",
        filters: { bb_oversold: true, rsi_max: 45 },
    },
];

// ── Formatters ─────────────────────────────────────────────────────────────

const fmtPct = (n: number | null, digits = 1) =>
    n == null ? "—" : `${n >= 0 ? "+" : ""}${(n * 100).toFixed(digits)}%`;

const fmtNum = (n: number | null, digits = 1) =>
    n == null ? "—" : n.toFixed(digits);

const fmtPrice = (n: number | null) =>
    n == null ? "—" : `$${n.toFixed(2)}`;

const pctColor = (n: number | null) =>
    n == null ? "text-slate-400" : n > 0 ? "text-emerald-400" : "text-red-400";

// ── Signal badges ──────────────────────────────────────────────────────────

const SIGNAL_COLORS: Record<string, string> = {
    "RSI Oversold": "#10b981",
    "RSI Overbought": "#ef4444",
    "RSI Weak": "#6ee7b7",
    "RSI Strong": "#f59e0b",
    "Golden Cross": "#f59e0b",
    "Death Cross": "#ef4444",
    "MACD Bullish": "#3b82f6",
    "MACD Bearish": "#ef4444",
    "BB Oversold": "#10b981",
    "BB Overbought": "#f87171",
    "Near 52W High": "#f97316",
    "Near 52W Low": "#8b5cf6",
};

function getSignalColor(s: string): string {
    for (const [key, color] of Object.entries(SIGNAL_COLORS)) {
        if (s.startsWith(key)) return color;
    }
    if (s.startsWith("Vol")) return "#3b82f6";
    if (s.startsWith("EPS")) return "#06b6d4";
    return "#94a3b8";
}

function SignalBadge({ label }: { label: string }) {
    const color = getSignalColor(label);
    return (
        <span
            className="inline-block text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap"
            style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
        >
            {label}
        </span>
    );
}

// ── Filter toggle ──────────────────────────────────────────────────────────

function BoolToggle({
    label, value, onChange,
}: { label: string; value: boolean | null; onChange: (v: boolean | null) => void }) {
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onChange(value === true ? null : true)}
                className="text-xs px-2.5 py-1 rounded-lg transition-all"
                style={{
                    background: value === true ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                    border: value === true ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    color: value === true ? "#60a5fa" : "#94a3b8",
                    fontWeight: value === true ? 600 : 400,
                }}
            >
                {label}
            </button>
        </div>
    );
}

function NumberInput({
    label, value, onChange, placeholder, step = 0.01,
}: {
    label: string;
    value: number | null;
    onChange: (v: number | null) => void;
    placeholder?: string;
    step?: number;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{label}</label>
            <input
                type="number"
                step={step}
                value={value ?? ""}
                placeholder={placeholder ?? "—"}
                onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white bg-slate-900/60 border border-white/08 focus:outline-none focus:border-blue-500/50 font-mono"
            />
        </div>
    );
}

// ── Sortable table header ──────────────────────────────────────────────────

type SortKey = keyof ScanResult;

function SortHeader({
    label, sortKey, current, dir, onSort,
}: {
    label: string; sortKey: SortKey;
    current: SortKey; dir: "asc" | "desc";
    onSort: (k: SortKey) => void;
}) {
    const active = current === sortKey;
    return (
        <th
            className="px-3 py-2 text-left text-xs uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
            style={{ color: active ? "#60a5fa" : "#64748b" }}
            onClick={() => onSort(sortKey)}
        >
            <span className="flex items-center gap-1">
                {label}
                {active
                    ? dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
            </span>
        </th>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function SwingPage() {
    const router = useRouter();
    const [filters, setFilters] = useState<ScanFilters>(DEFAULT_FILTERS);
    const [activePreset, setActivePreset] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<ScanResult[] | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>("signal_count");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

    const setFilter = useCallback(<K extends keyof ScanFilters>(k: K, v: ScanFilters[K]) => {
        setActivePreset(null);
        setFilters(f => ({ ...f, [k]: v }));
    }, []);

    const applyPreset = (preset: Preset) => {
        setActivePreset(preset.id);
        setFilters({ ...DEFAULT_FILTERS, ...preset.filters, universe: filters.universe });
    };

    const resetFilters = () => {
        setActivePreset(null);
        setFilters(DEFAULT_FILTERS);
    };

    const runScan = useCallback(async () => {
        setLoading(true);
        setError(null);
        setResults(null);
        try {
            const res = await fetch("http://localhost:8000/api/swing-scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(filters),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail ?? `HTTP ${res.status}`);
            }
            const data: ScanResult[] = await res.json();
            setResults(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const handleSort = (key: SortKey) => {
        if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("desc"); }
    };

    const sorted = results ? [...results].sort((a, b) => {
        const va = a[sortKey] as number | null;
        const vb = b[sortKey] as number | null;
        const numa = va ?? (sortDir === "asc" ? Infinity : -Infinity);
        const numb = vb ?? (sortDir === "asc" ? Infinity : -Infinity);
        return sortDir === "asc" ? (numa as number) - (numb as number) : (numb as number) - (numa as number);
    }) : null;

    const glassCard: React.CSSProperties = {
        background: "rgba(15,23,42,0.7)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
    };

    const activeFiltersCount = Object.entries(filters).filter(([k, v]) =>
        k !== "universe" && v !== null && v !== false
    ).length;

    return (
        <div className="min-h-screen px-6 py-8 max-w-[1800px] mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <ScanLine className="h-8 w-8 text-violet-400" />
                    Swing Scanner
                </h1>
                <p className="text-muted-foreground mt-1">
                    Filtra el mercado con condiciones técnicas y fundamentales en tiempo real
                </p>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-5">
                {PRESETS.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => applyPreset(p)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                        style={{
                            color: activePreset === p.id ? "#fff" : p.color,
                            background: activePreset === p.id ? `${p.color}30` : `${p.color}10`,
                            border: `1px solid ${p.color}${activePreset === p.id ? "60" : "30"}`,
                            boxShadow: activePreset === p.id ? `0 0 12px ${p.color}20` : "none",
                        }}
                    >
                        {p.icon}
                        {p.label}
                    </button>
                ))}
                {activeFiltersCount > 0 && (
                    <button
                        onClick={resetFilters}
                        className="text-xs px-3 py-1.5 rounded-full text-slate-400 border border-white/10 hover:border-white/20 transition-colors"
                    >
                        Reset ({activeFiltersCount})
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
                {/* Filter panel */}
                <div className="space-y-4">
                    {/* Universe */}
                    <div className="rounded-xl p-4" style={glassCard}>
                        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-3">Universo</h3>
                        <div className="grid grid-cols-4 gap-1.5">
                            {["sp500", "tech", "eu", "all"].map((u) => (
                                <button
                                    key={u}
                                    onClick={() => setFilter("universe", u)}
                                    className="text-xs py-1.5 rounded-lg font-mono transition-all"
                                    style={{
                                        background: filters.universe === u ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                                        border: filters.universe === u ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                                        color: filters.universe === u ? "#60a5fa" : "#94a3b8",
                                        fontWeight: filters.universe === u ? 700 : 400,
                                    }}
                                >
                                    {u.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Technical filters */}
                    <div className="rounded-xl p-4" style={glassCard}>
                        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-3 flex items-center gap-2">
                            <BarChart2 className="h-3.5 w-3.5" /> Técnicos
                        </h3>
                        <div className="space-y-3">
                            {/* RSI */}
                            <div className="grid grid-cols-2 gap-2">
                                <NumberInput label="RSI mín" value={filters.rsi_min} onChange={(v) => setFilter("rsi_min", v)} placeholder="0" step={1} />
                                <NumberInput label="RSI máx" value={filters.rsi_max} onChange={(v) => setFilter("rsi_max", v)} placeholder="100" step={1} />
                            </div>

                            {/* MA toggles */}
                            <div className="flex flex-wrap gap-1.5">
                                <BoolToggle label="Golden Cross" value={filters.golden_cross} onChange={(v) => setFilter("golden_cross", v)} />
                                <BoolToggle label="Death Cross" value={filters.death_cross} onChange={(v) => setFilter("death_cross", v)} />
                                <BoolToggle label="Precio > MA50" value={filters.price_above_ma50} onChange={(v) => setFilter("price_above_ma50", v)} />
                            </div>

                            {/* MACD */}
                            <div className="flex flex-wrap gap-1.5">
                                <BoolToggle label="MACD Alcista" value={filters.macd_bullish} onChange={(v) => setFilter("macd_bullish", v)} />
                                <BoolToggle label="MACD Bajista" value={filters.macd_bearish} onChange={(v) => setFilter("macd_bearish", v)} />
                            </div>

                            {/* Bollinger */}
                            <div className="flex flex-wrap gap-1.5">
                                <BoolToggle label="BB Sobrevendido" value={filters.bb_oversold} onChange={(v) => setFilter("bb_oversold", v)} />
                                <BoolToggle label="BB Sobrecomprado" value={filters.bb_overbought} onChange={(v) => setFilter("bb_overbought", v)} />
                            </div>

                            {/* Volume */}
                            <NumberInput label="Volumen relativo mín (ej. 1.5)" value={filters.rel_volume_min} onChange={(v) => setFilter("rel_volume_min", v)} placeholder="—" step={0.1} />
                        </div>
                    </div>

                    {/* 52W + Fundamental */}
                    <div className="rounded-xl p-4" style={glassCard}>
                        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-3 flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5" /> Fundamentales
                        </h3>
                        <div className="space-y-3">
                            {/* 52w */}
                            <div className="flex flex-wrap gap-1.5">
                                <BoolToggle label="±10% Máx 52S" value={filters.near_52w_high} onChange={(v) => setFilter("near_52w_high", v)} />
                                <BoolToggle label="±10% Mín 52S" value={filters.near_52w_low} onChange={(v) => setFilter("near_52w_low", v)} />
                            </div>

                            <NumberInput label="EPS Growth (YoY) mín %" value={filters.eps_growth_min !== null ? filters.eps_growth_min * 100 : null} onChange={(v) => setFilter("eps_growth_min", v !== null ? v / 100 : null)} placeholder="ej. 10 = 10%" step={1} />
                            <NumberInput label="EPS CAGR 5yr mín %" value={filters.eps_5yr_min !== null ? filters.eps_5yr_min * 100 : null} onChange={(v) => setFilter("eps_5yr_min", v !== null ? v / 100 : null)} placeholder="ej. 10 = 10%" step={1} />
                            <NumberInput label="Sales CAGR 5yr mín %" value={filters.sales_5yr_min !== null ? filters.sales_5yr_min * 100 : null} onChange={(v) => setFilter("sales_5yr_min", v !== null ? v / 100 : null)} placeholder="ej. 5 = 5%" step={1} />
                            <NumberInput label="EPS QoQ mín %" value={filters.eps_qoq_min !== null ? filters.eps_qoq_min * 100 : null} onChange={(v) => setFilter("eps_qoq_min", v !== null ? v / 100 : null)} placeholder="ej. 5 = 5%" step={1} />
                            <NumberInput label="Sales QoQ mín %" value={filters.sales_qoq_min !== null ? filters.sales_qoq_min * 100 : null} onChange={(v) => setFilter("sales_qoq_min", v !== null ? v / 100 : null)} placeholder="ej. 5 = 5%" step={1} />
                        </div>
                    </div>

                    {/* Scan button */}
                    <button
                        id="scan-button"
                        onClick={runScan}
                        disabled={loading}
                        className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                        style={{
                            background: loading
                                ? "rgba(139,92,246,0.2)"
                                : "linear-gradient(135deg, rgba(139,92,246,0.8) 0%, rgba(59,130,246,0.8) 100%)",
                            border: "1px solid rgba(139,92,246,0.4)",
                            color: "#fff",
                            boxShadow: loading ? "none" : "0 4px 24px rgba(139,92,246,0.3)",
                        }}
                    >
                        {loading
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Escaneando…</>
                            : <><ScanLine className="h-4 w-4" /> Ejecutar Scan</>}
                    </button>
                </div>

                {/* Results */}
                <div className="rounded-xl overflow-hidden" style={glassCard}>
                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 border-b border-red-500/20 bg-red-500/10">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Empty / loading states */}
                    {!results && !loading && !error && (
                        <div className="flex flex-col items-center justify-center py-28 text-muted-foreground text-sm">
                            <ScanLine className="h-14 w-14 mb-4 opacity-20" />
                            <p className="font-medium">Configura los filtros y ejecuta el scan</p>
                            <p className="text-xs mt-1 opacity-60">Los datos se calculan en tiempo real con yfinance</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-28 text-muted-foreground text-sm gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
                            <p>Descargando y calculando indicadores…</p>
                            <p className="text-xs opacity-50">Puede tardar 20-60s dependiendo del universo</p>
                        </div>
                    )}

                    {/* Results table */}
                    {sorted && !loading && (
                        <>
                            <div className="px-4 py-3 border-b border-white/06 flex items-center justify-between">
                                <span className="text-sm font-semibold text-white">
                                    {sorted.length} resultado{sorted.length !== 1 ? "s" : ""}
                                </span>
                                <span className="text-xs text-slate-500">
                                    Universo: <span className="text-slate-300 font-mono">{filters.universe.toUpperCase()}</span>
                                </span>
                            </div>

                            {sorted.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm">
                                    <p>Sin resultados con los filtros actuales</p>
                                    <p className="text-xs mt-1">Relaja alguna condición e inténtalo de nuevo</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                                <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-slate-500 sticky left-0 bg-slate-950/80">Ticker</th>
                                                <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-slate-500">Empresa</th>
                                                <SortHeader label="Precio" sortKey="price" current={sortKey} dir={sortDir} onSort={handleSort} />
                                                <SortHeader label="RSI" sortKey="rsi" current={sortKey} dir={sortDir} onSort={handleSort} />
                                                <SortHeader label="Rel Vol" sortKey="rel_volume" current={sortKey} dir={sortDir} onSort={handleSort} />
                                                <SortHeader label="vs 52W↑" sortKey="pct_from_52w_high" current={sortKey} dir={sortDir} onSort={handleSort} />
                                                <SortHeader label="EPS YoY" sortKey="eps_growth" current={sortKey} dir={sortDir} onSort={handleSort} />
                                                <SortHeader label="EPS 5yr" sortKey="eps_5yr_cagr" current={sortKey} dir={sortDir} onSort={handleSort} />
                                                <SortHeader label="Rev 5yr" sortKey="sales_5yr_cagr" current={sortKey} dir={sortDir} onSort={handleSort} />
                                                <SortHeader label="EPS QoQ" sortKey="eps_qoq" current={sortKey} dir={sortDir} onSort={handleSort} />
                                                <SortHeader label="Rev QoQ" sortKey="sales_qoq" current={sortKey} dir={sortDir} onSort={handleSort} />
                                                <SortHeader label="Señales" sortKey="signal_count" current={sortKey} dir={sortDir} onSort={handleSort} />
                                                <th className="px-3 py-2" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sorted.map((row, i) => (
                                                <tr
                                                    key={row.ticker}
                                                    className="transition-colors hover:bg-white/03"
                                                    style={{ borderBottom: i < sorted.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                                                >
                                                    {/* Ticker */}
                                                    <td className="px-3 py-2.5 sticky left-0 bg-slate-950/80">
                                                        <span className="font-mono font-bold text-white text-sm">{row.ticker}</span>
                                                    </td>

                                                    {/* Name */}
                                                    <td className="px-3 py-2.5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-slate-300 max-w-[160px] truncate">{row.name}</span>
                                                            <span className="text-xs text-slate-600">{row.sector}</span>
                                                        </div>
                                                    </td>

                                                    {/* Price */}
                                                    <td className="px-3 py-2.5 font-mono text-white">{fmtPrice(row.price)}</td>

                                                    {/* RSI */}
                                                    <td className="px-3 py-2.5">
                                                        <span
                                                            className="font-mono text-sm font-bold"
                                                            style={{
                                                                color: row.rsi == null ? "#64748b"
                                                                    : row.rsi < 30 ? "#10b981"
                                                                        : row.rsi > 70 ? "#ef4444"
                                                                            : "#94a3b8"
                                                            }}
                                                        >
                                                            {fmtNum(row.rsi)}
                                                        </span>
                                                    </td>

                                                    {/* Rel Vol */}
                                                    <td className="px-3 py-2.5">
                                                        <span
                                                            className="font-mono text-sm"
                                                            style={{ color: row.rel_volume && row.rel_volume >= 1.5 ? "#3b82f6" : "#64748b" }}
                                                        >
                                                            {row.rel_volume ? `×${row.rel_volume.toFixed(1)}` : "—"}
                                                        </span>
                                                    </td>

                                                    {/* vs 52W high */}
                                                    <td className={`px-3 py-2.5 font-mono text-sm ${pctColor(row.pct_from_52w_high)}`}>
                                                        {row.pct_from_52w_high != null ? `${row.pct_from_52w_high.toFixed(1)}%` : "—"}
                                                    </td>

                                                    {/* EPS YoY */}
                                                    <td className={`px-3 py-2.5 font-mono text-sm ${pctColor(row.eps_growth)}`}>
                                                        {fmtPct(row.eps_growth)}
                                                    </td>

                                                    {/* EPS 5yr */}
                                                    <td className={`px-3 py-2.5 font-mono text-sm ${pctColor(row.eps_5yr_cagr)}`}>
                                                        {fmtPct(row.eps_5yr_cagr)}
                                                    </td>

                                                    {/* Rev 5yr */}
                                                    <td className={`px-3 py-2.5 font-mono text-sm ${pctColor(row.sales_5yr_cagr)}`}>
                                                        {fmtPct(row.sales_5yr_cagr)}
                                                    </td>

                                                    {/* EPS QoQ */}
                                                    <td className={`px-3 py-2.5 font-mono text-sm ${pctColor(row.eps_qoq)}`}>
                                                        {fmtPct(row.eps_qoq)}
                                                    </td>

                                                    {/* Rev QoQ */}
                                                    <td className={`px-3 py-2.5 font-mono text-sm ${pctColor(row.sales_qoq)}`}>
                                                        {fmtPct(row.sales_qoq)}
                                                    </td>

                                                    {/* Signal tags */}
                                                    <td className="px-3 py-2.5">
                                                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                                                            {row.signals.map((s) => (
                                                                <SignalBadge key={s} label={s} />
                                                            ))}
                                                        </div>
                                                    </td>

                                                    {/* Open in Analysis */}
                                                    <td className="px-3 py-2.5">
                                                        <button
                                                            onClick={() => router.push(`/company?t=${row.ticker}`)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                                                            title="Abrir en Company Analysis"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
