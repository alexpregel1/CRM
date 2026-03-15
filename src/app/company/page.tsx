"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from "recharts";
import {
    Search,
    Building2,
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart2,
    Globe,
    Users,
    AlertCircle,
    Loader2,
    ExternalLink,
    ChevronUp,
    ChevronDown,
    Minus,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface FundamentalsData {
    company: {
        ticker: string;
        name: string;
        sector: string;
        industry: string;
        country: string;
        website: string;
        description: string;
        employees: number | null;
        logo_url: string;
    };
    price: {
        current_price: number | null;
        market_cap: number | null;
        enterprise_value: number | null;
        week_52_high: number | null;
        week_52_low: number | null;
        beta: number | null;
        avg_volume: number | null;
        shares_outstanding: number | null;
    };
    valuation: {
        pe_trailing: number | null;
        pe_forward: number | null;
        peg: number | null;
        ps_trailing: number | null;
        pb: number | null;
        ev_ebitda: number | null;
        ev_revenue: number | null;
    };
    margins: {
        gross_margin: number | null;
        operating_margin: number | null;
        net_margin: number | null;
        roe: number | null;
        roa: number | null;
        revenue_growth: number | null;
        earnings_growth: number | null;
    };
    balance: {
        debt_to_equity: number | null;
        current_ratio: number | null;
        quick_ratio: number | null;
        total_cash: number | null;
        total_debt: number | null;
        free_cashflow: number | null;
        operating_cashflow: number | null;
    };
    dividends: {
        dividend_yield: number | null;
        dividend_rate: number | null;
        payout_ratio: number | null;
        ex_dividend_date: number | null;
    };
    consensus: {
        recommendation: string;
        target_mean: number | null;
        target_low: number | null;
        target_high: number | null;
        analyst_count: number | null;
    };
    income_history: Array<{
        quarter: string;
        revenue: number | null;
        gross_profit: number | null;
        operating_income: number | null;
        net_income: number | null;
        ebitda: number | null;
    }>;
    eps_history: Array<{
        quarter: string;
        eps_actual: number | null;
        eps_estimate: number | null;
        surprise_pct: number | null;
    }>;
}

// ── Formatters ─────────────────────────────────────────────────────────────

function fmtLarge(n: number | null | undefined): string {
    if (n == null) return "N/A";
    const abs = Math.abs(n);
    if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${n.toFixed(0)}`;
}

function fmtPct(n: number | null | undefined, digits = 1): string {
    if (n == null) return "N/A";
    return `${(n * 100).toFixed(digits)}%`;
}

function fmtNum(n: number | null | undefined, digits = 2): string {
    if (n == null) return "N/A";
    return n.toFixed(digits);
}

function fmtPrice(n: number | null | undefined): string {
    if (n == null) return "N/A";
    return `$${n.toFixed(2)}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({
    label,
    value,
    sub,
    trend,
}: {
    label: string;
    value: string;
    sub?: string;
    trend?: "up" | "down" | "neutral";
}) {
    const trendColor =
        trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-slate-400";
    const TrendIcon =
        trend === "up" ? ChevronUp : trend === "down" ? ChevronDown : Minus;

    return (
        <div
            className="rounded-xl p-4 flex flex-col gap-1"
            style={{
                background: "rgba(15,23,42,0.7)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(8px)",
            }}
        >
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                {label}
            </span>
            <span className="text-2xl font-bold text-white">{value}</span>
            {sub && (
                <span className={`text-xs flex items-center gap-0.5 ${trendColor}`}>
                    <TrendIcon className="h-3 w-3" />
                    {sub}
                </span>
            )}
        </div>
    );
}

const CONSENSUS_CONFIG: Record<
    string,
    { label: string; color: string; bg: string }
> = {
    "strong buy": { label: "Strong Buy", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
    buy: { label: "Buy", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
    hold: { label: "Hold", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    sell: { label: "Sell", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
    "strong sell": { label: "Strong Sell", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

function ConsensusBadge({ rec }: { rec: string }) {
    const key = rec.toLowerCase();
    const cfg = CONSENSUS_CONFIG[key] ?? { label: rec, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
    return (
        <span
            className="px-3 py-1 rounded-full text-sm font-semibold"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}40` }}
        >
            {cfg.label}
        </span>
    );
}

// ── Custom chart tooltip ───────────────────────────────────────────────────

const DarkTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ color: string; name: string; value: number }>;
    label?: string;
}) => {
    if (!active || !payload?.length) return null;
    return (
        <div
            className="rounded-lg p-3 text-sm shadow-xl"
            style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
            <p className="text-muted-foreground mb-1 font-medium">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>
                    {p.name}: <span className="font-bold">{p.value != null ? p.value.toFixed(2) : "N/A"}</span>
                </p>
            ))}
        </div>
    );
};

// ── Ticker autocomplete data ────────────────────────────────────────────────

const TICKER_LIST: { ticker: string; name: string }[] = [
    // Mega-cap Tech
    { ticker: "AAPL", name: "Apple Inc." },
    { ticker: "MSFT", name: "Microsoft" },
    { ticker: "GOOGL", name: "Alphabet (Google)" },
    { ticker: "GOOG", name: "Alphabet Class C" },
    { ticker: "AMZN", name: "Amazon" },
    { ticker: "META", name: "Meta Platforms" },
    { ticker: "NVDA", name: "NVIDIA" },
    { ticker: "TSLA", name: "Tesla" },
    { ticker: "AVGO", name: "Broadcom" },
    { ticker: "ORCL", name: "Oracle" },
    { ticker: "CRM", name: "Salesforce" },
    { ticker: "ADBE", name: "Adobe" },
    { ticker: "AMD", name: "AMD" },
    { ticker: "INTC", name: "Intel" },
    { ticker: "QCOM", name: "Qualcomm" },
    { ticker: "TXN", name: "Texas Instruments" },
    { ticker: "AMAT", name: "Applied Materials" },
    { ticker: "MU", name: "Micron Technology" },
    { ticker: "LRCX", name: "Lam Research" },
    { ticker: "KLAC", name: "KLA Corporation" },
    { ticker: "ASML", name: "ASML Holding" },
    { ticker: "TSM", name: "Taiwan Semiconductor" },
    { ticker: "NFLX", name: "Netflix" },
    { ticker: "UBER", name: "Uber" },
    { ticker: "ABNB", name: "Airbnb" },
    { ticker: "SHOP", name: "Shopify" },
    { ticker: "SNOW", name: "Snowflake" },
    { ticker: "PLTR", name: "Palantir" },
    // Finance
    { ticker: "JPM", name: "JPMorgan Chase" },
    { ticker: "BAC", name: "Bank of America" },
    { ticker: "GS", name: "Goldman Sachs" },
    { ticker: "MS", name: "Morgan Stanley" },
    { ticker: "WFC", name: "Wells Fargo" },
    { ticker: "BLK", name: "BlackRock" },
    { ticker: "V", name: "Visa" },
    { ticker: "MA", name: "Mastercard" },
    { ticker: "AXP", name: "American Express" },
    { ticker: "PYPL", name: "PayPal" },
    // Healthcare / Pharma
    { ticker: "LLY", name: "Eli Lilly" },
    { ticker: "JNJ", name: "Johnson & Johnson" },
    { ticker: "ABBV", name: "AbbVie" },
    { ticker: "MRK", name: "Merck" },
    { ticker: "PFE", name: "Pfizer" },
    { ticker: "UNH", name: "UnitedHealth" },
    { ticker: "BMY", name: "Bristol-Myers Squibb" },
    { ticker: "AMGN", name: "Amgen" },
    { ticker: "GILD", name: "Gilead Sciences" },
    { ticker: "MRNA", name: "Moderna" },
    { ticker: "ISRG", name: "Intuitive Surgical" },
    { ticker: "SYK", name: "Stryker" },
    // Energy
    { ticker: "XOM", name: "ExxonMobil" },
    { ticker: "CVX", name: "Chevron" },
    { ticker: "COP", name: "ConocoPhillips" },
    { ticker: "OXY", name: "Occidental Petroleum" },
    { ticker: "SLB", name: "Schlumberger" },
    { ticker: "EOG", name: "EOG Resources" },
    { ticker: "PSX", name: "Phillips 66" },
    // Consumer
    { ticker: "WMT", name: "Walmart" },
    { ticker: "COST", name: "Costco" },
    { ticker: "TGT", name: "Target" },
    { ticker: "HD", name: "Home Depot" },
    { ticker: "LOW", name: "Lowe's" },
    { ticker: "NKE", name: "Nike" },
    { ticker: "MCD", name: "McDonald's" },
    { ticker: "SBUX", name: "Starbucks" },
    { ticker: "KO", name: "Coca-Cola" },
    { ticker: "PEP", name: "PepsiCo" },
    { ticker: "PG", name: "Procter & Gamble" },
    { ticker: "UL", name: "Unilever" },
    { ticker: "LVMH", name: "LVMH" },
    // Industrials & Aero
    { ticker: "BA", name: "Boeing" },
    { ticker: "RTX", name: "RTX (Raytheon)" },
    { ticker: "LMT", name: "Lockheed Martin" },
    { ticker: "GE", name: "GE Aerospace" },
    { ticker: "CAT", name: "Caterpillar" },
    { ticker: "HON", name: "Honeywell" },
    { ticker: "UPS", name: "UPS" },
    { ticker: "FDX", name: "FedEx" },
    // Telecom & Media
    { ticker: "T", name: "AT&T" },
    { ticker: "VZ", name: "Verizon" },
    { ticker: "DIS", name: "Walt Disney" },
    { ticker: "CMCSA", name: "Comcast" },
    { ticker: "WBD", name: "Warner Bros. Discovery" },
    // Real estate / Utilities
    { ticker: "NEE", name: "NextEra Energy" },
    { ticker: "DUK", name: "Duke Energy" },
    { ticker: "AMT", name: "American Tower" },
    { ticker: "PLD", name: "Prologis" },
    // Materials / Mining
    { ticker: "NEM", name: "Newmont (Gold)" },
    { ticker: "FNV", name: "Franco-Nevada (Gold)" },
    { ticker: "WPM", name: "Wheaton Precious Metals" },
    { ticker: "FCX", name: "Freeport-McMoRan (Copper)" },
    { ticker: "RIO", name: "Rio Tinto" },
    { ticker: "BHP", name: "BHP Group" },
    { ticker: "VALE", name: "Vale" },
    // EV & Future Mobility
    { ticker: "RIVN", name: "Rivian" },
    { ticker: "LCID", name: "Lucid Motors" },
    // Aerospace / Space
    { ticker: "SPCE", name: "Virgin Galactic" },
    { ticker: "RKT", name: "Rocket Companies" },
    // European blue chips
    { ticker: "SAP", name: "SAP SE" },
    { ticker: "SIEGY", name: "Siemens" },
    { ticker: "BAYRY", name: "Bayer" },
    { ticker: "NSRGY", name: "Nestlé" },
    { ticker: "RHHBY", name: "Roche" },
    { ticker: "NOVN", name: "Novartis" },
    { ticker: "HSBC", name: "HSBC" },
    { ticker: "BP", name: "BP" },
    { ticker: "SHEL", name: "Shell" },
    { ticker: "TOTF", name: "TotalEnergies" },
    { ticker: "AIR", name: "Airbus" },
    { ticker: "SAN", name: "Banco Santander" },
    { ticker: "BBVA", name: "BBVA" },
    { ticker: "IBE", name: "Iberdrola" },
    { ticker: "TEF", name: "Telefónica" },
    { ticker: "AMS", name: "Amadeus IT" },
    { ticker: "INDITEX", name: "Inditex / Zara" },
];

// ── Ticker combobox ────────────────────────────────────────────────────────

function TickerCombobox({
    value,
    onChange,
    onSubmit,
}: {
    value: string;
    onChange: (v: string) => void;
    onSubmit: (ticker: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const suggestions = value.trim().length === 0
        ? []
        : TICKER_LIST
            .filter(
                (t) =>
                    t.ticker.startsWith(value.toUpperCase()) ||
                    t.name.toUpperCase().includes(value.toUpperCase())
            )
            .slice(0, 8);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const select = (ticker: string) => {
        onChange(ticker);
        setOpen(false);
        // Pass the ticker directly to avoid stale closure on inputTicker
        onSubmit(ticker);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || suggestions.length === 0) {
            if (e.key === "Enter") { e.preventDefault(); onSubmit(value); }
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            select(suggestions[highlighted].ticker);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div ref={wrapperRef} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <input
                id="ticker-input"
                type="text"
                value={value}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => {
                    onChange(e.target.value.toUpperCase());
                    setOpen(true);
                    setHighlighted(0);
                }}
                onFocus={() => { if (value.trim()) setOpen(true); }}
                onKeyDown={handleKeyDown}
                placeholder="Ticker (ej. AMZN, NVDA, TSLA)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/60 text-sm font-mono"
            />

            {/* Dropdown */}
            {open && suggestions.length > 0 && (
                <ul
                    className="absolute z-50 left-0 right-0 mt-1.5 overflow-hidden rounded-xl shadow-2xl"
                    style={{
                        background: "rgba(10,16,36,0.97)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        backdropFilter: "blur(16px)",
                    }}
                >
                    {suggestions.map((s, i) => (
                        <li
                            key={s.ticker}
                            onMouseDown={(e) => { e.preventDefault(); select(s.ticker); }}
                            onMouseEnter={() => setHighlighted(i)}
                            className="flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors"
                            style={{
                                background: i === highlighted ? "rgba(59,130,246,0.15)" : "transparent",
                                borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                            }}
                        >
                            <span className="font-mono text-sm font-bold text-white">{s.ticker}</span>
                            <span className="text-xs text-slate-400 ml-3 truncate">{s.name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function CompanyPage() {
    return (
        <Suspense>
            <CompanyPageInner />
        </Suspense>
    );
}

function CompanyPageInner() {
    const searchParams = useSearchParams();
    const [inputTicker, setInputTicker] = useState(searchParams.get("t") ?? "AAPL");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<FundamentalsData | null>(null);

    const fetchFundamentals = useCallback(async (ticker: string) => {
        if (!ticker.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://localhost:8000/api/fundamentals/${ticker.trim().toUpperCase()}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail ?? `HTTP ${res.status}`);
            }
            const json: FundamentalsData = await res.json();
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-fetch when ?t= is present (e.g. from Swing Scanner)
    useEffect(() => {
        const t = searchParams.get("t");
        if (t) {
            setInputTicker(t);
            fetchFundamentals(t);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchFundamentals(inputTicker);
    };

    // Format income data for chart (billions)
    const incomeChartData = data?.income_history.map((q) => ({
        quarter: q.quarter,
        Revenue: q.revenue != null ? +(q.revenue / 1e9).toFixed(2) : null,
        "Net Income": q.net_income != null ? +(q.net_income / 1e9).toFixed(2) : null,
        EBITDA: q.ebitda != null ? +(q.ebitda / 1e9).toFixed(2) : null,
    })) ?? [];

    // Format margin data for chart (%)
    const marginChartData = data?.income_history.map((q) => {
        const rev = q.revenue ?? 1;
        return {
            quarter: q.quarter,
            "Gross Margin": q.gross_profit != null ? +((q.gross_profit / rev) * 100).toFixed(1) : null,
            "Operating Margin": q.operating_income != null ? +((q.operating_income / rev) * 100).toFixed(1) : null,
            "Net Margin": q.net_income != null ? +((q.net_income / rev) * 100).toFixed(1) : null,
        };
    }) ?? [];

    const upside =
        data?.price.current_price && data?.consensus.target_mean
            ? ((data.consensus.target_mean - data.price.current_price) / data.price.current_price) * 100
            : null;

    const containerStyle: React.CSSProperties = {
        background: "rgba(15,23,42,0.7)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(8px)",
    };

    return (
        <div className="min-h-screen px-6 py-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-blue-400" />
                    Company Analysis
                </h1>
                <p className="text-muted-foreground mt-1">
                    Fundamental overview — Income, EPS, Margins & Valuation Ratios
                </p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-8 flex gap-3 max-w-lg">
                <TickerCombobox
                    value={inputTicker}
                    onChange={setInputTicker}
                    onSubmit={fetchFundamentals}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    {loading ? "Loading..." : "Analyze"}
                </button>
            </form>

            {/* Error */}
            {error && (
                <div className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400 border border-red-500/20 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div className="space-y-4 animate-pulse">
                    <div className="h-28 rounded-xl bg-slate-800/60" />
                    <div className="grid grid-cols-6 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-xl bg-slate-800/60" />
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-64 rounded-xl bg-slate-800/60" />
                        <div className="h-64 rounded-xl bg-slate-800/60" />
                    </div>
                </div>
            )}

            {/* Content */}
            {data && !loading && (
                <div className="space-y-6">
                    {/* Company header card */}
                    <div className="rounded-xl p-6" style={containerStyle}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {data.company.logo_url && (
                                    <img
                                        src={data.company.logo_url}
                                        alt={data.company.name}
                                        className="h-12 w-12 rounded-lg object-contain bg-white/5 p-1"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                )}
                                <div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h2 className="text-2xl font-bold text-white">{data.company.name}</h2>
                                        <span className="text-muted-foreground font-mono text-lg">{data.company.ticker}</span>
                                        <ConsensusBadge rec={data.consensus.recommendation} />
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <Building2 className="h-3.5 w-3.5" />
                                            {data.company.sector}
                                        </span>
                                        <span>•</span>
                                        <span>{data.company.industry}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Globe className="h-3.5 w-3.5" />
                                            {data.company.country}
                                        </span>
                                        {data.company.employees && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3.5 w-3.5" />
                                                    {data.company.employees.toLocaleString()} employees
                                                </span>
                                            </>
                                        )}
                                        {data.company.website && (
                                            <a
                                                href={data.company.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                Website
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Price + analyst target */}
                            <div className="text-right">
                                <div className="text-4xl font-bold text-white">{fmtPrice(data.price.current_price)}</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Market Cap: <span className="text-white font-medium">{fmtLarge(data.price.market_cap)}</span>
                                </div>
                                {data.consensus.target_mean && (
                                    <div className="text-sm mt-0.5">
                                        Analyst Target: <span className="text-white font-medium">{fmtPrice(data.consensus.target_mean)}</span>
                                        {upside != null && (
                                            <span className={`ml-2 font-semibold ${upside >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                ({upside >= 0 ? "+" : ""}{upside.toFixed(1)}%)
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    52W: {fmtPrice(data.price.week_52_low)} — {fmtPrice(data.price.week_52_high)}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {data.company.description && (
                            <p className="mt-4 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                {data.company.description}
                            </p>
                        )}
                    </div>

                    {/* KPI grid — Valuation */}
                    <div>
                        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium flex items-center gap-2">
                            <BarChart2 className="h-3.5 w-3.5" />
                            Valuation
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                            <KpiCard label="P/E (TTM)" value={fmtNum(data.valuation.pe_trailing)} />
                            <KpiCard label="P/E (Fwd)" value={fmtNum(data.valuation.pe_forward)} />
                            <KpiCard label="PEG" value={fmtNum(data.valuation.peg)} />
                            <KpiCard label="P/S" value={fmtNum(data.valuation.ps_trailing)} />
                            <KpiCard label="P/B" value={fmtNum(data.valuation.pb)} />
                            <KpiCard label="EV/EBITDA" value={fmtNum(data.valuation.ev_ebitda)} />
                            <KpiCard label="EV/Revenue" value={fmtNum(data.valuation.ev_revenue)} />
                        </div>
                    </div>

                    {/* KPI grid — Profitability */}
                    <div>
                        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Profitability & Growth
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                            <KpiCard label="Gross Margin" value={fmtPct(data.margins.gross_margin)} trend={data.margins.gross_margin != null ? (data.margins.gross_margin > 0.3 ? "up" : "neutral") : undefined} />
                            <KpiCard label="Op. Margin" value={fmtPct(data.margins.operating_margin)} trend={data.margins.operating_margin != null ? (data.margins.operating_margin > 0.15 ? "up" : data.margins.operating_margin < 0 ? "down" : "neutral") : undefined} />
                            <KpiCard label="Net Margin" value={fmtPct(data.margins.net_margin)} trend={data.margins.net_margin != null ? (data.margins.net_margin > 0.1 ? "up" : data.margins.net_margin < 0 ? "down" : "neutral") : undefined} />
                            <KpiCard label="ROE" value={fmtPct(data.margins.roe)} trend={data.margins.roe != null ? (data.margins.roe > 0.15 ? "up" : data.margins.roe < 0 ? "down" : "neutral") : undefined} />
                            <KpiCard label="ROA" value={fmtPct(data.margins.roa)} />
                            <KpiCard label="Rev. Growth" value={fmtPct(data.margins.revenue_growth)} trend={data.margins.revenue_growth != null ? (data.margins.revenue_growth > 0 ? "up" : "down") : undefined} sub={data.margins.revenue_growth != null ? `YoY ${data.margins.revenue_growth >= 0 ? "+" : ""}${(data.margins.revenue_growth * 100).toFixed(1)}%` : undefined} />
                            <KpiCard label="Earn. Growth" value={fmtPct(data.margins.earnings_growth)} trend={data.margins.earnings_growth != null ? (data.margins.earnings_growth > 0 ? "up" : "down") : undefined} />
                        </div>
                    </div>

                    {/* KPI grid — Balance sheet */}
                    <div>
                        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium flex items-center gap-2">
                            <DollarSign className="h-3.5 w-3.5" />
                            Balance Sheet & Cash
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                            <KpiCard label="Debt/Equity" value={fmtNum(data.balance.debt_to_equity != null ? data.balance.debt_to_equity / 100 : null)} trend={data.balance.debt_to_equity != null ? (data.balance.debt_to_equity > 200 ? "down" : "neutral") : undefined} />
                            <KpiCard label="Current Ratio" value={fmtNum(data.balance.current_ratio)} trend={data.balance.current_ratio != null ? (data.balance.current_ratio >= 1.5 ? "up" : data.balance.current_ratio < 1 ? "down" : "neutral") : undefined} />
                            <KpiCard label="Quick Ratio" value={fmtNum(data.balance.quick_ratio)} />
                            <KpiCard label="Total Cash" value={fmtLarge(data.balance.total_cash)} />
                            <KpiCard label="Total Debt" value={fmtLarge(data.balance.total_debt)} />
                            <KpiCard label="Free CF" value={fmtLarge(data.balance.free_cashflow)} trend={data.balance.free_cashflow != null ? (data.balance.free_cashflow > 0 ? "up" : "down") : undefined} />
                            <KpiCard label="Beta" value={fmtNum(data.price.beta)} />
                        </div>
                    </div>

                    {/* Charts — Revenue & Net Income | EPS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue & Net Income chart */}
                        <div className="rounded-xl p-5" style={containerStyle}>
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <BarChart2 className="h-4 w-4 text-blue-400" />
                                Quarterly Revenue & Net Income (B$)
                            </h3>
                            {incomeChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={incomeChartData} barGap={2}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="quarter" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}B`} />
                                        <Tooltip content={<DarkTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                                        <Bar dataKey="Revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.85} />
                                        <Bar dataKey="Net Income" fill="#10b981" radius={[3, 3, 0, 0]} opacity={0.85} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">No quarterly income data available</div>
                            )}
                        </div>

                        {/* EPS chart */}
                        <div className="rounded-xl p-5" style={containerStyle}>
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-emerald-400" />
                                EPS — Actual vs Estimate
                            </h3>
                            {data.eps_history.length > 0 ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={data.eps_history} barGap={2}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="quarter" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                                        <Tooltip content={<DarkTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                                        <Bar dataKey="eps_estimate" name="Estimate" fill="#475569" radius={[3, 3, 0, 0]} opacity={0.7} />
                                        <Bar dataKey="eps_actual" name="Actual" radius={[3, 3, 0, 0]}>
                                            {data.eps_history.map((entry, index) => {
                                                const beat =
                                                    entry.eps_actual != null &&
                                                        entry.eps_estimate != null
                                                        ? entry.eps_actual >= entry.eps_estimate
                                                        : null;
                                                return (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={beat === true ? "#10b981" : beat === false ? "#ef4444" : "#3b82f6"}
                                                    />
                                                );
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">No EPS data available</div>
                            )}
                            <div className="flex items-center gap-4 mt-3">
                                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#10b981" }} />
                                    Beat estimate
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#ef4444" }} />
                                    Missed estimate
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#475569" }} />
                                    Estimate
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Margins chart */}
                    <div className="rounded-xl p-5" style={containerStyle}>
                        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-violet-400" />
                            Margin Trend (%)
                        </h3>
                        {marginChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={marginChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="quarter" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip content={<DarkTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                                    <Line type="monotone" dataKey="Gross Margin" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                                    <Line type="monotone" dataKey="Operating Margin" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                                    <Line type="monotone" dataKey="Net Margin" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No margin data available</div>
                        )}
                    </div>

                    {/* Analyst consensus detail */}
                    {(data.consensus.target_mean || data.consensus.analyst_count) && (
                        <div className="rounded-xl p-5" style={containerStyle}>
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-amber-400" />
                                Analyst Consensus ({data.consensus.analyst_count ?? "N/A"} analysts)
                            </h3>
                            <div className="flex flex-wrap gap-6 items-center">
                                <div className="flex items-center gap-3">
                                    <ConsensusBadge rec={data.consensus.recommendation} />
                                    <span className="text-muted-foreground text-sm">{data.consensus.recommendation?.toUpperCase()}</span>
                                </div>
                                <div className="flex gap-6 text-sm">
                                    <div>
                                        <div className="text-muted-foreground text-xs mb-0.5">Low Target</div>
                                        <div className="font-semibold text-white">{fmtPrice(data.consensus.target_low)}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-xs mb-0.5">Mean Target</div>
                                        <div className="font-semibold text-white">{fmtPrice(data.consensus.target_mean)}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-xs mb-0.5">High Target</div>
                                        <div className="font-semibold text-white">{fmtPrice(data.consensus.target_high)}</div>
                                    </div>
                                    {upside != null && (
                                        <div>
                                            <div className="text-muted-foreground text-xs mb-0.5">Upside (vs current)</div>
                                            <div className={`font-semibold ${upside >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                {upside >= 0 ? "+" : ""}{upside.toFixed(1)}%
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dividends (only if applicable) */}
                    {data.dividends.dividend_yield != null && (
                        <div className="rounded-xl p-5" style={containerStyle}>
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-yellow-400" />
                                Dividends
                            </h3>
                            <div className="flex gap-8 text-sm">
                                <div>
                                    <div className="text-muted-foreground text-xs mb-0.5">Yield</div>
                                    <div className="font-semibold text-white">{fmtPct(data.dividends.dividend_yield)}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground text-xs mb-0.5">Annual Rate</div>
                                    <div className="font-semibold text-white">{data.dividends.dividend_rate != null ? `$${data.dividends.dividend_rate.toFixed(2)}` : "N/A"}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground text-xs mb-0.5">Payout Ratio</div>
                                    <div className="font-semibold text-white">{fmtPct(data.dividends.payout_ratio)}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {!data && !loading && !error && (
                <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
                    <Building2 className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Enter a ticker to start analyzing</p>
                    <p className="text-sm mt-1">Try <strong>AAPL</strong>, <strong>AMZN</strong>, <strong>NVDA</strong>...</p>
                </div>
            )}
        </div>
    );
}
