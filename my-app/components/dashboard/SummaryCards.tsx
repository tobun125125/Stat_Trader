import { MonthlyTradingStat } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Target, Activity, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  stats: MonthlyTradingStat | null;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  // Use default zero values if no stats are found for this month
  const profit = stats?.monthly_profit || 0;
  const isPositive = profit >= 0;
  const winRate = stats?.win_rate_percent || 0;
  const totalTrades = stats?.total_trades || 0;
  const winTrades = stats?.win_trades || 0;
  const lossTrades = totalTrades - winTrades;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Net Profit Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={cn("text-2xl font-bold flex items-center", isPositive ? "text-emerald-500" : "text-rose-500")}>
            {isPositive ? <ArrowUpRight className="mr-1 h-5 w-5" /> : <ArrowDownRight className="mr-1 h-5 w-5" />}
            ${Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total realized P/L this month
          </p>
        </CardContent>
      </Card>

      {/* Win Rate Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
          <div className="w-full bg-secondary h-2 mt-2 rounded-full overflow-hidden">
            <div 
              className={cn("h-full", winRate >= 50 ? "bg-emerald-500" : "bg-rose-500")} 
              style={{ width: `${winRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Total Trades Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTrades}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Executions closed this month
          </p>
        </CardContent>
      </Card>

      {/* Win / Loss Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Win / Loss</CardTitle>
          <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center">
            <span className="text-[10px] font-bold">W/L</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <span className="text-emerald-500">{winTrades}W</span>
            <span className="text-muted-foreground mx-2">-</span>
            <span className="text-rose-500">{lossTrades}L</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Absolute win and loss count
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
