"use client";

import { useState, useMemo } from "react";
import { DailyTradingStat, MonthlyTradingStat } from "@/types/supabase";
import {
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

  // Compute stats that actually change per timeframe
  const overallStats = useMemo(() => {
    let totalTrades = 0;
    let totalWins = 0;
    let totalProfit = 0;
    let bestProfit = -Infinity;
    let bestLabel = "";
    let worstProfit = Infinity;
    let worstLabel = "";

    chartData.forEach(d => {
      totalTrades += d.trades;
      totalWins += d.wins;
      totalProfit += d.profit;
      if (d.profit > bestProfit) { bestProfit = d.profit; bestLabel = d.date; }
      if (d.profit < worstProfit) { worstProfit = d.profit; worstLabel = d.date; }
    });

    const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
    const periodCount = chartData.length;
    const avgProfit = periodCount > 0 ? totalProfit / periodCount : 0;

    return { totalTrades, totalWins, totalProfit, winRate, periodCount, avgProfit, bestProfit, bestLabel, worstProfit, worstLabel };
  }, [chartData]);

  const isPositive = overallStats.totalProfit >= 0;
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

        {/* Stats Cards — 5 cards with timeframe-specific data */}
        <div className="grid gap-4 md:grid-cols-5">
          {/* Total Net Profit */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Net Profit</h3>
              {isPositive ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            </div>
            <div className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              ${overallStats.totalProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              จาก {overallStats.periodCount} {periodName} ({periodNameEn})
            </p>
          </div>

          {/* Avg Profit per Period */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">เฉลี่ย/{periodName}</h3>
              {overallStats.avgProfit >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-rose-500" />}
            </div>
            <div className={`text-2xl font-bold ${overallStats.avgProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              ${overallStats.avgProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg per {timeframe === "Daily" ? "day" : timeframe === "Monthly" ? "month" : "year"}
            </p>
          </div>

          {/* Win Rate */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Win Rate</h3>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-500">
              {overallStats.winRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overallStats.totalWins} wins / {overallStats.totalTrades} trades
            </p>
          </div>

          {/* Best Period */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{periodName}ที่ดีที่สุด</h3>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-500">
              {overallStats.bestProfit === -Infinity ? "$0.00" : `$${overallStats.bestProfit.toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground truncate" title={overallStats.bestLabel}>
              {overallStats.bestLabel || "-"}
            </p>
          </div>

          {/* Worst Period */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{periodName}ที่แย่ที่สุด</h3>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-500">
              {overallStats.worstProfit === Infinity ? "$0.00" : `$${overallStats.worstProfit.toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground truncate" title={overallStats.worstLabel}>
              {overallStats.worstLabel || "-"}
            </p>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-lg">Cumulative Profit Growth</h3>
            <p className="text-sm text-muted-foreground">Visualizing your profit accumulation over time</p>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
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
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Cumulative Profit"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#8884d8" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCumulative)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart (Individual PnL) */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-lg">{timeframe} Net Profit</h3>
            <p className="text-sm text-muted-foreground">Profit or loss for each individual period</p>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
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
                  cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Net Profit"]}
                />
                <Bar 
                  dataKey="profit" 
                  radius={[4, 4, 0, 0]}
                >
                  {
                    chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#22c55e' : '#ef4444'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
