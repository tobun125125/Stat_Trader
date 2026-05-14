import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { ManageClient } from "./ManageClient";
import { format } from "date-fns";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ManagePage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Determine the target month from search params or use current date
  const monthParam = typeof searchParams.month === 'string' ? searchParams.month : undefined;
  const targetMonthStr = monthParam || format(new Date(), "yyyy-MM");
  const initialDate = new Date(`${targetMonthStr}-01T12:00:00Z`);

  // Target year
  const targetYearStr = targetMonthStr.substring(0, 4);

  // Fetch monthly stats for the specific month
  const { data: monthlyStats, error: monthlyError } = await supabase
    .from("monthly_trading_stats")
    .select("*")
    .eq("trade_month", targetMonthStr)
    .single();

  // Fetch daily stats for the given month
  const { data: dailyStats, error: dailyError } = await supabase
    .from("daily_trading_stats")
    .select("*")
    .like("trade_date", `${targetMonthStr}-%`)
    .order("trade_date", { ascending: true });

  // Fetch all monthly stats for the current year (for yearly export/aggregation)
  const { data: yearlyMonthlyStats, error: yearlyError } = await supabase
    .from("monthly_trading_stats")
    .select("*")
    .like("trade_month", `${targetYearStr}-%`)
    .order("trade_month", { ascending: true });

  // Log errors for debugging
  if (monthlyError && monthlyError.code !== 'PGRST116') {
    // PGRST116 = "no rows found" which is expected for months with no data
    console.error("Failed to fetch monthly stats:", monthlyError.message);
  }
  if (dailyError) console.error("Failed to fetch daily stats:", dailyError.message);
  if (yearlyError) console.error("Failed to fetch yearly stats:", yearlyError.message);

  return (
    <ManageClient 
      initialDate={initialDate} 
      dailyStats={dailyStats || []} 
      monthlyStats={monthlyStats || null}
      yearlyMonthlyStats={yearlyMonthlyStats || []}
    />
  );
}
