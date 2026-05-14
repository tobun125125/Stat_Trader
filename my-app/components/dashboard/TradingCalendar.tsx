import { useMemo } from "react";
import { DailyTradingStat } from "@/types/supabase";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isToday 
} from "date-fns";
import { cn } from "@/lib/utils";

interface TradingCalendarProps {
  currentDate: Date;
  dailyStats: DailyTradingStat[];
}

export function TradingCalendar({ currentDate, dailyStats }: TradingCalendarProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Fix #13: ใช้ Map สำหรับ O(1) lookup แทน .find() ที่เป็น O(n) ต่อวัน
  const statsMap = useMemo(() => {
    const map = new Map<string, DailyTradingStat>();
    dailyStats.forEach(stat => map.set(stat.trade_date, stat));
    return map;
  }, [dailyStats]);

  return (
    <div className="rounded-xl border bg-card shadow overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {weekDays.map((day) => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 bg-background">
        {days.map((day, idx) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const stat = statsMap.get(dateStr); // O(1) lookup
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isCurrentDay = isToday(day);
          
          let bgColor = "bg-background";
          let textColor = "text-foreground";
          let valueText = "";
          
          if (stat) {
            if (stat.daily_profit > 0) {
              bgColor = "bg-emerald-500/10 dark:bg-emerald-500/20";
              textColor = "text-emerald-600 dark:text-emerald-400 font-semibold";
              valueText = `+$${stat.daily_profit.toFixed(2)}`;
            } else if (stat.daily_profit < 0) {
              bgColor = "bg-rose-500/10 dark:bg-rose-500/20";
              textColor = "text-rose-600 dark:text-rose-400 font-semibold";
              valueText = `-$${Math.abs(stat.daily_profit).toFixed(2)}`;
            } else {
              valueText = "$0.00";
              textColor = "text-muted-foreground";
            }
          }

          return (
            <div 
              key={day.toString()} 
              className={cn(
                "min-h-[120px] p-2 border-r border-b relative group transition-colors",
                !isCurrentMonth && "opacity-40 bg-muted/30",
                bgColor,
                // Remove right border for the last day of the week
                (idx + 1) % 7 === 0 && "border-r-0"
              )}
            >
              <div className="flex justify-between items-start">
                <span className={cn(
                  "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                  isCurrentDay ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )}>
                  {format(day, dateFormat)}
                </span>
              </div>
              
              {stat && (
                <div className="mt-2 flex flex-col h-full gap-1">
                  <div className={cn("text-sm text-right", textColor)}>
                    {valueText}
                  </div>
                  
                  {/* Tooltip Simulation via Group Hover */}
                  <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover/95 text-popover-foreground text-xs p-2 rounded shadow-lg border pointer-events-none z-10 flex flex-col gap-1">
                    <div className="font-semibold">{format(day, "MMM do, yyyy")}</div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trades:</span>
                      <span>{stat.total_trades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Win Rate:</span>
                      <span className={stat.win_rate_percent >= 50 ? "text-emerald-500" : "text-rose-500"}>
                        {stat.win_rate_percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
