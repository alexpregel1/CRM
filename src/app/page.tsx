import fs from "fs";
import path from "path";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RSRankingHeader } from "@/components/rs-ranking-header";
import {
  FearGreedLabel,
  WSBLabel,
  OptionsPCLabel,
  InsiderLabel,
  WSBTickersLabel,
} from "@/components/dashboard-tooltips";
import { RefreshPythonButton } from "@/components/refresh-python-button";
import { MarketIntelligenceDashboard } from "@/components/market-intelligence-dashboard";

// Fetch data from the generated JSON
function getDashboardData() {
  const filePath = path.join(process.cwd(), "public", "dashboard_data.json");
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

export default function DashboardPage() {
  const data = getDashboardData();
  const { fear_greed, wsb, options, insider, live_scores } = data;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 font-sans selection:bg-primary/30">

      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Intelligence</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sector Rotation &amp; Macro Signals · Last updated: {new Date(data.last_updated).toLocaleString()}
          </p>
        </div>
        <div>
          <RefreshPythonButton />
        </div>
      </header>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* Fear & Greed */}
        <Card className="bg-card/40 backdrop-blur-sm border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
              CNN Fear &amp; Greed
              <FearGreedLabel />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fear_greed?.score?.toFixed(0) || "N/A"}</div>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              Status: <span className="text-primary font-semibold">{fear_greed?.rating}</span>
            </p>
          </CardContent>
        </Card>

        {/* WSB Sentiment */}
        <Card className="bg-card/40 backdrop-blur-sm border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
              WSB Sentiment
              <WSBLabel />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{wsb?.bull_pct?.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Bullish (Analyzed {wsb?.post_count} posts)
            </p>
          </CardContent>
        </Card>

        {/* Options Flow */}
        <Card className="bg-card/40 backdrop-blur-sm border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
              Options P/C OI
              <OptionsPCLabel />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${options?.pc_oi_ratio > 1.2 ? "text-red-500" : "text-green-500"}`}>
              {options?.pc_oi_ratio?.toFixed(2) || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              CBOE SPY Ratio
            </p>
          </CardContent>
        </Card>

        {/* Insider Flow */}
        <Card className="bg-card/40 backdrop-blur-sm border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wider uppercase flex items-center gap-1.5">
              Insider Activity
              <InsiderLabel />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {insider?.cluster_buys?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cluster Buys (Last 30d)
            </p>
          </CardContent>
        </Card>

      </div>

      <MarketIntelligenceDashboard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* SECTORS COLUMN */}
        <div className="space-y-6">
          <Card className="bg-card/40 backdrop-blur-sm border-white/5">
            <CardHeader className="border-b border-white/5 bg-secondary/30 pb-3">
              <RSRankingHeader />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {live_scores?.map((item: { ticker: string; rank: number; sector: string; rs_composite: number }, idx: number) => (
                  <div key={item.ticker} className={`flex items-center justify-between p-3 ${idx < 2 ? "bg-primary/5" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-5 text-center text-xs text-muted-foreground">{item.rank}</div>
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          {item.ticker}
                          {idx < 2 && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.sector}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-mono ${item.rs_composite > 0 ? "text-green-500" : "text-red-500"}`}>
                      {item.rs_composite > 0 ? "+" : ""}{item.rs_composite.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SENTIMENT / OPTIONS COLUMN */}
        <div className="space-y-6">
          <Card className="bg-card/40 backdrop-blur-sm border-white/5">
            <CardHeader className="border-b border-white/5 bg-secondary/30 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                WallStreetBets Top Tickers
                <WSBTickersLabel />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {wsb?.top_tickers?.slice(0, 10).map(([ticker, mentions]: [string, number]) => (
                  <div key={ticker} className="flex items-center">
                    <div className="w-12 font-bold text-sm tracking-wider">{ticker}</div>
                    <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden mx-3">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min((mentions / wsb.top_tickers[0][1]) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="w-6 text-right text-xs text-muted-foreground">{mentions}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
