"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";

type Suggestion = {
    symbol: string;
    name: string;
    exchange: string;
    type: string;
};

const TYPE_LABEL: Record<string, string> = {
    EQUITY: "Stock",
    ETF: "ETF",
    FUND: "Fund",
    CRYPTOCURRENCY: "Crypto",
};

interface TickerInputProps {
    value: string;
    onChange: (symbol: string) => void;
    placeholder?: string;
    className?: string;
}

export function TickerInput({ value, onChange, placeholder, className }: TickerInputProps) {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync external value changes (e.g. form reset)
    useEffect(() => { setQuery(value); }, [value]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const fetchSuggestions = useCallback(async (q: string) => {
        if (q.length < 1) { setSuggestions([]); setOpen(false); return; }
        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const data: Suggestion[] = res.ok ? await res.json() : [];
            setSuggestions(data);
            setOpen(data.length > 0);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase();
        setQuery(val);
        onChange(val); // keep parent in sync while typing
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 220);
    };

    const handleSelect = (s: Suggestion) => {
        setQuery(s.symbol);
        onChange(s.symbol);
        setSuggestions([]);
        setOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <Input
                required
                value={query}
                onChange={handleChange}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
                className={className}
                placeholder={placeholder}
                autoComplete="off"
                spellCheck={false}
            />

            {/* Autocomplete dropdown */}
            {open && (
                <div
                    className="absolute z-50 left-0 right-0 mt-1 overflow-hidden"
                    style={{
                        borderRadius: 14,
                        background: "linear-gradient(160deg, rgba(10,18,42,0.97) 0%, rgba(4,8,22,0.99) 100%)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(100,160,255,0.08)",
                    }}
                >
                    {loading && (
                        <div className="px-4 py-2 text-xs text-muted-foreground/60 animate-pulse">
                            Searching…
                        </div>
                    )}
                    {suggestions.map((s, i) => (
                        <button
                            key={s.symbol}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/[0.05] transition-colors"
                            style={{
                                borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-sm text-white">{s.symbol}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[180px]">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[10px] text-muted-foreground/50">{s.exchange}</span>
                                <span
                                    className="text-[10px] px-1.5 py-0.5 rounded"
                                    style={{
                                        background: "rgba(37,99,235,0.15)",
                                        color: "rgba(100,160,255,0.8)",
                                        border: "1px solid rgba(59,130,246,0.2)",
                                    }}
                                >
                                    {TYPE_LABEL[s.type] ?? s.type}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
