"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, AlertTriangle, ShieldCheck, Plus } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/utils/supabase/client";

export default function QuantStrategyPage() {
    // Monte Carlo State
    const [ticker, setTicker] = useState("AAPL");
    const [simData, setSimData] = useState<any>(null);
    const [loadingSim, setLoadingSim] = useState(false);

    // Black Scholes State
    const [bsTicker, setBsTicker] = useState("AAPL");
    const [bsStrike, setBsStrike] = useState(250);
    const [bsDays, setBsDays] = useState(30);
    const [bsData, setBsData] = useState<any>(null);
    const [loadingBs, setLoadingBs] = useState(false);

    const runMonteCarlo = async () => {
        setLoadingSim(true);
        try {
            const res = await fetch(`http://localhost:8000/api/montecarlo/${ticker}`);
            const data = await res.json();
            setSimData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingSim(false);
        }
    };

    const runBlackScholes = async () => {
        setLoadingBs(true);
        try {
            const res = await fetch(`http://localhost:8000/api/blackscholes/${bsTicker}?strike=${bsStrike}&days_to_expiry=${bsDays}`);
            const data = await res.json();
            setBsData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingBs(false);
        }
    };

    // Transform Python Array data into an array of objects for Recharts
    const chartData = useMemo(() => {
        if (!simData) return [];
        const data = [];
        for (let i = 0; i < simData.days; i++) {
            const point: any = {
                day: i,
                p95: simData.percentiles.p95[i],
                p50: simData.percentiles.p50[i],
                p5: simData.percentiles.p5[i],
            };

            if (simData.sample_paths) {
                simData.sample_paths.forEach((path: number[], index: number) => {
                    point[`path_${index}`] = path[i];
                });
            }
            data.push(point);
        }
        return data;
    }, [simData]);

    // Calculate strict min/max numerical domain to avoid Recharts crashes
    const yDomain = useMemo(() => {
        if (!simData) return [0, 0];
        const minVal = Math.min(...simData.percentiles.p5);
        const maxVal = Math.max(...simData.percentiles.p95);
        return [Math.floor(minVal * 0.85), Math.ceil(maxVal * 1.15)];
    }, [simData]);

    // Calculate Histogram Bins for the final distribution
    const histogramData = useMemo(() => {
        if (!simData || !simData.final_distribution) return [];

        const minPrice = Math.min(...simData.final_distribution);
        const maxPrice = Math.max(...simData.final_distribution);
        const binCount = 20; // 20 bins to fit vertically in 400px
        const binSize = (maxPrice - minPrice) / binCount;

        const bins = Array(binCount).fill(0).map((_, i) => ({
            binStart: minPrice + (i * binSize),
            binEnd: minPrice + ((i + 1) * binSize),
            priceRange: `$${(minPrice + (i * binSize)).toFixed(0)}-$${(minPrice + ((i + 1) * binSize)).toFixed(0)}`,
            count: 0
        }));

        simData.final_distribution.forEach((price: number) => {
            const binIndex = Math.min(Math.floor((price - minPrice) / binSize), binCount - 1);
            if (bins[binIndex]) {
                bins[binIndex].count += 1;
            }
        });

        return bins.reverse();
    }, [simData]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const filteredPayload = payload.filter((entry: any) =>
                entry.name === "Bull Case (95%)" ||
                entry.name === "Median (50%)" ||
                entry.name === "Bear Case (5%)"
            );
            return (
                <div className="bg-slate-900 border border-white/10 rounded-lg p-3 text-sm shadow-xl">
                    <p className="text-white font-medium mb-1">Day {label}</p>
                    {filteredPayload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-muted-foreground">{entry.name}:</span>
                            <span className="font-mono text-white">${Number(entry.value).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const maxHistogramCount = useMemo(() => {
        if (!histogramData.length) return 1;
        return Math.max(...histogramData.map(b => b.count));
    }, [histogramData]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Quant Strategy Engine</h1>
                <p className="text-muted-foreground mt-2">
                    Advanced mathematical models powered by a high-performance Python microservice.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-12">
                {/* 2. Monte Carlo Simulator */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-blue-400" />
                        <h2 className="text-xl font-semibold">Monte Carlo Simulation</h2>
                    </div>

                    <Card className="bg-card/40 border-white/5 h-full">
                        <CardHeader className="bg-secondary/20 pb-4">
                            <CardTitle className="text-base flex items-center justify-between">
                                Geometric Brownian Motion (GBM)
                            </CardTitle>
                            <CardDescription>Simulates 1,000 future price paths based on historical volatility.</CardDescription>

                            <div className="flex gap-2 mt-4">
                                <Input
                                    value={ticker}
                                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                    className="bg-background/50 uppercase font-mono w-24"
                                    placeholder="TICKER"
                                />
                                <Button onClick={runMonteCarlo} disabled={loadingSim} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {loadingSim ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Simulate 30 Days
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {simData ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                        <span className="text-muted-foreground">Current Price</span>
                                        <span className="text-xl font-mono">${simData.current_price.toFixed(2)}</span>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <p className="text-sm text-muted-foreground mb-3">Projected Prices at Day {simData.days}</p>

                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-green-400">95th Percentile (Bull Case)</span>
                                            <span className="font-mono">${simData.percentiles.p95[simData.days - 1].toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-white">50th Percentile (Median)</span>
                                            <span className="font-mono">${simData.percentiles.p50[simData.days - 1].toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-red-400">5th Percentile (Bear Case)</span>
                                            <span className="font-mono">${simData.percentiles.p5[simData.days - 1].toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200">
                                        There is a 90% probability that the price will land between <span className="font-mono text-white">${simData.percentiles.p5[simData.days - 1].toFixed(2)}</span> and <span className="font-mono text-white">${simData.percentiles.p95[simData.days - 1].toFixed(2)}</span>.
                                    </div>

                                    {/* Monte Carlo Visual Cone & Histogram */}
                                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-4 h-[400px]">
                                        <div className="lg:col-span-3 h-full min-h-0 flex flex-col">
                                            <p className="text-xs text-muted-foreground text-center mb-2 shrink-0">Simulated Price Paths & Percentiles</p>
                                            <div className="flex-1 min-h-0 w-full relative">
                                                <div className="absolute inset-0">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                                            <XAxis
                                                                dataKey="day"
                                                                stroke="#888888"
                                                                fontSize={12}
                                                                tickLine={false}
                                                                axisLine={false}
                                                                tickFormatter={(value) => `D${value}`}
                                                            />
                                                            <YAxis
                                                                stroke="#888888"
                                                                fontSize={12}
                                                                tickLine={false}
                                                                axisLine={false}
                                                                tickFormatter={(value) => `$${value}`}
                                                                domain={yDomain}
                                                            />
                                                            <Tooltip content={<CustomTooltip />} />

                                                            {/* Background Sample Paths */}
                                                            {simData?.sample_paths?.map((_: any, i: number) => (
                                                                <Line
                                                                    key={`path_${i}`}
                                                                    type="monotone"
                                                                    dataKey={`path_${i}`}
                                                                    stroke="#ffffff"
                                                                    strokeOpacity={0.05}
                                                                    strokeWidth={1}
                                                                    dot={false}
                                                                    isAnimationActive={false}
                                                                />
                                                            ))}

                                                            {/* The Percentile Cones */}
                                                            <Line type="monotone" dataKey="p95" stroke="#4ade80" name="Bull Case (95%)" strokeWidth={2.5} dot={false} strokeDasharray="5 5" isAnimationActive={false} />
                                                            <Line type="monotone" dataKey="p50" stroke="#ffffff" name="Median (50%)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                                                            <Line type="monotone" dataKey="p5" stroke="#f87171" name="Bear Case (5%)" strokeWidth={2.5} dot={false} strokeDasharray="5 5" isAnimationActive={false} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-1 h-full min-h-0 border-l border-white/5 pl-4 hidden lg:flex flex-col overflow-hidden">
                                            <p className="text-xs text-muted-foreground text-center mb-2 shrink-0">Final Prob. Distribution</p>
                                            <div className="flex-1 min-h-0 w-full relative">
                                                <div className="absolute inset-0 flex flex-col justify-between py-1">
                                                    {histogramData.map((bin, i) => (
                                                        <div key={i} className="flex-1 flex items-center group relative cursor-pointer gap-2 py-[1px]">
                                                            <div className="w-[70px] text-[10px] text-muted-foreground whitespace-nowrap overflow-hidden text-right leading-none shrink-0">
                                                                {bin.priceRange.replace(' - ', '-')}
                                                            </div>
                                                            <div className="flex-1 h-[80%] min-h-[4px] relative rounded-r overflow-hidden group-hover:bg-white/5 transition-colors">
                                                                <div
                                                                    className="absolute left-0 top-0 bottom-0 bg-indigo-500/80 rounded-r transition-all group-hover:bg-indigo-400"
                                                                    style={{ width: `${Math.max((bin.count / maxHistogramCount) * 100, 1)}%` }}
                                                                />
                                                            </div>
                                                            <div className="w-[30px] text-[10px] text-indigo-300/80 opacity-0 group-hover:opacity-100 transition-opacity text-left shrink-0">
                                                                {bin.count}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-white/10 rounded-lg">
                                    Click Simulate to run engine
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* 3. Black-Scholes Pricing */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-purple-400" />
                        <h2 className="text-xl font-semibold">Black-Scholes Options</h2>
                    </div>

                    <Card className="bg-card/40 border-white/5 h-full">
                        <CardHeader className="bg-secondary/20 pb-4">
                            <CardTitle className="text-base">Merton Model & The Greeks</CardTitle>
                            <CardDescription>Theoretical options pricing and sensitivity analysis.</CardDescription>

                            <div className="flex gap-2 mt-4">
                                <Input
                                    value={bsTicker}
                                    onChange={(e) => setBsTicker(e.target.value.toUpperCase())}
                                    className="bg-background/50 uppercase font-mono w-24"
                                    placeholder="TICKER"
                                />
                                <Input
                                    type="number"
                                    value={bsStrike}
                                    onChange={(e) => setBsStrike(Number(e.target.value))}
                                    className="bg-background/50 font-mono w-24"
                                    placeholder="Strike"
                                />
                                <Button onClick={runBlackScholes} disabled={loadingBs} className="bg-purple-600 hover:bg-purple-700 text-white">
                                    {loadingBs ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Calculate
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {bsData ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-background/50 rounded-lg border border-white/5 text-center">
                                            <p className="text-sm text-muted-foreground">Call Price</p>
                                            <p className="text-2xl font-mono text-green-400">${bsData.prices.call.toFixed(2)}</p>
                                        </div>
                                        <div className="p-4 bg-background/50 rounded-lg border border-white/5 text-center">
                                            <p className="text-sm text-muted-foreground">Put Price</p>
                                            <p className="text-2xl font-mono text-red-400">${bsData.prices.put.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground mb-3">The Greeks (Sensitivities)</p>
                                        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                                            <div className="flex justify-between border-b border-white/5 pb-1">
                                                <span className="text-muted-foreground">Delta (Call)</span>
                                                <span className="font-mono text-white">{bsData.greeks.delta_call.toFixed(4)}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-white/5 pb-1">
                                                <span className="text-muted-foreground">Delta (Put)</span>
                                                <span className="font-mono text-white">{bsData.greeks.delta_put.toFixed(4)}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-white/5 pb-1">
                                                <span className="text-muted-foreground">Gamma</span>
                                                <span className="font-mono text-white">{bsData.greeks.gamma.toFixed(4)}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-white/5 pb-1">
                                                <span className="text-muted-foreground">Vega</span>
                                                <span className="font-mono text-white">{bsData.greeks.vega.toFixed(4)}</span>
                                            </div>
                                            <div className="flex justify-between pt-1">
                                                <span className="text-muted-foreground">Theta (Call)</span>
                                                <span className="font-mono text-white">{bsData.greeks.theta_call.toFixed(4)}</span>
                                            </div>
                                            <div className="flex justify-between pt-1">
                                                <span className="text-muted-foreground">Theta (Put)</span>
                                                <span className="font-mono text-white">{bsData.greeks.theta_put.toFixed(4)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-white/10 rounded-lg">
                                    Calculate to view Greeks
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    );
}
