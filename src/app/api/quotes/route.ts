import { NextRequest, NextResponse } from "next/server";

// Delegates to the local Python yfinance price server running on port 8001.
// This bypasses Yahoo Finance's 429 rate limits that block direct requests.
const PRICE_SERVER = "http://localhost:8001/quotes";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tickers = searchParams.get("tickers");

    if (!tickers) {
        return NextResponse.json({ error: "No tickers provided" }, { status: 400 });
    }

    try {
        const res = await fetch(`${PRICE_SERVER}?tickers=${tickers}`, {
            cache: "no-store",
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("Price server error:", text);
            return NextResponse.json({ error: `Price server error: ${res.status}` }, { status: 502 });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err) {
        console.error("Cannot reach price server:", err);
        return NextResponse.json(
            { error: "Price server unavailable. Run start_dashboard.sh to start it." },
            { status: 503 }
        );
    }
}
