"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Wallet, TrendingUp, Activity, PieChart, Plus, RefreshCw, ArrowUpRight,
    ArrowDownRight, TrendingDown, Trash2,
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader,
    DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TickerInput } from "@/components/ticker-input";

const USER_ID = "00000000-0000-0000-0000-000000000001";

type Transaction = {
    id: string;
    type: string;
    quantity: number;
    price: number;
    total_amount: number;
    date: string;
    notes: string;
    portfolio_assets: { ticker: string; name: string; is_manual?: boolean; manual_price?: number } | null;
};

type AssetHolding = {
    ticker: string;
    name: string;
    quantity: number;
    avgCost: number;
    totalCost: number;
    currentPrice: number;      // native currency (e.g. USD)
    currentPriceEur: number;   // converted to EUR
    currentValue: number;      // EUR
    pnl: number;               // EUR
    pnlPct: number;
    change: number;            // native currency daily change
    changeEur: number;         // EUR daily change
    changePct: number;
    currency: string;          // "USD" or "EUR"
    eurusd: number;
    is_manual?: boolean;
    manual_price?: number;
};

type QuoteMap = Record<string, {
    price: number;
    price_eur: number;
    change: number;
    change_eur: number;
    changePct: number;
    currency: string;
    eurusd: number;
}>;

const TABS = ["assets", "transactions"] as const;
type Tab = typeof TABS[number];

// ─── iOS-style Segmented Control ─────────────────────────────────────────────
function SegmentedControl({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const idx = TABS.indexOf(value);
        const btn = container.querySelectorAll("button")[idx] as HTMLButtonElement | null;
        if (btn) {
            setPillStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
        }
    }, [value]);

    return (
        <div
            ref={containerRef}
            className="relative flex items-center p-1 border border-white/[0.10]"
            style={{ display: "inline-flex", borderRadius: 999, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        >
            {/* Frosted navy-glass sliding pill */}
            <span
                className="absolute top-1 bottom-1 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                    left: pillStyle.left,
                    width: pillStyle.width,
                    borderRadius: 999,
                    background: "linear-gradient(135deg, rgba(37,99,235,0.35) 0%, rgba(14,31,74,0.6) 100%)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: "inset 0 1px 0 rgba(100,160,255,0.2), 0 1px 12px rgba(37,99,235,0.3)",
                    border: "1px solid rgba(59,130,246,0.3)",
                }}
            />
            {TABS.map((tab) => (
                <button
                    key={tab}
                    onClick={() => onChange(tab)}
                    style={{ borderRadius: 999 }}
                    className={`relative z-10 px-6 py-2 text-sm font-medium capitalize transition-colors duration-200 select-none ${value === tab ? "text-white" : "text-muted-foreground/70 hover:text-muted-foreground"
                        }`}
                >
                    {tab === "assets" ? "Assets" : "Transactions"}
                </button>
            ))}
        </div>
    );
}

// ─── Slide transition wrapper ─────────────────────────────────────────────────
function SlidePanel({ active, id, children }: { active: Tab; id: Tab; children: React.ReactNode }) {
    const isActive = active === id;
    const isLeft = TABS.indexOf(id) < TABS.indexOf(active);
    return (
        <div
            className="absolute inset-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
            style={{
                opacity: isActive ? 1 : 0,
                transform: isActive
                    ? "translateX(0) scale(1)"
                    : `translateX(${isLeft ? "-3%" : "3%"}) scale(0.98)`,
                pointerEvents: isActive ? "auto" : "none",
            }}
        >
            {children}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
    const [activeTab, setActiveTab] = useState<Tab>("assets");
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [holdings, setHoldings] = useState<AssetHolding[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshingPrices, setRefreshingPrices] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const [totalDeposits, setTotalDeposits] = useState(0);
    const [cashBalance, setCashBalance] = useState(0);
    const [assetsValue, setAssetsValue] = useState(0);
    const [totalPnl, setTotalPnl] = useState(0);
    const [totalPnlPct, setTotalPnlPct] = useState(0);

    // Form
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState("DEPOSIT");
    const [amount, setAmount] = useState("");
    const [quantity, setQuantity] = useState("");
    const [price, setPrice] = useState("");
    const [ticker, setTicker] = useState("");
    const [notes, setNotes] = useState("");
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
    const [submitting, setSubmitting] = useState(false);
    const [isFetchingPrice, setIsFetchingPrice] = useState(false);
    const [isManual, setIsManual] = useState(false);
    const [updatingManualAsset, setUpdatingManualAsset] = useState<string | null>(null);
    const [manualPriceInput, setManualPriceInput] = useState<string>("");

    // Auto-fetch historical price when date, ticker, or type changes
    useEffect(() => {
        if (!ticker || !transactionDate || type === "DEPOSIT" || type === "WITHDRAWAL") return;
        if (isManual) return; // Skip fetch for manual assets

        const fetchHistoryPrice = async () => {
            setIsFetchingPrice(true);
            try {
                // Fetch daily close for the last 1 year to ensure we find a valid trading day near the date
                const res = await fetch(`/api/history?ticker=${ticker}&period=1y`);
                if (res.ok) {
                    const data = await res.json();
                    if (!data || data.length === 0) return;

                    // Find the price for the specific date, or the closest previous date
                    const targetTime = new Date(transactionDate).getTime();
                    let closestPrice = 0;
                    let minDiff = Infinity;

                    for (const item of data) {
                        const itemTime = new Date(item.date).getTime();
                        if (itemTime <= targetTime) {
                            const diff = targetTime - itemTime;
                            if (diff < minDiff) {
                                minDiff = diff;
                                closestPrice = item.close_eur; // Assuming we want EUR price for the form
                            }
                        }
                    }

                    if (closestPrice > 0) {
                        setPrice(closestPrice.toFixed(2));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch historical price", error);
            } finally {
                setIsFetchingPrice(false);
            }
        };

        const timeoutId = setTimeout(fetchHistoryPrice, 500); // debounce
        return () => clearTimeout(timeoutId);
    }, [ticker, transactionDate, type, isManual]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from("portfolio_transactions")
            .select("*, portfolio_assets(ticker, name, is_manual, manual_price)")
            .eq("user_id", USER_ID)
            .order("date", { ascending: false });

        if (data) {
            setTransactions(data);
            const { rawHoldings, deposits, cash } = buildHoldings(data);
            setTotalDeposits(deposits);
            setCashBalance(cash);
            await fetchPrices(rawHoldings);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    function buildHoldings(txs: Transaction[]) {
        let deposits = 0, cash = 0;
        const map: Record<string, { quantity: number; totalCost: number; ticker: string; name: string; is_manual?: boolean; manual_price?: number }> = {};

        txs.forEach((tx) => {
            const amt = Number(tx.total_amount);
            if (tx.type === "DEPOSIT") { deposits += amt; cash += amt; }
            else if (tx.type === "WITHDRAWAL") { deposits -= amt; cash -= amt; }
            else if (tx.type === "BUY") {
                cash -= amt;
                const k = tx.portfolio_assets?.ticker ?? "UNKNOWN";
                if (!map[k]) map[k] = {
                    quantity: 0,
                    totalCost: 0,
                    ticker: k,
                    name: tx.portfolio_assets?.name ?? k,
                    is_manual: tx.portfolio_assets?.is_manual ?? false,
                    manual_price: tx.portfolio_assets?.manual_price ?? 0
                };
                map[k].quantity += Number(tx.quantity);
                map[k].totalCost += amt;
            } else if (tx.type === "SELL") {
                cash += amt;
                const k = tx.portfolio_assets?.ticker ?? "UNKNOWN";
                if (map[k]) {
                    const avgCost = map[k].totalCost / map[k].quantity;
                    map[k].quantity -= Number(tx.quantity);
                    map[k].totalCost = map[k].quantity * avgCost;
                    if (map[k].quantity <= 0) delete map[k];
                }
            } else if (tx.type === "DIVIDEND" || tx.type === "INTEREST") {
                cash += amt;
            }
        });
        return { rawHoldings: Object.values(map), deposits, cash };
    }

    async function fetchPrices(rawHoldings: { ticker: string; name: string; quantity: number; totalCost: number; is_manual?: boolean; manual_price?: number }[]) {
        if (!rawHoldings.length) {
            setHoldings([]);
            setAssetsValue(0);
            setTotalPnl(0);
            setTotalPnlPct(0);
            return;
        }
        setRefreshingPrices(true);
        try {
            const tickers = rawHoldings.filter(h => !h.is_manual).map((h) => h.ticker).join(",");
            const res = tickers ? await fetch(`/api/quotes?tickers=${tickers}`) : null;
            const quotes: QuoteMap = res && res.ok ? await res.json() : {};

            let totalVal = 0, totalCostAll = 0;
            const enriched: AssetHolding[] = rawHoldings.map((h) => {
                let currentPriceEur = 0;
                let currentPrice = 0;
                let q = quotes[h.ticker];

                if (h.is_manual) {
                    currentPriceEur = h.manual_price || 0;
                    currentPrice = currentPriceEur; // Manual assets assumed EUR for now
                } else if (q) {
                    currentPriceEur = q.price_eur ?? 0;
                    currentPrice = q.price ?? 0;
                }

                const currentValue = h.quantity * currentPriceEur;   // EUR
                const avgCost = h.quantity > 0 ? h.totalCost / h.quantity : 0;  // EUR (stored as entered)
                const pnl = currentValue - h.totalCost;
                const pnlPct = h.totalCost > 0 ? (pnl / h.totalCost) * 100 : 0;
                totalVal += currentValue;
                totalCostAll += h.totalCost;
                return {
                    ...h,
                    avgCost,
                    currentPrice,
                    currentPriceEur,
                    currentValue,
                    pnl,
                    pnlPct,
                    change: q?.change ?? 0,
                    changeEur: q?.change_eur ?? 0,
                    changePct: q?.changePct ?? 0,
                    currency: q?.currency ?? "EUR", // Default EUR for manual
                    eurusd: q?.eurusd ?? 1.08,
                    is_manual: h.is_manual || false
                };
            });

            setHoldings(enriched);
            setAssetsValue(totalVal);
            const pnl = totalVal - totalCostAll;
            setTotalPnl(pnl);
            setTotalPnlPct(totalCostAll > 0 ? (pnl / totalCostAll) * 100 : 0);
            setLastUpdated(new Date());
        } finally {
            setRefreshingPrices(false);
        }
    }

    const handleRefresh = async () => {
        const { data } = await supabase
            .from("portfolio_transactions")
            .select("*, portfolio_assets(ticker, name, is_manual, manual_price)")
            .eq("user_id", USER_ID)
            .order("date", { ascending: false });
        if (data) {
            const { rawHoldings } = buildHoldings(data);
            await fetchPrices(rawHoldings);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        let finalAssetId = null, finalAmount = 0, finalQuantity = 1, finalPrice = 0;

        if (type === "BUY" || type === "SELL") {
            finalQuantity = parseFloat(quantity);
            finalPrice = parseFloat(price);
            finalAmount = finalQuantity * finalPrice;
            if (isNaN(finalAmount) || finalAmount <= 0 || !ticker) return setSubmitting(false);
            const tckr = ticker.toUpperCase().trim();
            // Include `name` to search properly if it's manual, or just use ticker
            let { data: assetData } = await supabase.from("portfolio_assets").select("id").eq("ticker", tckr).single();
            if (!assetData) {
                const { data: newAsset } = await supabase.from("portfolio_assets").insert({
                    ticker: tckr,
                    name: tckr,
                    asset_class: isManual ? "Fund" : "Stock",
                    is_manual: isManual,
                    manual_price: isManual ? finalPrice : 0
                }).select("id").single();
                assetData = newAsset;
            } else if (isManual) {
                // If the asset exists and user is entering a new manual BUY, we generally update the manual_price
                // but there's a specialized "Update Price" button for this. For now we assume the BUY price is the latest if no other mechanism exists, or we just leave it.
                await supabase.from("portfolio_assets").update({ manual_price: finalPrice, is_manual: true }).eq("id", assetData.id);
            }
            if (assetData) finalAssetId = assetData.id;
        } else {
            finalAmount = parseFloat(amount);
            if (isNaN(finalAmount) || finalAmount <= 0) return setSubmitting(false);
            finalPrice = finalAmount;
        }

        const { error } = await supabase.from("portfolio_transactions").insert({
            user_id: USER_ID, asset_id: finalAssetId, type,
            total_amount: finalAmount, quantity: finalQuantity, price: finalPrice, notes: notes || null,
            date: new Date(transactionDate).toISOString()
        });

        if (!error) {
            setIsOpen(false);
            setAmount(""); setQuantity(""); setPrice(""); setTicker(""); setNotes("");
            setIsManual(false);
            setTransactionDate(new Date().toISOString().split("T")[0]);
            fetchData();
        }
        setSubmitting(false);
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!confirm("Are you sure you want to delete this transaction? This action cannot be undone and will affect your portfolio history.")) return;

        try {
            const { error } = await supabase
                .from('portfolio_transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Re-fetch data
            await fetchData();
        } catch (err: any) {
            console.error("Error deleting transaction:", err);
            alert("Failed to delete transaction.");
        }
    };

    const handleUpdateManualPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!updatingManualAsset) return;
        const newPrice = parseFloat(manualPriceInput);
        if (isNaN(newPrice) || newPrice < 0) return;

        setSubmitting(true);
        const { error } = await supabase
            .from("portfolio_assets")
            .update({ manual_price: newPrice })
            .eq("ticker", updatingManualAsset)
            .eq("is_manual", true);

        setSubmitting(false);
        if (!error) {
            setUpdatingManualAsset(null);
            setManualPriceInput("");
            fetchData();
        } else {
            console.error("Failed to update manual price", error);
        }
    };

    const fmt = (n: number, d = 2) => n.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });

    const isAssetsTab = activeTab === "assets";

    return (
        <div className="p-6 min-h-screen">
            {/* Header */}
            <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Personal Portfolio</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Net worth & active positions
                        {lastUpdated && (
                            <span className="ml-2 text-xs text-muted-foreground/60">
                                · Updated {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshingPrices}
                        className="rounded-full px-5 text-muted-foreground hover:text-white transition-colors"
                        style={{
                            background: "rgba(15,23,42,0.6)",
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                            border: "1px solid rgba(255,255,255,0.10)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                        }}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshingPrices ? "animate-spin" : ""} `} />
                        Refresh Prices
                    </Button>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="font-semibold rounded-full px-5"
                                style={{
                                    background: "linear-gradient(135deg, #2563EB 0%, #0f1f4a 100%)",
                                    boxShadow: "0 0 18px rgba(37,99,235,0.45), inset 0 1px 0 rgba(100,160,255,0.25)",
                                    border: "1px solid rgba(59,130,246,0.4)",
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Transaction
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-[#0a0f1e] border-white/10 text-card-foreground">
                            <DialogHeader>
                                <DialogTitle className="text-lg">New Transaction</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-sm">
                                    Log a cash flow or trade.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Type</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger className="bg-white/5 border-white/10 focus:ring-primary">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0a0f1e] border-white/10">
                                            <SelectItem value="DEPOSIT">Deposit Cash</SelectItem>
                                            <SelectItem value="WITHDRAWAL">Withdraw Cash</SelectItem>
                                            <SelectItem value="BUY">Buy Asset</SelectItem>
                                            <SelectItem value="SELL">Sell Asset</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Date</Label>
                                    <Input
                                        type="date"
                                        value={transactionDate}
                                        onChange={(e) => setTransactionDate(e.target.value)}
                                        max={new Date().toISOString().split("T")[0]}
                                        className="bg-white/5 border-white/10 focus-visible:ring-primary [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>

                                {(type === "BUY" || type === "SELL") ? (
                                    <>
                                        <div className="flex items-center space-x-2 my-2">
                                            <Checkbox
                                                id="manualAsset"
                                                checked={isManual}
                                                onCheckedChange={(checked) => setIsManual(checked === true)}
                                            />
                                            <Label htmlFor="manualAsset" className="text-sm cursor-pointer text-muted-foreground">
                                                Manual Asset (e.g. Mutual Fund / Private Equity)
                                            </Label>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                                {isManual ? "Asset Name" : "Ticker"}
                                            </Label>
                                            {isManual ? (
                                                <Input
                                                    value={ticker}
                                                    onChange={(e) => setTicker(e.target.value)}
                                                    placeholder="Renta 4 Pegasus..."
                                                    className="bg-white/5 border-white/10 focus-visible:ring-primary font-bold"
                                                    required
                                                />
                                            ) : (
                                                <TickerInput
                                                    value={ticker}
                                                    onChange={setTicker}
                                                    placeholder="AAPL, MSFT, BTC-USD…"
                                                    className="bg-white/5 border-white/10 focus-visible:ring-primary uppercase font-mono font-bold"
                                                />
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Shares / Units</Label>
                                                <Input type="number" step="0.000001" min="0" required value={quantity}
                                                    onChange={(e) => setQuantity(e.target.value)}
                                                    className="bg-white/5 border-white/10 focus-visible:ring-primary" placeholder="10" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                    Price/Share (€)
                                                    {isFetchingPrice && <RefreshCw className="w-3 h-3 animate-spin text-primary" />}
                                                </Label>
                                                <Input type="number" step="0.01" min="0" required value={price}
                                                    onChange={(e) => setPrice(e.target.value)}
                                                    className="bg-white/5 border-white/10 focus-visible:ring-primary" placeholder="150.00" />
                                            </div>
                                        </div>
                                        {quantity && price && !isNaN(parseFloat(quantity) * parseFloat(price)) && (
                                            <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-2 text-sm flex justify-between">
                                                <span className="text-muted-foreground">Total</span>
                                                <span className="font-mono font-bold text-primary">
                                                    €{fmt(parseFloat(quantity) * parseFloat(price))}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Amount (€)</Label>
                                        <Input type="number" step="0.01" min="0" required value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="bg-white/5 border-white/10 focus-visible:ring-primary" placeholder="1 000.00" />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Notes (optional)</Label>
                                    <Input value={notes} onChange={(e) => setNotes(e.target.value)}
                                        className="bg-white/5 border-white/10 focus-visible:ring-primary" placeholder="Monthly savings…" />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full font-semibold rounded-full mt-2"
                                    style={{
                                        background: "linear-gradient(135deg, #2563EB 0%, #0f1f4a 100%)",
                                        boxShadow: "0 0 18px rgba(37,99,235,0.45), inset 0 1px 0 rgba(100,160,255,0.25)",
                                        border: "1px solid rgba(59,130,246,0.4)",
                                    }}
                                >
                                    {submitting ? "Saving…" : "Save Transaction"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Total Invested (Net)", value: `€${fmt(totalDeposits)} `, sub: "capital from pocket", icon: <Wallet className="h-4 w-4" />, color: "text-foreground" },
                    { label: "Active Assets", value: `€${fmt(assetsValue)} `, sub: "live market value", icon: <PieChart className="h-4 w-4" />, color: "text-foreground" },
                    { label: "Available Cash", value: `€${fmt(cashBalance)} `, sub: "liquidity ready to deploy", icon: <Activity className="h-4 w-4" />, color: cashBalance < 0 ? "text-red-500" : "text-primary" },
                    {
                        label: "Unrealised P&L", value: `${totalPnl >= 0 ? "+" : ""}€${fmt(Math.abs(totalPnl))} `,
                        sub: `${totalPnlPct >= 0 ? "+" : ""}${fmt(totalPnlPct)}% vs.cost basis`,
                        icon: totalPnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />,
                        color: totalPnl >= 0 ? "text-green-500" : "text-red-500",
                    },
                ].map((kpi) => (
                    <Card key={kpi.label} className="bg-white/[0.03] backdrop-blur-sm border-white/5 hover:border-white/10 transition-colors">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                                {kpi.label}
                            </CardTitle>
                            <span className="text-muted-foreground">{kpi.icon}</span>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold font-mono ${kpi.color} `}>{kpi.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* iOS Segmented Tabs */}
            <div className="flex items-center gap-4 mb-6">
                <SegmentedControl value={activeTab} onChange={setActiveTab} />
            </div>

            {/* Sliding panels */}
            <div className="relative" style={{ minHeight: 300 }}>
                <SlidePanel active={activeTab} id="assets">
                    {isAssetsTab ? (
                        <AssetsTable
                            holdings={holdings}
                            loading={loading}
                            fmt={fmt}
                            onUpdatePrice={(ticker) => {
                                setUpdatingManualAsset(ticker);
                                const curAsset = holdings.find((h) => h.ticker === ticker);
                                setManualPriceInput(curAsset ? curAsset.currentPriceEur.toString() : "");
                            }}
                        />
                    ) : (
                        <TransactionsTable transactions={transactions} loading={loading} fmt={fmt} onDelete={handleDeleteTransaction} />
                    )}
                </SlidePanel>
                <SlidePanel active={activeTab} id="transactions">
                    <TransactionsTable transactions={transactions} loading={loading} fmt={fmt} onDelete={handleDeleteTransaction} />
                </SlidePanel>
            </div>

            {/* Manual Price Update Dialog */}
            <Dialog open={!!updatingManualAsset} onOpenChange={(open) => !open && setUpdatingManualAsset(null)}>
                <DialogContent className="sm:max-w-[400px] bg-[#0a0f1e] border-white/10 text-card-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-lg">Update Asset Value</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                            Enter the current market price or NAV for {updatingManualAsset}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateManualPrice} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">New Price (€)</Label>
                            <Input
                                type="number"
                                step="0.000001"
                                min="0"
                                required
                                value={manualPriceInput}
                                onChange={(e) => setManualPriceInput(e.target.value)}
                                className="bg-white/5 border-white/10 focus-visible:ring-primary font-mono text-lg"
                                placeholder="100.50"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full font-semibold rounded-full mt-2"
                            style={{
                                background: "linear-gradient(135deg, #2563EB 0%, #0f1f4a 100%)",
                                boxShadow: "0 0 18px rgba(37,99,235,0.45), inset 0 1px 0 rgba(100,160,255,0.25)",
                                border: "1px solid rgba(59,130,246,0.4)",
                            }}
                        >
                            {submitting ? "Saving…" : "Update Valuation"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Assets Table ─────────────────────────────────────────────────────────────
function AssetsTable({ holdings, loading, fmt, onUpdatePrice }: {
    holdings: AssetHolding[];
    loading: boolean;
    fmt: (n: number, d?: number) => string;
    onUpdatePrice?: (ticker: string) => void;
}) {
    return (
        <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
            <CardHeader className="border-b border-white/5 py-4">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Open Positions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="p-10 text-center text-muted-foreground animate-pulse">Loading positions…</div>
                ) : holdings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-14 text-center">
                        <PieChart className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                        <p className="text-base font-semibold">No open positions</p>
                        <p className="text-sm text-muted-foreground mt-1">Add a BUY transaction to track your assets here.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:grid grid-cols-6 gap-4 px-6 py-3 text-xs font-medium text-muted-foreground/60 uppercase tracking-widest border-b border-white/5">
                            <div className="col-span-2">Asset</div>
                            <div className="text-right">Shares</div>
                            <div className="text-right">Avg Cost</div>
                            <div className="text-right">Live Price</div>
                            <div className="text-right">P&L (Unrealised)</div>
                        </div>
                        {holdings.map((h) => (
                            <div key={h.ticker} className="grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors group">
                                <div className="col-span-2 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-mono font-bold text-xs text-primary flex-shrink-0">
                                        {h.ticker.substring(0, 2)}
                                    </div>
                                    <div>
                                        <div className="font-mono font-bold text-sm">{h.ticker}</div>
                                        <div className="text-xs text-muted-foreground">€{fmt(h.currentValue)} market value</div>
                                    </div>
                                </div>
                                <div className="md:text-right font-mono text-sm self-center">{h.quantity}</div>
                                <div className="md:text-right font-mono text-sm self-center text-muted-foreground">€{fmt(h.avgCost)}</div>
                                <div className="md:text-right self-center">
                                    {h.currentPriceEur > 0 ? (
                                        <div>
                                            <div className="font-mono font-semibold text-sm flex md:justify-end items-center gap-1.5">
                                                €{fmt(h.currentPriceEur)}
                                                {h.currency !== "EUR" && (
                                                    <span className="text-[10px] font-normal px-1 py-0.5 rounded bg-white/5 text-muted-foreground font-sans">
                                                        {h.currency} ${fmt(h.currentPrice)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-xs font-mono ${h.changeEur >= 0 ? "text-green-500" : "text-red-500"} `}>
                                                {h.changeEur >= 0 ? "+" : ""}€{fmt(h.changeEur)} ({h.changePct >= 0 ? "+" : ""}{fmt(h.changePct)}%)
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end pr-2 md:pr-0">
                                            {h.is_manual ? (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => onUpdatePrice?.(h.ticker)}
                                                    className="h-7 text-xs px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                                                >
                                                    <RefreshCw className="w-3 h-3 mr-1.5" /> Set Price
                                                </Button>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className={`md:text-right self-center font-mono font-semibold text-sm ${h.pnl >= 0 ? "text-green-500" : "text-red-500"} `}>
                                    <div className="flex md:justify-end items-center gap-1">
                                        {h.pnl >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                                        {h.pnl >= 0 ? "+" : ""}€{fmt(Math.abs(h.pnl))}
                                    </div>
                                    <div className="text-xs font-normal opacity-70 md:text-right">
                                        ({h.pnlPct >= 0 ? "+" : ""}{fmt(h.pnlPct)}%)
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Transactions Table ────────────────────────────────────────────────────────
function TransactionsTable({ transactions, loading, fmt, onDelete }: {
    transactions: Transaction[];
    loading: boolean;
    fmt: (n: number, d?: number) => string;
    onDelete: (id: string) => void;
}) {
    const isPositive = (type: string) => ["DEPOSIT", "SELL", "DIVIDEND", "INTEREST"].includes(type);
    const typeLabel: Record<string, string> = {
        DEPOSIT: "DEP", WITHDRAWAL: "WIT", BUY: "BUY", SELL: "SEL", DIVIDEND: "DIV", INTEREST: "INT",
    };

    return (
        <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
            <CardHeader className="border-b border-white/5 py-4">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Transaction History · {transactions.length} entries
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="p-10 text-center text-muted-foreground animate-pulse">Loading history…</div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-14 text-center">
                        <Wallet className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                        <p className="text-base font-semibold">No transactions yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Start with a cash deposit.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {transactions.map((tx) => {
                            const pos = isPositive(tx.type);
                            return (
                                <div key={tx.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.03] transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${pos ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                            {typeLabel[tx.type] ?? tx.type.substring(0, 3)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm leading-tight">
                                                {tx.type === "DEPOSIT" ? "Cash Deposit"
                                                    : tx.type === "WITHDRAWAL" ? "Cash Withdrawal"
                                                        : `${tx.type} ${tx.portfolio_assets?.ticker ?? "Asset"} `}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                <span>{new Date(tx.date).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                                {(tx.type === "BUY" || tx.type === "SELL") && (
                                                    <><span className="opacity-40">·</span><span className="font-mono">{tx.quantity} × €{fmt(tx.price)}</span></>
                                                )}
                                                {tx.notes && <><span className="opacity-40">·</span><span className="italic">"{tx.notes}"</span></>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`font-mono font-bold text-sm tabular-nums ${pos ? "text-green-500" : "text-foreground"}`}>
                                            {pos ? "+" : "−"}€{fmt(Number(tx.total_amount))}
                                        </div>
                                        <button
                                            onClick={() => onDelete(tx.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 hover:text-red-500 rounded-md text-muted-foreground mr-2"
                                            title="Delete transaction"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
