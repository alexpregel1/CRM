"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@supabase/supabase-js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from "recharts";
import { Activity, TrendingUp, TrendingDown, Percent, ArrowDownToLine, Shield, LineChart, BarChart3, ShieldCheck, Info, PieChart as PieChartIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Rest of imports...

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// HARDCODED DEMO USER ID (Same as in Portfolio page)
const USER_ID = "00000000-0000-0000-0000-000000000001";

const BENCHMARKS = [
    { value: "SPY", label: "S&P 500 (SPY)" },
    { value: "QQQ", label: "Nasdaq 100 (QQQ)" },
    { value: "^IBEX", label: "IBEX 35" },
    { value: "URTH", label: "MSCI World (URTH)" },
    { value: "GLD", label: "Gold (GLD)" },
    { value: "BTC-USD", label: "Bitcoin" },
];

const PERIODS = [
    { value: "3m", label: "3M" },
    { value: "6m", label: "6M" },
    { value: "1y", label: "1Y" },
    { value: "2y", label: "2Y" },
    { value: "5y", label: "5Y" },
];

interface Transaction {
    id: string;
    type: string;
    quantity: number;
    price: number;
    date: string;
    portfolio_assets: { ticker: string };
}

interface ChartDataPoint {
    date: string;
    portfolio: number;
    benchmark: number | null;
    rawDate: number; // for sorting
}

export default function PortfolioMetricsPage() {
    const [period, setPeriod] = useState("1y");
    const [benchmark, setBenchmark] = useState("SPY");

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [assetHistory, setAssetHistory] = useState<Record<string, { date: string, close_eur: number }[]>>({});
    const [benchmarkHistory, setBenchmarkHistory] = useState<{ date: string, close_eur: number }[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    // 1. Fetch transactions
    useEffect(() => {
        async function fetchTx() {
            const { data, error } = await supabase
                .from("portfolio_transactions")
                .select(`
          id, type, quantity, price, date,
          portfolio_assets ( ticker )
        `)
                .eq("user_id", USER_ID)
                .order("date", { ascending: true });

            if (!error && data) {
                setTransactions(data as unknown as Transaction[]);
            }
        }
        fetchTx();
    }, []);

    // 2. Fetch history for all assets in portfolio + benchmark
    useEffect(() => {
        async function loadHistory() {
            setIsLoading(true);

            // Get unique tickers from transactions + the benchmark
            const tickers = new Set<string>();
            transactions.forEach(t => {
                if (t.portfolio_assets?.ticker && t.type !== "DEPOSIT" && t.type !== "WITHDRAWAL") {
                    tickers.add(t.portfolio_assets.ticker);
                }
            });

            // Fetch benchmark
            try {
                const res = await fetch(`/api/history?ticker=${encodeURIComponent(benchmark)}&period=${period}`);
                if (res.ok) setBenchmarkHistory(await res.json());
            } catch (e) {
                console.error("Failed to fetch benchmark", e);
            }

            // Fetch portfolio assets
            const histories: Record<string, any[]> = {};
            await Promise.all(
                Array.from(tickers).map(async (ticker) => {
                    try {
                        const res = await fetch(`/api/history?ticker=${encodeURIComponent(ticker)}&period=${period}`);
                        if (res.ok) histories[ticker] = await res.json();
                    } catch (e) {
                        console.error(`Failed to fetch ${ticker}`, e);
                    }
                })
            );
            setAssetHistory(histories);
            setIsLoading(false);
        }

        if (transactions.length > 0) {
            loadHistory();
        } else {
            setIsLoading(false); // No data state
        }
    }, [transactions, benchmark, period]);

    // 3. Calculate Equity Curve
    const chartData = useMemo(() => {
        if (transactions.length === 0 || benchmarkHistory.length === 0) return [];

        // Map benchmark dates as our base timeline
        // This gives us trading days only
        const timeline = benchmarkHistory.map(b => b.date);
        const startDateRaw = new Date(timeline[0]).getTime();

        // Fast lookup for benchmark prices
        const bMap = new Map(benchmarkHistory.map(b => [b.date, b.close_eur]));

        // Fast lookup for asset prices
        const aMap: Record<string, Map<string, number>> = {};
        for (const [ticker, history] of Object.entries(assetHistory)) {
            aMap[ticker] = new Map(history.map(h => [h.date, h.close_eur]));
        }

        // State trackers
        let cash = 0;
        const holdings: Record<string, number> = {};
        const processedTxIds = new Set<string>();

        const data: ChartDataPoint[] = [];

        // Step through each day in the timeline
        for (const date of timeline) {
            const currentDayRaw = new Date(date).getTime();

            // Process any transactions that happened ON or BEFORE this day 
            // (that haven't been processed yet)
            const txsToProcess = transactions.filter(t => {
                const tTime = new Date(t.date).getTime();
                return tTime <= currentDayRaw && !processedTxIds.has(t.id);
            });

            for (const t of txsToProcess) {
                processedTxIds.add(t.id);
                const ticker = t.portfolio_assets?.ticker;

                // Note: price in transactions might be in USD, but since we don't have historical
                // FX at the exact transaction millisecond easily available client-side without more API calls,
                // we approximate cash impact using the transaction price directly. 
                // For a true multi-currency accounting, all transactions should store their EUR equivalent value.
                // Assuming transactions.total_amount is in EUR base currency for this demo, or we fallback to quantity * price.
                const amount = (t as any).total_amount || (t.quantity * t.price);

                if (t.type === "DEPOSIT") cash += amount;
                if (t.type === "WITHDRAWAL") cash -= amount;
                if (t.type === "BUY" && ticker) {
                    cash -= amount;
                    holdings[ticker] = (holdings[ticker] || 0) + t.quantity;
                }
                if (t.type === "SELL" && ticker) {
                    cash += amount;
                    holdings[ticker] = (holdings[ticker] || 0) - t.quantity;
                }
                // Dividends/Interest
                if (t.type === "DIVIDEND" || t.type === "INTEREST") {
                    cash += amount;
                }
            }

            // Calculate portfolio value for this day
            let portfolioValue = cash;
            for (const [ticker, qty] of Object.entries(holdings)) {
                if (qty > 0) {
                    // Try to get price for exact date, fallback to last known close if missing/stale
                    // Note: A robust system would keep a running "last known price" cache.
                    let price = aMap[ticker]?.get(date);

                    if (price === undefined) {
                        // Basic fallback: find the closest previous date in history
                        const hist = assetHistory[ticker] || [];
                        const validHists = hist.filter(h => new Date(h.date).getTime() <= currentDayRaw);
                        if (validHists.length > 0) price = validHists[validHists.length - 1].close_eur;
                    }

                    if (price !== undefined) {
                        portfolioValue += qty * price;
                    } else {
                        // Fallback to average cost basis if absolutely no history exists yet
                        portfolioValue += 0; // Skip if no price
                    }
                }
            }

            data.push({
                date,
                rawDate: currentDayRaw,
                portfolio: portfolioValue,
                benchmark: bMap.get(date) || null
            });
        }

        // Normalize to 100 on the first valid day
        let firstValidP: number | null = null;
        let firstValidB: number | null = null;

        return data.map(d => {
            // Find base values
            if (firstValidP === null && d.portfolio > 0) firstValidP = d.portfolio;
            if (firstValidB === null && d.benchmark !== null) firstValidB = d.benchmark;

            return {
                ...d,
                portfolioBase100: firstValidP && d.portfolio > 0 ? (d.portfolio / firstValidP) * 100 : 100,
                benchmarkBase100: firstValidB && d.benchmark !== null ? (d.benchmark / firstValidB) * 100 : 100,
            };
        });

    }, [transactions, assetHistory, benchmarkHistory]);

    // 4. Calculate KPIs & Advanced Metrics
    const kpis = useMemo(() => {
        if (chartData.length < 2) return null;

        // Total Return
        const first = chartData.find(d => (d as any).portfolioBase100 > 0) as any;
        const last = chartData[chartData.length - 1] as any;

        if (!first || !last) return null;

        const portRet = (last.portfolioBase100 - 100) / 100;
        const benchRet = (last.benchmarkBase100 - 100) / 100;
        const alpha = portRet - benchRet;

        // Daily Returns for advanced metrics
        const dailyReturns: number[] = [];
        let previousValidVal = first.portfolioBase100;

        for (let i = 1; i < chartData.length; i++) {
            const currentVal = (chartData[i] as any).portfolioBase100;
            if (currentVal > 0 && previousValidVal > 0) {
                dailyReturns.push((currentVal - previousValidVal) / previousValidVal);
            }
            if (currentVal > 0) {
                previousValidVal = currentVal;
            }
        }

        // Volatility (Annualized)
        // std_dev * sqrt(252 trading days)
        const meanReturn = dailyReturns.length > 0 ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length : 0;
        const variance = dailyReturns.length > 0 ? dailyReturns.reduce((acc, val) => acc + Math.pow(val - meanReturn, 2), 0) / dailyReturns.length : 0;
        const dailyVolatility = Math.sqrt(variance);
        const annualizedVolatility = dailyVolatility * Math.sqrt(252);

        // Sharpe Ratio (Assuming Risk-Free Rate = 0% for simplicity in this calculation, though ideally ~3-4%)
        // Annualized Return / Annualized Volatility
        // Let's approximate annualized return based on total return and days
        const daysElapsed = (last.rawDate - first.rawDate) / (1000 * 60 * 60 * 24);
        const yearsElapsed = daysElapsed / 365.25;
        const annualizedReturn = yearsElapsed > 0 ? Math.pow(1 + portRet, 1 / yearsElapsed) - 1 : portRet;

        const sharpeRatio = annualizedVolatility > 0 ? annualizedReturn / annualizedVolatility : 0;

        // Sortino Ratio (Downside Deviation instead of Total Volatility)
        const negativeReturns = dailyReturns.filter(r => r < 0);
        const downsideVariance = negativeReturns.length > 0 ? negativeReturns.reduce((acc, val) => acc + Math.pow(val, 2), 0) / dailyReturns.length : 0;
        const annualizedDownsideVol = Math.sqrt(downsideVariance) * Math.sqrt(252);
        const sortinoRatio = annualizedDownsideVol > 0 ? annualizedReturn / annualizedDownsideVol : 0;

        // Max Drawdown (Portfolio)
        let maxDrawdown = 0;
        let peak = 0;
        for (const d of chartData) {
            const val = (d as any).portfolioBase100;
            if (val > peak) peak = val;
            const dd = (peak - val) / peak;
            if (dd > maxDrawdown) maxDrawdown = dd;
        }

        // Calmar Ratio
        const calmarRatio = Math.abs(maxDrawdown) > 0 ? annualizedReturn / Math.abs(maxDrawdown) : null;

        return {
            portfolioReturn: portRet,
            benchmarkReturn: benchRet,
            alpha,
            maxDrawdown,
            annualizedReturn,
            annualizedVolatility,
            sharpeRatio,
            sortinoRatio,
            calmarRatio
        };

    }, [chartData]);

    // 5. Calculate Allocation for Pie Chart
    const allocationData = useMemo(() => {
        if (transactions.length === 0) return [];

        let cash = 0;
        const currentHoldings: Record<string, { quantity: number; cost: number }> = {};

        for (const t of transactions) {
            const amount = (t as any).total_amount || (t.quantity * t.price);
            const ticker = t.portfolio_assets?.ticker;

            if (t.type === "DEPOSIT") cash += amount;
            if (t.type === "WITHDRAWAL") cash -= amount;
            if (t.type === "BUY" && ticker) {
                cash -= amount;
                if (!currentHoldings[ticker]) currentHoldings[ticker] = { quantity: 0, cost: 0 };
                currentHoldings[ticker].quantity += t.quantity;
                currentHoldings[ticker].cost += amount;
            }
            if (t.type === "SELL" && ticker) {
                cash += amount;
                if (!currentHoldings[ticker]) currentHoldings[ticker] = { quantity: 0, cost: 0 };
                const avg = currentHoldings[ticker].quantity > 0 ? currentHoldings[ticker].cost / currentHoldings[ticker].quantity : 0;
                currentHoldings[ticker].quantity -= t.quantity;
                currentHoldings[ticker].cost = currentHoldings[ticker].quantity * avg;
            }
            if (t.type === "DIVIDEND" || t.type === "INTEREST") cash += amount;
        }

        const data: { name: string; value: number; fill?: string; quantity: number }[] = [];
        const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#14b8a6", "#f43f5e", "#d946ef"];
        let colorIdx = 0;

        for (const [ticker, h] of Object.entries(currentHoldings)) {
            if (h.quantity > 0) {
                const hist = assetHistory[ticker] || [];
                const lastPrice = hist.length > 0 ? hist[hist.length - 1].close_eur : 0;
                const val = h.quantity * lastPrice;
                if (val > 0) {
                    data.push({ name: ticker, value: val, quantity: h.quantity, fill: COLORS[colorIdx % COLORS.length] });
                    colorIdx++;
                }
            }
        }

        if (cash > 0) {
            data.push({ name: "CASH", value: cash, quantity: cash, fill: "rgba(255,255,255,0.2)" });
        }

        return data.sort((a, b) => b.value - a.value);
    }, [transactions, assetHistory]);

    return (
        <div className="min-h-screen bg-background text-foreground p-6 font-sans selection:bg-primary/30 pb-20">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Portfolio Metrics</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Performance analytics and benchmark comparison
                    </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                    {/* Period segmented control */}
                    <div className="flex items-center p-1 rounded-full bg-secondary/50 border border-white/5 backdrop-blur-sm">
                        {PERIODS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                disabled={isLoading}
                                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${period === p.value
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5 disabled:opacity-50"
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Benchmark Selector */}
                    <Select value={benchmark} onValueChange={setBenchmark} disabled={isLoading}>
                        <SelectTrigger className="w-[180px] bg-secondary/30 border-white/10 rounded-full h-9 text-xs font-medium">
                            <SelectValue placeholder="Select benchmark" />
                        </SelectTrigger>
                        <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl shadow-2xl">
                            {BENCHMARKS.map(b => (
                                <SelectItem key={b.value} value={b.value} className="text-xs cursor-pointer focus:bg-primary/20 focus:text-primary">
                                    {b.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-card/40 backdrop-blur-sm border-white/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Total Return
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-9 bg-white/5 animate-pulse rounded w-24"></div>
                        ) : (
                            <>
                                <div className={`text-3xl font-bold ${kpis?.portfolioReturn && kpis.portfolioReturn > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {kpis ? `${(kpis.portfolioReturn * 100).toFixed(2)}%` : "0.00%"}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Over selected period
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-sm border-white/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                            <Activity className="w-4 h-4" /> vs Benchmark
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-9 bg-white/5 animate-pulse rounded w-24"></div>
                        ) : (
                            <>
                                <div className={`text-3xl font-bold ${kpis?.alpha && kpis.alpha > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {kpis && kpis.alpha > 0 ? "+" : ""}{kpis ? `${(kpis.alpha * 100).toFixed(2)}%` : "0.00%"}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Active Return (Alpha)
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-sm border-white/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-red-500" /> Max Drawdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-9 bg-white/5 animate-pulse rounded w-24"></div>
                        ) : (
                            <>
                                <div className="text-3xl font-bold text-red-500">
                                    {kpis ? `-${(kpis.maxDrawdown * 100).toFixed(2)}%` : "0.00%"}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Peak-to-trough decline
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-sm border-white/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                            <Percent className="w-4 h-4 text-amber-500" /> Benchmark Ret
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-9 bg-white/5 animate-pulse rounded w-24"></div>
                        ) : (
                            <>
                                <div className={`text-3xl font-bold ${kpis?.benchmarkReturn && kpis.benchmarkReturn > 0 ? 'text-green-500/70' : 'text-red-500/70'}`}>
                                    {kpis ? `${(kpis.benchmarkReturn * 100).toFixed(2)}%` : "0.00%"}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {BENCHMARKS.find(b => b.value === benchmark)?.label}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Advanced Metrics / Risk Profile */}
            <h2 className="text-xl font-bold tracking-tight mb-4 mt-8 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Risk Analysis & Ratios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Volatility */}
                <Card className="bg-card/40 backdrop-blur-sm border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-400" /> Ann Volatility
                        </CardTitle>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-4 h-4 text-muted-foreground/50 hover:text-white transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent
                                className="w-80 p-4 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 rounded-xl"
                                style={{
                                    background: "linear-gradient(135deg, rgba(14,31,74,0.9) 0%, rgba(4,8,22,0.95) 100%)",
                                    backdropFilter: "blur(20px)",
                                    WebkitBackdropFilter: "blur(20px)"
                                }}
                            >
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-blue-400 flex items-center gap-2 text-sm">
                                        <Activity className="w-4 h-4" /> Annualized Volatility
                                    </h4>
                                    <p className="text-xs text-white/80 leading-relaxed font-normal">
                                        Mide la dispersión estadística de los rendimientos diarios. Una mayor volatilidad indica
                                        un rango más amplio de fluctuación en el valor del portfolio, es decir, mayor riesgo y
                                        movimientos más bruscos.
                                    </p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-9 bg-white/5 animate-pulse rounded w-24"></div>
                        ) : (
                            <>
                                <div className="text-3xl font-bold text-white">
                                    {kpis && kpis.annualizedVolatility !== undefined ? `${(kpis.annualizedVolatility * 100).toFixed(2)}%` : "N/A"}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Sharpe Ratio */}
                <Card className="bg-card/40 backdrop-blur-sm border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                            <LineChart className="w-4 h-4 text-emerald-400" /> Sharpe Ratio
                        </CardTitle>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-4 h-4 text-muted-foreground/50 hover:text-white transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent
                                className="w-80 p-4 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 rounded-xl"
                                style={{
                                    background: "linear-gradient(135deg, rgba(14,31,74,0.9) 0%, rgba(4,8,22,0.95) 100%)",
                                    backdropFilter: "blur(20px)",
                                    WebkitBackdropFilter: "blur(20px)"
                                }}
                            >
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-emerald-400 flex items-center gap-2 text-sm">
                                        <LineChart className="w-4 h-4" /> Ratio de Sharpe
                                    </h4>
                                    <p className="text-xs text-white/80 leading-relaxed font-normal">
                                        Calcula el rendimiento ajustado al riesgo (Retorno / Volatilidad). Te dice
                                        cuánto rendimiento estás consiguiendo por cada unidad de riesgo asumida.
                                    </p>
                                    <ul className="text-[11px] text-muted-foreground space-y-1 mt-2 list-disc pl-4">
                                        <li><strong className="text-emerald-400/80">{">"} 1.0:</strong> Bueno. Riesgo bien recompensado.</li>
                                        <li><strong className="text-white/80">{"<"} 1.0:</strong> Subóptimo. Asumes demasiada volatilidad.</li>
                                    </ul>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-9 bg-white/5 animate-pulse rounded w-24"></div>
                        ) : (
                            <>
                                <div className={`text-3xl font-bold ${typeof kpis?.sharpeRatio === 'number' && kpis.sharpeRatio > 1 ? 'text-emerald-500' : 'text-white'}`}>
                                    {typeof kpis?.sharpeRatio === 'number' ? kpis.sharpeRatio.toFixed(2) : "N/A"}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Sortino Ratio */}
                <Card className="bg-card/40 backdrop-blur-sm border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-indigo-400" /> Sortino Ratio
                        </CardTitle>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-4 h-4 text-muted-foreground/50 hover:text-white transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent
                                className="w-80 p-4 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 rounded-xl"
                                style={{
                                    background: "linear-gradient(135deg, rgba(14,31,74,0.9) 0%, rgba(4,8,22,0.95) 100%)",
                                    backdropFilter: "blur(20px)",
                                    WebkitBackdropFilter: "blur(20px)"
                                }}
                            >
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-indigo-400 flex items-center gap-2 text-sm">
                                        <BarChart3 className="w-4 h-4" /> Ratio de Sortino
                                    </h4>
                                    <p className="text-xs text-white/80 leading-relaxed font-normal">
                                        Similar al Sharpe, pero <strong>solo penaliza la volatilidad bajista</strong> (Downside Deviation).
                                        Ignora los picos hacia arriba porque la volatilidad positiva es buena para el portfolio.
                                    </p>
                                    <ul className="text-[11px] text-muted-foreground space-y-1 mt-2 list-disc pl-4">
                                        <li>Idealmente debe ser superior al Sharpe.</li>
                                        <li><strong className="text-indigo-400/80">{">"} 2.0:</strong> Excelente control del riesgo a la baja.</li>
                                    </ul>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-9 bg-white/5 animate-pulse rounded w-24"></div>
                        ) : (
                            <>
                                <div className={`text-3xl font-bold ${typeof kpis?.sortinoRatio === 'number' && kpis.sortinoRatio > 2 ? 'text-indigo-400' : 'text-white'}`}>
                                    {typeof kpis?.sortinoRatio === 'number' ? kpis.sortinoRatio.toFixed(2) : "N/A"}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Calmar Ratio */}
                <Card className="bg-card/40 backdrop-blur-sm border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-500" /> Calmar Ratio
                        </CardTitle>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-4 h-4 text-muted-foreground/50 hover:text-white transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent
                                className="w-80 p-4 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 rounded-xl"
                                style={{
                                    background: "linear-gradient(135deg, rgba(14,31,74,0.9) 0%, rgba(4,8,22,0.95) 100%)",
                                    backdropFilter: "blur(20px)",
                                    WebkitBackdropFilter: "blur(20px)"
                                }}
                            >
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-amber-500 flex items-center gap-2 text-sm">
                                        <ShieldCheck className="w-4 h-4" /> Ratio de Calmar
                                    </h4>
                                    <p className="text-xs text-white/80 leading-relaxed font-normal">
                                        Mide el rendimiento en relación con el <strong>Max Drawdown</strong> (peor caída).
                                        Evalúa si la ganancia justifica los sustos (caídas severas) sufridos en el camino.
                                    </p>
                                    <ul className="text-[11px] text-muted-foreground space-y-1 mt-2 list-disc pl-4">
                                        <li><strong className="text-amber-500/80">{">"} 3.0:</strong> Excepcional.</li>
                                        <li><strong className="text-white/80">1.0 a 3.0:</strong> Muy bueno.</li>
                                    </ul>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-9 bg-white/5 animate-pulse rounded w-24"></div>
                        ) : (
                            <>
                                <div className={`text-3xl font-bold ${typeof kpis?.calmarRatio === 'number' && kpis.calmarRatio > 1 ? 'text-amber-500' : 'text-white'}`}>
                                    {typeof kpis?.calmarRatio === 'number' ? kpis.calmarRatio.toFixed(2) : "N/A"}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Main Chart and Allocation */}
            {/* Main Chart and Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Equity Curve */}
                <Card className="bg-card/40 backdrop-blur-sm border-white/5 h-[500px] flex flex-col lg:col-span-2">
                    <CardHeader className="border-b border-white/5 bg-secondary/30 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                Equity Curve <span className="text-sm font-normal text-muted-foreground">(Base 100)</span>
                                {isLoading && <span className="text-xs font-normal text-primary flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Calculating...</span>}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-xs font-medium">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                                    <span className="text-white">Portfolio</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
                                    <span className="text-muted-foreground">{BENCHMARKS.find(b => b.value === benchmark)?.label}</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 pt-6 pr-6">
                        {!isLoading && chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsLineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="rgba(255,255,255,0.2)"
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                                        tickMargin={10}
                                        minTickGap={50}
                                    />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        stroke="rgba(255,255,255,0.2)"
                                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                                        tickFormatter={(v) => v.toFixed(0)}
                                        width={50}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(10,18,42,0.95)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                                        }}
                                        itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                                        labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}
                                        formatter={(value: number, name: string) => [
                                            value.toFixed(2),
                                            name === "portfolioBase100" ? "Portfolio" : "Benchmark"
                                        ]}
                                        labelFormatter={(label) => label}
                                    />
                                    <ReferenceLine y={100} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />

                                    <Line
                                        type="monotone"
                                        dataKey="benchmarkBase100"
                                        stroke="#f59e0b" // amber-500
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, fill: "#f59e0b", stroke: "rgba(0,0,0,0.5)" }}
                                        isAnimationActive={true}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="portfolioBase100"
                                        stroke="#3b82f6" // blue-500
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6, fill: "#3b82f6", stroke: "rgba(0,0,0,0.5)" }}
                                        isAnimationActive={true}
                                    />
                                </RechartsLineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
                                {isLoading ? (
                                    <>
                                        <div className="w-8 h-8 rounded-full border-t-2 border-primary animate-spin mb-4" />
                                        <p className="text-sm">Fetching historical data and computing equity curve...</p>
                                    </>
                                ) : (
                                    <p className="text-sm">Not enough data to compute metrics.</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Allocation Pie Chart */}
                <Card className="bg-card/40 backdrop-blur-sm border-white/5 h-[500px] flex flex-col">
                    <CardHeader className="border-b border-white/5 bg-secondary/30 pb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <PieChartIcon className="w-4 h-4 text-blue-400" /> Current Allocation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 flex flex-col items-center justify-center relative">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                <Activity className="w-8 h-8 animate-pulse" />
                            </div>
                        ) : allocationData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="60%">
                                    <PieChart>
                                        <Pie
                                            data={allocationData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {allocationData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            formatter={(value: number, name: string) => [
                                                `€${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                                name
                                            ]}
                                            contentStyle={{
                                                backgroundColor: "rgba(10, 15, 30, 0.95)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: "8px",
                                                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                                                color: "#fff"
                                            }}
                                            itemStyle={{ color: "#fff", fontWeight: "bold" }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Legend Grid */}
                                <div className="w-full mt-4 h-[35%] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {allocationData.map((item, idx) => {
                                        const total = allocationData.reduce((acc, curr) => acc + curr.value, 0);
                                        const pct = (item.value / total) * 100;
                                        return (
                                            <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-white/5 last:border-0 hover:bg-white/5 rounded px-2 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                                                    <span className="font-semibold">{item.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-muted-foreground font-mono">€{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                    <span className="font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded text-white min-w-[3rem] text-right">
                                                        {pct.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
                                No open positions actively tracked.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 text-center text-xs text-muted-foreground/50">
                Note: The equity curve calculates daily portfolio value using End-of-Day (EOD) prices for assets held based on your transaction history.
                Cash balances are approximated using the transaction amounts. Does not account for precise intraday execution prices or true multi-currency cash sweeps.
            </div>
        </div>
    );
}
