"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { TradingCalendar } from "@/components/dashboard/TradingCalendar";
import { DailyTradingStat, MonthlyTradingStat } from "@/types/supabase";

interface DashboardClientProps {
  initialDate: Date;
  dailyStats: DailyTradingStat[];
  monthlyStats: MonthlyTradingStat | null;
}

export function DashboardClient({ initialDate, dailyStats, monthlyStats }: DashboardClientProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);

  // When date changes, update the URL to trigger server-side fetch
  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
    const monthStr = format(newDate, "yyyy-MM");
    router.push(`/?month=${monthStr}`, { scroll: false });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <DashboardHeader currentDate={currentDate} onDateChange={handleDateChange} />
      
      <main className="flex-1 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Monthly Overview</h2>
          <SummaryCards stats={monthlyStats} />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Daily Performance</h2>
          <TradingCalendar currentDate={currentDate} dailyStats={dailyStats} />
        </div>
      </main>
    </div>
  );
}
