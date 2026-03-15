export type DJName = "Diego" | "Felipe" | "Peche" | "Luis" | "Juan Cavero"
    | "Ichi" | "Raiboc" | "Los Pregel" | "Ramón" | "Topete";

export const DJ_NAMES: DJName[] = [
    "Diego", "Felipe", "Peche", "Luis", "Juan Cavero",
    "Ichi", "Raiboc", "Los Pregel", "Ramón", "Topete"
];

export const DJ_CONFIG: Record<DJName, {
    color: string;
    bg: string;
    border: string;
    dot: string;
}> = {
    "Diego": { color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", dot: "bg-violet-400" },
    "Felipe": { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-400" },
    "Peche": { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", dot: "bg-cyan-400" },
    "Juan Cavero": { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", dot: "bg-rose-400" },
    "Ichi": { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
    "Raiboc": { color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", dot: "bg-sky-400" },
    "Los Pregel": { color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", dot: "bg-indigo-400" },
    "Ramón": { color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20", dot: "bg-teal-400" },
    "Topete": { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", dot: "bg-yellow-400" },
    "Luis": { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", dot: "bg-orange-400" }
};

export function detectarDJs(texto: string): DJName[] {
    if (!texto) return [];

    const textNormalized = texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

    const djsDetectadosSet: Set<DJName> = new Set();

    const reglas: { dj: DJName; keywords: string[] }[] = [
        { dj: "Diego", keywords: ["DIEGO"] },
        { dj: "Felipe", keywords: ["FELIPE"] },
        { dj: "Peche", keywords: ["PECHE"] },
        { dj: "Juan Cavero", keywords: ["CAVERO"] },
        { dj: "Ichi", keywords: ["ICHI"] },
        { dj: "Raiboc", keywords: ["RAIBOC"] },
        { dj: "Los Pregel", keywords: ["PREGEL"] },
        { dj: "Ramón", keywords: ["RAMON"] },
        { dj: "Topete", keywords: ["TOPETE"] },
        { dj: "Luis", keywords: ["LUIS"] }
    ];

    for (const regla of reglas) {
        for (const keyword of regla.keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`);
            if (regex.test(textNormalized)) {
                djsDetectadosSet.add(regla.dj);
                break;
            }
        }
    }

    // Alias mapping: "Los Gilca" strictly means both Felipe and Diego
    if (/\b(LOS GILCA)\b/.test(textNormalized)) {
        djsDetectadosSet.add("Felipe");
        djsDetectadosSet.add("Diego");
    }

    return Array.from(djsDetectadosSet);
}

// ─── Packs ───────────────────────────────────────────────────────────────────

export type PackType = "PACK 1" | "PACK 2" | "PACK 3" | "PACK CUSTOM";

export const PACK_CONFIG: Record<PackType, {
    bg: string;
    text: string;
    border: string;
}> = {
    "PACK 1": { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" },
    "PACK 2": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    "PACK 3": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    "PACK CUSTOM": { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" }
};

export function detectarPacks(texto: string): PackType[] {
    if (!texto) return [];

    const textNormalized = texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

    const packsDetectados: Set<PackType> = new Set();

    // Pack 1 / Ambiental
    if (/\b(PACK\s*1|PACK\s*01|AMBIENTAL)\b/.test(textNormalized)) {
        packsDetectados.add("PACK 1");
    }
    // Pack 2 / Esencial
    if (/\b(PACK\s*2|PACK\s*02|ESENCIAL)\b/.test(textNormalized)) {
        packsDetectados.add("PACK 2");
    }
    // Pack 3 / Premium
    if (/\b(PACK\s*3|PACK\s*03|PREMIUM)\b/.test(textNormalized)) {
        packsDetectados.add("PACK 3");
    }
    // Custom / Personalizado
    if (/\b(PACK\s*CUSTOM|PERSONALIZADO)\b/.test(textNormalized)) {
        packsDetectados.add("PACK CUSTOM");
    }

    return Array.from(packsDetectados);
}

export function tieneExtras(descripcion: string | null | undefined): boolean {
    if (!descripcion) return false;

    // 1. Convert to uppercase and normalize to remove accents
    let text = descripcion.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 2. Remove common phrases that describe assignments but aren't extras
    const ignorePhrases = [
        "O UNO DE ELLOS", "O CUALQUIERA", "O LOS DOS", "PENDIENTE DE CONFIRMAR",
        "PENDIENTE", "A CONFIRMAR", "POR CONFIRMAR", "POR DEFINIR", "A DEFINIR"
    ];
    ignorePhrases.forEach(phrase => {
        text = text.replace(new RegExp(phrase, "g"), " ");
    });

    // 3. Remove branding and common non-extra words
    const ignoreWords = [
        "GILCA", "SOUND", "GILCASOUND", "SL", "DJ", "PACK", "BODA", "EVENTO",
        "FIESTA", "CUMPLE", "ANIVERSARIO", "EMPRESA", "SESSION", "REUNION",
        "LLAMADA", "VISITA", "CITA"
    ];
    ignoreWords.forEach(w => {
        text = text.replace(new RegExp(`\\b${w}\\b`, "g"), " ");
    });

    // 4. Remove symbols and numbers that might be part of packs/dates
    text = text.replace(/[\+\-\&\.\,:/]/g, " ");

    // 5. Remove known DJ names
    DJ_NAMES.forEach(dj => {
        const parts = dj.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(" ");
        parts.forEach(p => {
            text = text.replace(new RegExp(`\\b${p}\\b`, "g"), " ");
        });
    });

    // 6. Remove known Pack specifics
    const packWords = ["1", "01", "2", "02", "3", "03", "AMBIENTAL", "ESENCIAL", "PREMIUM", "CUSTOM", "PERSONALIZADO"];
    packWords.forEach(pw => {
        text = text.replace(new RegExp(`\\b${pw}\\b`, "g"), " ");
    });

    // 7. Remove common Spanish connectors and generic small words
    const connectors = [
        "CON", "PARA", "EN", "EL", "LA", "LOS", "LAS", "DE", "DEL", "Y", "UN",
        "UNA", "AL", "POR", "SIN", "NOS", "LES", "SUS", "MIS", "TUS", "QUE", "CUAL"
    ];

    const words = text.split(/\s+/).filter(w => {
        if (w.length <= 2) return false;
        if (connectors.includes(w)) return false;
        // Ignore generic numbers that might have survived
        if (/^\d+$/.test(w)) return false;
        return true;
    });

    return words.length > 0;
}
