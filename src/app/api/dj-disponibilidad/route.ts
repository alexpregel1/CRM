import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const VALID_DJS = [
    "Felipe", "Diego", "Peche", "Luis", "Juan Cavero",
    "Ichi", "Raiboc", "Los Pregel", "Ramón", "Topete"
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { dj, fecha_inicio, fecha_fin, motivo } = body;

        // ── Validation ──────────────────────────────────────────────────────────

        if (!dj) {
            return NextResponse.json({ error: "DJ requerido" }, { status: 400 });
        }

        const requestedDjs = dj.split(',').map((d: string) => d.trim());
        const invalidDjs = requestedDjs.filter((d: string) => !VALID_DJS.includes(d));

        if (invalidDjs.length > 0) {
            return NextResponse.json({ error: "DJ(s) inválido(s): " + invalidDjs.join(', ') }, { status: 400 });
        }
        if (!fecha_inicio || !/^\d{4}-\d{2}-\d{2}$/.test(fecha_inicio)) {
            return NextResponse.json({ error: "Fecha de inicio inválida" }, { status: 400 });
        }

        const efectiva_fin = fecha_fin && /^\d{4}-\d{2}-\d{2}$/.test(fecha_fin)
            ? fecha_fin
            : fecha_inicio;

        // ── Insert into Supabase ─────────────────────────────────────────────────
        const { error } = await supabase.from("dj_disponibilidad").insert({
            dj,
            fecha_inicio,
            fecha_fin: efectiva_fin,
            motivo: motivo || null,
            created_at: new Date().toISOString(),
        });

        if (error) {
            console.error("Supabase insert error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            ok: true,
            message: `Disponibilidad de ${dj} registrada correctamente`,
            data: { dj, fecha_inicio, fecha_fin: efectiva_fin, motivo },
        });

    } catch (err: unknown) {
        console.error("DJ disponibilidad API error:", err);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// Optional: GET endpoint to list blocked dates (for future use in calendar)
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const dj = url.searchParams.get("dj");

    try {
        let query = supabase
            .from("dj_disponibilidad")
            .select("*")
            .order("fecha_inicio", { ascending: true });

        if (dj && VALID_DJS.includes(dj)) {
            query = query.eq("dj", dj);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ disponibilidad: data });
    } catch (err: unknown) {
        console.error("GET DJ disponibilidad error:", err);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
