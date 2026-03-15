import { NextRequest, NextResponse } from "next/server";

const PRICE_SERVER = "http://localhost:8001";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 1) return NextResponse.json([]);

    try {
        const res = await fetch(`${PRICE_SERVER}/search?q=${encodeURIComponent(q)}`, {
            cache: "no-store",
        });
        if (!res.ok) return NextResponse.json([]);
        return NextResponse.json(await res.json());
    } catch {
        return NextResponse.json([]);
    }
}
