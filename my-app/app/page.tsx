import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { DashboardClient } from "./DashboardClient";
import { format } from "date-fns";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Determine the target month from search params or use current date
  // e.g. "2026-05"
  const monthParam = typeof searchParams.month === 'string' ? searchParams.month : undefined;
  const targetMonthStr = monthParam || format(new Date(), "yyyy-MM");
  const initialDate = new Date(`${targetMonthStr}-01T12:00:00Z`); // use mid-day UTC to avoid timezone shifts

  // Fetch monthly stats for the specific month
  const { data: monthlyStats } = await supabase
    .from("monthly_trading_stats")
    .select("*")
    .eq("trade_month", targetMonthStr)
    .single();

  // Fetch daily stats for the given month (using LIKE 'YYYY-MM-%')
  const { data: dailyStats } = await supabase
    .from("daily_trading_stats")
    .select("*")
    .like("trade_date", `${targetMonthStr}-%`)
    .order("trade_date", { ascending: true });

  return (
    <DashboardClient 
      initialDate={initialDate} 
      dailyStats={dailyStats || []} 
      monthlyStats={monthlyStats || null} 
    />
  );
}
