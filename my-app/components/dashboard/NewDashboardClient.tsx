"use client";

import { useState, useMemo } from "react";
import { DailyTradingStat, MonthlyTradingStat } from "@/types/supabase";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";

interface NewDashboardClientProps {
  dailyStats: DailyTradingStat[];
  allMonthlyStats: MonthlyTradingStat[];
}

type Timeframe = "Daily" | "Monthly" | "Yearly";

export function NewDashboardClient({ dailyStats, allMonthlyStats }: NewDashboardClientProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("Monthly");

  // Process data based on timeframe
  const chartData = useMemo(() => {
    let cumulative = 0;
    
    if (timeframe === "Daily") {
      // Sort just in case
      const sorted = [...dailyStats].sort((a, b) => a.trade_date.localeCompare(b.trade_date));
      return sorted.map(stat => {
        cumulative += stat.daily_profit;
        return {
          date: stat.trade_date,
          profit: stat.daily_profit,
          cumulative: cumulative,
          trades: stat.total_trades,
          wins: stat.win_trades
        };
      });
    } 
    
    if (timeframe === "Monthly") {
      const sorted = [...allMonthlyStats].sort((a, b) => a.trade_month.localeCompare(b.trade_month));
      return sorted.map(stat => {
        cumulative += stat.monthly_profit;
        return {
          date: stat.trade_month,
          profit: stat.monthly_profit,
          cumulative: cumulative,
          trades: stat.total_trades,
          wins: stat.win_trades
        };
      });
    }

    // Yearly
    const yearlyMap = new Map<string, { profit: number, trades: number, wins: number }>();
    allMonthlyStats.forEach(stat => {
      const year = stat.trade_month.substring(0, 4);
      const existing = yearlyMap.get(year) || { profit: 0, trades: 0, wins: 0 };
      existing.profit += stat.monthly_profit;
      existing.trades += stat.total_trades;
      existing.wins += stat.win_trades;
      yearlyMap.set(year, existing);
    });

    const sortedYears = Array.from(yearlyMap.keys()).sort();
    return sortedYears.map(year => {
      const data = yearlyMap.get(year)!;
      cumulative += data.profit;
      return {
        date: year,
        profit: data.profit,
        cumulative: cumulative,
        trades: data.trades,
        wins: data.wins
      };
    });

  }, [dailyStats, allMonthlyStats, timeframe]);

  // Compute overall stats for the selected timeframe
  const overallStats = useMemo(() => {
    let totalTrades = 0;
    let totalWins = 0;
    let totalProfit = 0;

    chartData.forEach(d => {
      totalTrades += d.trades;
      totalWins += d.wins;
      totalProfit += d.profit;
    });

    const periodCount = chartData.length;
    const avgProfit = periodCount > 0 ? totalProfit / periodCount : 0;

    return { totalProfit, avgProfit };
  }, [chartData]);

  // Extract the latest period's data to show current performance
  const latestStats = useMemo(() => {
    if (chartData.length === 0) return null;
    const latest = chartData[chartData.length - 1]; // The most recent day/month/year
    const winRate = latest.trades > 0 ? (latest.wins / latest.trades) * 100 : 0;
    return {
      date: latest.date,
      profit: latest.profit,
      trades: latest.trades,
      wins: latest.wins,
      winRate
    };
  }, [chartData]);

  const isPositiveLatest = latestStats ? latestStats.profit >= 0 : false;
  const isPositiveTotal = overallStats.totalProfit >= 0;
  const periodName = timeframe === "Daily" ? "วัน" : timeframe === "Monthly" ? "เดือน" : "ปี";
  const periodNameEn = timeframe === "Daily" ? "days" : timeframe === "Monthly" ? "months" : "years";

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 relative">
      <main className="flex-1 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header & Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Performance Growth</h2>
          <div className="flex items-center bg-background border rounded-md p-1 shadow-sm">
            {(["Daily", "Monthly", "Yearly"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 text-sm font-medium rounded-sm transition-colors ${
                  timeframe === tf 
                    ? "bg-primary text-primary-foreground shadow" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards — 5 cards showing Latest Period + Overall Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          {/* Latest Profit */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 bg-primary/10 text-primary text-[10px] font-bold rounded-bl-lg">LATEST</div>
            <div className="flex items-center justify-between">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">กำไร/ขาดทุน ({periodName})</h3>
              {isPositiveLatest ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            </div>
            <div className={`text-2xl font-bold ${isPositiveLatest ? 'text-green-500' : 'text-red-500'}`}>
              {latestStats ? `$${latestStats.profit.toFixed(2)}` : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground truncate" title={latestStats?.date}>
              ข้อมูลล่าสุด: {latestStats?.date || "-"}
            </p>
          </div>

          {/* Latest Win Rate */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Win Rate ({periodName})</h3>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-500">
              {latestStats ? `${latestStats.winRate.toFixed(2)}%` : "0.00%"}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestStats ? `${latestStats.wins} wins / ${latestStats.trades} trades` : "No data"}
            </p>
          </div>

          {/* Latest Trades */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">จำนวนเทรด ({periodName})</h3>
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-500">
              {latestStats?.trades || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Executed trades
            </p>
          </div>

          {/* Cumulative Profit (All Time) */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">กำไรสะสมทั้งหมด (Total)</h3>
              {isPositiveTotal ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            </div>
            <div className={`text-2xl font-bold ${isPositiveTotal ? 'text-green-500' : 'text-red-500'}`}>
              ${overallStats.totalProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              จากทุก{periodName}ในกราฟ
            </p>
          </div>

          {/* Avg Profit per Period */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">กำไรเฉลี่ย/{periodName}</h3>
              {overallStats.avgProfit >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-rose-500" />}
            </div>
            <div className={`text-2xl font-bold ${overallStats.avgProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              ${overallStats.avgProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average per {periodName === "วัน" ? "day" : periodName === "เดือน" ? "month" : "year"}
            </p>
          </div>
        </div>


        {/* Area Chart (Individual PnL) */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-lg">Profit / Loss ({timeframe})</h3>
            <p className="text-sm text-muted-foreground">แสดงกำไร/ขาดทุนแยกตามแต่ละ{periodName}</p>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: any) => {
                    const numValue = typeof value === 'number' ? value : 0;
                    return [`$${numValue.toFixed(2)}`, "Net Profit"];
                  }}
                />
                <Line 
                  type="linear" 
                  dataKey="profit" 
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2, stroke: "#0ea5e9" }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#0ea5e9" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Chart (Cumulative) */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-lg">Cumulative Profit Growth</h3>
            <p className="text-sm text-muted-foreground">แสดงกำไร/ขาดทุนสะสมตั้งแต่จุดเริ่มต้น</p>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: any) => {
                    const numValue = typeof value === 'number' ? value : 0;
                    return [`$${numValue.toFixed(2)}`, "Cumulative Profit"];
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCumulative)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
