"use client";

import { Info } from "lucide-react";
import {
    Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Shared primitives ─────────────────────────────────────────────────────

function InfoIcon() {
    return (
        <Info className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-blue-400 cursor-help transition-colors duration-150 shrink-0" />
    );
}

const TOOLTIP_STYLE: React.CSSProperties = {
    background: "linear-gradient(160deg, rgba(10,18,42,0.98) 0%, rgba(4,8,22,0.99) 100%)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: 14,
    boxShadow: "0 16px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(100,160,255,0.08)",
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="px-4 py-3 border-b border-white/[0.06] last:border-b-0">
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5">{label}</p>
            {children}
        </div>
    );
}

function Row({ left, right, accent }: { left: string; right: string; accent?: boolean }) {
    return (
        <div className="flex items-center justify-between py-0.5">
            <span className="text-xs text-muted-foreground">{left}</span>
            <span className={`text-xs font-mono ${accent ? "text-blue-400" : "text-white/80"}`}>{right}</span>
        </div>
    );
}

function KpiLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">{children}</p>
    );
}

// ─── 1. CNN Fear & Greed ───────────────────────────────────────────────────

export function FearGreedLabel() {
    return (
        <Tooltip>
            <TooltipTrigger asChild><InfoIcon /></TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="w-72 p-0 border-0" style={TOOLTIP_STYLE}>
                <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
                    <KpiLabel>Indicador</KpiLabel>
                    <p className="text-sm font-bold text-white">CNN Fear &amp; Greed Index</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Compuesto de <strong className="text-white/80">7 señales de mercado</strong> que miden
                        si los inversores actúan por miedo o codicia. Rango: 0 (pánico) → 100 (euforia).
                    </p>
                </div>
                <Section label="Componentes">
                    <Row left="Momentum (S&P 500 vs MA125)" right="1/7" />
                    <Row left="Fuerza relativa (RSI 14d)" right="1/7" />
                    <Row left="Amplitud de mercado (McClellan)" right="1/7" />
                    <Row left="Nuevos máximos vs mínimos (52w)" right="1/7" />
                    <Row left="Put/Call ratio (opciones)" right="1/7" />
                    <Row left="Demanda de bonos basura (HYG)" right="1/7" />
                    <Row left="Volatilidad implícita (VIX)" right="1/7" />
                </Section>
                <Section label="Umbrales">
                    <Row left="0–24  →  Extreme Fear" right="Oportunidad de compra" accent />
                    <Row left="25–44 →  Fear" right="Cautela" />
                    <Row left="45–55 →  Neutral" right="—" />
                    <Row left="56–74 →  Greed" right="Reducir riesgo" />
                    <Row left="75–100 → Extreme Greed" right="Riesgo de corrección" accent />
                </Section>
            </TooltipContent>
        </Tooltip>
    );
}

// ─── 2. WSB Sentiment ─────────────────────────────────────────────────────

export function WSBLabel() {
    return (
        <Tooltip>
            <TooltipTrigger asChild><InfoIcon /></TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="w-72 p-0 border-0" style={TOOLTIP_STYLE}>
                <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
                    <KpiLabel>Indicador</KpiLabel>
                    <p className="text-sm font-bold text-white">WallStreetBets Sentiment</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Análisis de sentimiento en tiempo real del subreddit r/WallStreetBets —
                        el foro retail más influyente del mercado (GameStop, AMC…).
                    </p>
                </div>
                <Section label="Metodología">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Se analizan los últimos <strong className="text-white/80">100 posts</strong> con
                        NLP para clasificarlos como alcistas, bajistas o neutros, basándose en palabras clave,
                        emojis y contexto del título.
                    </p>
                </Section>
                <Section label="Señal contrarian">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Úsala como <strong className="text-white/80">indicador contrarian</strong>: un sentimiento
                        muy alcista (&gt;80%) suele coincidir con techos de corto plazo.
                        &lt;30% bullish históricamente precede rebotes.
                    </p>
                </Section>
            </TooltipContent>
        </Tooltip>
    );
}

// ─── 3. Options P/C OI ────────────────────────────────────────────────────

export function OptionsPCLabel() {
    return (
        <Tooltip>
            <TooltipTrigger asChild><InfoIcon /></TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="w-72 p-0 border-0" style={TOOLTIP_STYLE}>
                <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
                    <KpiLabel>Indicador</KpiLabel>
                    <p className="text-sm font-bold text-white">Put/Call Open Interest Ratio</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Compara el <strong className="text-white/80">interés abierto en puts</strong> (apuestas bajistas)
                        vs <strong className="text-white/80">calls</strong> (alcistas) sobre el SPY en CBOE.
                    </p>
                </div>
                <Section label="Fórmula">
                    <p className="text-xs font-mono text-white/80 py-1">P/C = OI Puts ÷ OI Calls</p>
                </Section>
                <Section label="Umbrales (SPY)">
                    <Row left="> 1.2  →  Put-heavy" right="Cobertura bajista elevada" accent />
                    <Row left="0.8–1.2 → Neutral" right="Equilibrio opciones" />
                    <Row left="< 0.8  →  Call-heavy" right="Euforia / sin cobertura" accent />
                </Section>
                <Section label="Lectura contraria">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Un ratio muy alto (&gt;1.5) puede indicar <strong className="text-white/80">sobrecobtura bajista</strong> —
                        señal de posible rebote corto. Muy bajo (&lt;0.6) = complacencia extrema.
                    </p>
                </Section>
            </TooltipContent>
        </Tooltip>
    );
}

// ─── 4. Insider Activity ──────────────────────────────────────────────────

export function InsiderLabel() {
    return (
        <Tooltip>
            <TooltipTrigger asChild><InfoIcon /></TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="w-72 p-0 border-0" style={TOOLTIP_STYLE}>
                <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
                    <KpiLabel>Indicador</KpiLabel>
                    <p className="text-sm font-bold text-white">Insider Cluster Buys</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Compras declaradas por <strong className="text-white/80">directivos y consejeros</strong>
                        de compañías cotizadas (&gt;$500k en los últimos 30 días).
                    </p>
                </div>
                <Section label="¿Qué es un cluster buy?">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Se cuenta como <strong className="text-white/80">cluster buy</strong> cuando
                        <strong className="text-white/80"> 2 o más insiders</strong> de la misma empresa
                        compran en la misma ventana de 30 días — señal mucho más fiable que una compra aislada.
                    </p>
                </Section>
                <Section label="Por qué importa">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Los insiders <strong className="text-white/80">venden por muchos motivos</strong> pero
                        <strong className="text-white/80"> compran por uno solo</strong>: creen que la acción
                        está infravalorada. Fuente: OpenInsider (SEC Form 4).
                    </p>
                </Section>
            </TooltipContent>
        </Tooltip>
    );
}

// ─── 5. WSB Top Tickers card header ──────────────────────────────────────

export function WSBTickersLabel() {
    return (
        <Tooltip>
            <TooltipTrigger asChild><InfoIcon /></TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="w-64 p-0 border-0" style={TOOLTIP_STYLE}>
                <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
                    <KpiLabel>Fuente</KpiLabel>
                    <p className="text-sm font-bold text-white">Tickers más mencionados en WSB</p>
                </div>
                <Section label="Metodología">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Extracción de tickers de los últimos 100 posts de r/WallStreetBets mediante
                        regex + lista curada. La barra representa menciones relativas al ticker #1.
                    </p>
                </Section>
                <Section label="Uso">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Alta concentración en un ticker suele preceder a <strong className="text-white/80">volatilidad elevada</strong>
                        — squeezes o dumps. No es señal direccional, sino de atención del mercado retail.
                    </p>
                </Section>
            </TooltipContent>
        </Tooltip>
    );
}
