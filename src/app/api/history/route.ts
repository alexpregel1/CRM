import { NextRequest, NextResponse } from "next/server";

const PRICE_SERVER = "http://localhost:8001";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const ticker = searchParams.get("ticker")?.trim();
    const period = searchParams.get("period")?.trim() || "1y";

    if (!ticker) return NextResponse.json([]);

    try {
        const response = await fetch(
            `http://localhost:8001/history?ticker=${ticker}&period=${period}`,
            { cache: "no-store" }
        );
        if (!response.ok) return NextResponse.json([]);
        return NextResponse.json(await response.json());
    } catch {
        return NextResponse.json([]);
    }
}
