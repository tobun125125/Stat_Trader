import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NewDashboardClient } from "@/components/dashboard/NewDashboardClient";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const currentYearStr = new Date().getFullYear().toString();

  // Fetch daily stats for the current year (for daily growth chart)
  const { data: dailyStats, error: dailyError } = await supabase
    .from("daily_trading_stats")
    .select("*")
    .like("trade_date", `${currentYearStr}-%`)
    .order("trade_date", { ascending: true });

  // Fetch all monthly stats (for monthly/yearly growth chart)
  const { data: allMonthlyStats, error: monthlyError } = await supabase
    .from("monthly_trading_stats")
    .select("*")
    .order("trade_month", { ascending: true });

  // Log errors for debugging (errors are handled gracefully by passing empty arrays)
  if (dailyError) console.error("Failed to fetch daily stats:", dailyError.message);
  if (monthlyError) console.error("Failed to fetch monthly stats:", monthlyError.message);

  return (
    <NewDashboardClient 
      dailyStats={dailyStats || []} 
      allMonthlyStats={allMonthlyStats || []} 
    />
  );
}
