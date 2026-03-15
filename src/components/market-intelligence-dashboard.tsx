"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, ShieldCheck, Eye, Briefcase, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

export function MarketIntelligenceDashboard() {
    const [regime, setRegime] = useState<any>(null);
    const [loadingRegime, setLoadingRegime] = useState(true);

    // Analyst Recommendations State
    const [portfolioRecs, setPortfolioRecs] = useState<any[]>([]);
    const [watchlistRecs, setWatchlistRecs] = useState<any[]>([]);
    const [loadingRecs, setLoadingRecs] = useState(true);
    const [watchlistTickers, setWatchlistTickers] = useState<string[]>([]);
    const [newWatchlistTicker, setNewWatchlistTicker] = useState("");

    // Initial Fetch for Regime & Recommendations
    useEffect(() => {
        // Fetch Regime
        fetch("http://localhost:8000/api/regime/current")
            .then(res => res.json())
            .then(data => {
                setRegime(data);
                setLoadingRegime(false);
            })
            .catch(err => {
                console.error("Failed to fetch regime", err);
                setLoadingRegime(false);
            });

        // Fetch Recommendations
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        setLoadingRecs(true);
        try {
            // 1. Fetch Portfolio holding tickers
            const { data: txs } = await supabase
                .from("portfolio_transactions")
                .select("type, quantity, portfolio_assets(ticker)")
                .eq("user_id", "00000000-0000-0000-0000-000000000001");

            let portfolioTickersList: string[] = [];
            if (txs) {
                const map: Record<string, number> = {};
                txs.forEach((tx: any) => {
                    const k = tx.portfolio_assets?.ticker;
                    if (!k) return;
                    if (!map[k]) map[k] = 0;
                    if (tx.type === "BUY") map[k] += Number(tx.quantity);
                    if (tx.type === "SELL") map[k] -= Number(tx.quantity);
                });
                portfolioTickersList = Object.keys(map).filter(k => map[k] > 0);
            }

            // 2. Fetch Watchlist tickers
            const { data: wlData } = await supabase
                .from("portfolio_watchlist")
                .select("id, ticker")
                .eq("user_id", "00000000-0000-0000-0000-000000000001");

            const wlTickersList = wlData ? wlData.map(w => w.ticker) : [];
            setWatchlistTickers(wlTickersList);

            // 3. Fetch from Python API
            const pTickersStr = portfolioTickersList.join(",");
            const wTickersStr = wlTickersList.join(",");

            if (pTickersStr) {
                const res = await fetch(`http://localhost:8000/api/recommendations?tickers=${pTickersStr}`);
                if (res.ok) {
                    const data = await res.json();
                    setPortfolioRecs(data.recommendations || []);
                }
            }
            if (wTickersStr) {
                const res = await fetch(`http://localhost:8000/api/recommendations?tickers=${wTickersStr}`);
                if (res.ok) {
                    const data = await res.json();
                    setWatchlistRecs(data.recommendations || []);
                }
            } else {
                setWatchlistRecs([]);
            }
        } catch (err) {
            console.error("Error fetching recs:", err);
        } finally {
            setLoadingRecs(false);
        }
    };

    const handleAddWatchlist = async () => {
        if (!newWatchlistTicker.trim()) return;
        const addTicker = newWatchlistTicker.toUpperCase().trim();

        // Prevent duplicates
        if (watchlistTickers.includes(addTicker)) {
            setNewWatchlistTicker("");
            return;
        }

        await supabase.from("portfolio_watchlist").insert({
            user_id: "00000000-0000-0000-0000-000000000001",
            ticker: addTicker
        });

        setNewWatchlistTicker("");
        fetchRecommendations(); // Refresh the lists
    };

    const handleRemoveWatchlist = async (tickerToRemove: string) => {
        await supabase.from("portfolio_watchlist").delete()
            .eq("user_id", "00000000-0000-0000-0000-000000000001")
            .eq("ticker", tickerToRemove);
        fetchRecommendations();
    };

    return (
        <section className="space-y-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-semibold">Live Market Regime (HMM)</h2>
            </div>

            {/* HMM Card */}
            <Card className="bg-gradient-to-br from-card/40 to-card/10 border-white/5 overflow-hidden relative">
                {/* Glowing background effect based on regime */}
                {regime && regime.current_regime === "Bullish" && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[100px] rounded-full" />
                )}
                {regime && regime.current_regime === "Bearish" && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[100px] rounded-full" />
                )}
                {regime && regime.current_regime === "Neutral/Choppy" && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full" />
                )}

                <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    {loadingRegime ? (
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" /> Training Markov Model on SPY...
                        </div>
                    ) : regime ? (
                        <>
                            <div>
                                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Current SPY Regime</p>
                                <h3
                                    className={`text-5xl font-extrabold ${regime.current_regime === 'Bullish' ? 'text-green-400' :
                                        regime.current_regime === 'Bearish' ? 'text-red-400' :
                                            'text-yellow-400'
                                        }`}
                                >
                                    {regime.current_regime}
                                </h3>
                            </div>

                            <div className="grid grid-cols-3 gap-8 border-l border-white/10 pl-8">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Bullish State Avg Return</p>
                                    <p className="text-lg font-mono text-green-400">{(regime.regime_details.Bullish.mean_return_daily * 100).toFixed(3)}%</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Neutral State Avg Return</p>
                                    <p className="text-lg font-mono text-yellow-400">{(regime.regime_details["Neutral/Choppy"].mean_return_daily * 100).toFixed(3)}%</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Bearish State Avg Return</p>
                                    <p className="text-lg font-mono text-red-400">{(regime.regime_details.Bearish.mean_return_daily * 100).toFixed(3)}%</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-red-400 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" /> Failed to connect to Python Engine. Is it running on port 8000?
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recommendations Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Portfolio Ratings */}
                <Card className="bg-card/40 border-white/5 h-full flex flex-col">
                    <CardHeader className="bg-secondary/20 pb-4 border-b border-white/5">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-blue-400" /> Portfolio Ratings
                        </CardTitle>
                        <CardDescription>Latest Tier-1 recommendations for your holdings.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-auto max-h-96">
                        {loadingRecs ? (
                            <div className="p-8 flex justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
                        ) : portfolioRecs.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">No recent recommendations found for your portfolio.</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {portfolioRecs.map((rec, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-sm">{rec.ticker}</span>
                                                <span className="text-xs text-muted-foreground">{rec.date}</span>
                                            </div>
                                            <div className="text-sm font-medium mt-1 text-muted-foreground">{rec.firm}</div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className={`font-mono bg-opacity-20 border-opacity-50 ${rec.action === 'up' || rec.to_grade.includes('Buy') || rec.to_grade.includes('Outperform') ? 'bg-green-500/10 text-green-400 border-green-500' : rec.action === 'down' || rec.to_grade.includes('Sell') || rec.to_grade.includes('Underperform') ? 'bg-red-500/10 text-red-400 border-red-500' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500'}`}>
                                                {rec.to_grade}
                                            </Badge>
                                            <div className="text-xs text-muted-foreground mt-1 capitalize">{rec.action === "main" ? "Maintained" : rec.action === "up" ? "Upgraded" : rec.action === "down" ? "Downgraded" : rec.action === "init" ? "Initiated" : rec.action === "reit" ? "Reiterated" : rec.action}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Watchlist Ratings */}
                <Card className="bg-card/40 border-white/5 h-full flex flex-col">
                    <CardHeader className="bg-secondary/20 pb-4 border-b border-white/5">
                        <CardTitle className="text-base flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-purple-400" /> Watchlist Ratings
                            </div>
                        </CardTitle>
                        <CardDescription>Track analyst sentiments for specific specific tickers.</CardDescription>
                        <div className="flex gap-2 mt-4">
                            <Input
                                placeholder="Ticker (e.g. NVDA)"
                                className="bg-background/50 uppercase font-mono h-8 text-sm"
                                value={newWatchlistTicker}
                                onChange={(e) => setNewWatchlistTicker(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddWatchlist()}
                            />
                            <Button size="sm" onClick={handleAddWatchlist} disabled={loadingRecs || !newWatchlistTicker.trim()} className="h-8 bg-purple-600 hover:bg-purple-700 text-white">
                                <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                        </div>

                        {/* Display tracked tickers as dismissible tags */}
                        {watchlistTickers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {watchlistTickers.map(t => (
                                    <Badge key={t} variant="secondary" className="font-mono text-[10px] flex items-center gap-1 bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-muted-foreground transition-colors cursor-pointer group" onClick={() => handleRemoveWatchlist(t)}>
                                        {t} <Trash2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-400" />
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-auto max-h-96">
                        {loadingRecs ? (
                            <div className="p-8 flex justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
                        ) : watchlistRecs.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">Add tickers above to track recommendations.</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {watchlistRecs.map((rec, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-sm">{rec.ticker}</span>
                                                <span className="text-xs text-muted-foreground">{rec.date}</span>
                                            </div>
                                            <div className="text-sm font-medium mt-1 text-muted-foreground">{rec.firm}</div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className={`font-mono bg-opacity-20 border-opacity-50 ${rec.action === 'up' || rec.to_grade.includes('Buy') || rec.to_grade.includes('Outperform') ? 'bg-green-500/10 text-green-400 border-green-500' : rec.action === 'down' || rec.to_grade.includes('Sell') || rec.to_grade.includes('Underperform') ? 'bg-red-500/10 text-red-400 border-red-500' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500'}`}>
                                                {rec.to_grade}
                                            </Badge>
                                            <div className="text-xs text-muted-foreground mt-1 capitalize">{rec.action === "main" ? "Maintained" : rec.action === "up" ? "Upgraded" : rec.action === "down" ? "Downgraded" : rec.action === "init" ? "Initiated" : rec.action === "reit" ? "Reiterated" : rec.action}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
