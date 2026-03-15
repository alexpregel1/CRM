"use client";

import { Info } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const WINDOWS = [
    { label: "20 días", desc: "Momentum reciente", weight: "50%", bar: "w-full" },
    { label: "60 días", desc: "Tendencia media", weight: "30%", bar: "w-3/5" },
    { label: "90 días", desc: "Confirmación", weight: "20%", bar: "w-2/5" },
];

export function RSRankingHeader() {
    return (
        <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
                Current RS Ranking
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-blue-400 cursor-help transition-colors duration-150" />
                    </TooltipTrigger>
                    <TooltipContent
                        side="right"
                        sideOffset={10}
                        className="w-72 p-0 border-0 shadow-2xl"
                        style={{
                            background: "linear-gradient(160deg, rgba(10,18,42,0.98) 0%, rgba(4,8,22,0.99) 100%)",
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                            border: "1px solid rgba(59,130,246,0.2)",
                            borderRadius: 14,
                            boxShadow: "0 16px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(100,160,255,0.08)",
                        }}
                    >
                        {/* Header */}
                        <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
                            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">Metodología</p>
                            <p className="text-sm font-bold text-white">RS Composite Score</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                Rentabilidad de cada sector <strong className="text-white/80">menos</strong> la de SPY,
                                combinada en tres horizontes.
                            </p>
                        </div>

                        {/* Windows breakdown */}
                        <div className="px-4 py-3 space-y-2.5 border-b border-white/[0.06]">
                            {WINDOWS.map((w) => (
                                <div key={w.label} className="flex items-center gap-3">
                                    <div className="w-14 shrink-0">
                                        <span className="text-xs font-mono font-bold text-white">{w.label}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[11px] text-muted-foreground">{w.desc}</span>
                                            <span className="text-[11px] font-mono text-blue-400">{w.weight}</span>
                                        </div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${w.bar}`}
                                                style={{ background: "linear-gradient(90deg, #2563EB, #60a5fa)" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Formula */}
                        <div className="px-4 py-3 border-b border-white/[0.06]">
                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5">Fórmula</p>
                            <p className="text-xs font-mono text-white/80 leading-relaxed">
                                Score = RS₂₀d<span className="text-blue-400">×0.5</span> + RS₆₀d<span className="text-blue-400">×0.3</span> + RS₉₀d<span className="text-blue-400">×0.2</span>
                            </p>
                        </div>

                        {/* Selection rule */}
                        <div className="px-4 py-3">
                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5">Selección</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Los <strong className="text-white">2 sectores</strong> con score más alto y positivo
                                reciben el capital. Los pesos son <strong className="text-white">proporcionales al score</strong>{" "}
                                (no igual-ponderados).
                            </p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </span>
            <span className="text-xs font-normal text-muted-foreground">Top 2 selected</span>
        </CardTitle>
    );
}
