"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, subMonths, addMonths } from "date-fns";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { TradingCalendar } from "@/components/dashboard/TradingCalendar";
import { DailyTradingStat, MonthlyTradingStat } from "@/types/supabase";
import { AlertModal } from "@/components/ui/AlertModal";
import { MonthYearPicker } from "@/components/ui/MonthYearPicker";
import { Download, ArrowLeft, ArrowRight } from "lucide-react";
import { applyWorksheetStyling, TRADING_SUMMARY_COLUMNS, YEARLY_SUMMARY_COLUMNS } from "@/lib/exportExcel";
import { createClient } from "@/utils/supabase/client";

interface ManageClientProps {
  initialDate: Date;
  dailyStats: DailyTradingStat[];
  monthlyStats: MonthlyTradingStat | null;
  yearlyMonthlyStats: MonthlyTradingStat[];
}

const THAI_MONTH_NAMES: Record<string, string> = {
  '01': 'มกราคม', '02': 'กุมภาพันธ์', '03': 'มีนาคม',
  '04': 'เมษายน', '05': 'พฤษภาคม', '06': 'มิถุนายน',
  '07': 'กรกฎาคม', '08': 'สิงหาคม', '09': 'กันยายน',
  '10': 'ตุลาคม', '11': 'พฤศจิกายน', '12': 'ธันวาคม',
};

export function ManageClient({ initialDate, dailyStats, monthlyStats, yearlyMonthlyStats }: ManageClientProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [isExporting, setIsExporting] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // When date changes, update the URL to trigger server-side fetch
  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
    const monthStr = format(newDate, "yyyy-MM");
    router.push(`/manage?month=${monthStr}`, { scroll: false });
  };

  const handlePrevMonth = () => handleDateChange(subMonths(currentDate, 1));
  const handleNextMonth = () => handleDateChange(addMonths(currentDate, 1));

  // Real-time Auto Refresh (ทุกๆ 60 วินาที)
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 60000);

    return () => clearInterval(interval);
  }, [router]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (!yearlyMonthlyStats || yearlyMonthlyStats.length === 0) {
        setModalMessage("ไม่มีข้อมูลให้ Export ในปีนี้ครับ");
        setIsExporting(false);
        return;
      }

      const yearStr = format(currentDate, "yyyy");

      const ExcelJS = await import('exceljs');
      const { saveAs } = await import('file-saver');
      const supabase = createClient();

      const workbook = new ExcelJS.Workbook();

      // ──────────────────────────────────────────────
      // 1. Create one sheet per month with daily details
      // ──────────────────────────────────────────────
      for (const monthlyStat of yearlyMonthlyStats) {
        const monthKey = monthlyStat.trade_month; // e.g. "2026-05"
        const mm = monthKey.substring(5, 7);      // e.g. "05"
        const thaiName = THAI_MONTH_NAMES[mm] || monthKey;
        const sheetName = `${thaiName} (${monthKey})`;

        // Fetch daily stats for this month
        const { data: dailyData } = await supabase
          .from("daily_trading_stats")
          .select("*")
          .like("trade_date", `${monthKey}-%`)
          .order("trade_date", { ascending: true });

        const ws = workbook.addWorksheet(sheetName);
        ws.columns = TRADING_SUMMARY_COLUMNS;
        ws.getRow(1).height = 25;

        // Add daily rows
        if (dailyData && dailyData.length > 0) {
          dailyData.forEach((stat: DailyTradingStat) => {
            ws.addRow({
              date: stat.trade_date,
              trades: stat.total_trades,
              wins: stat.win_trades,
              winRate: stat.win_rate_percent / 100,
              profit: Number(stat.daily_profit.toFixed(2))
            });
          });
        }

        // Add monthly summary row
        ws.addRow({
          date: `สรุปผลรวมเดือน${thaiName} (Total)`,
          trades: monthlyStat.total_trades,
          wins: monthlyStat.win_trades,
          winRate: monthlyStat.win_rate_percent / 100,
          profit: Number(monthlyStat.monthly_profit.toFixed(2))
        });

        applyWorksheetStyling(ws);
      }

      // ──────────────────────────────────────────────
      // 2. Create yearly summary sheet
      // ──────────────────────────────────────────────
      const summaryWs = workbook.addWorksheet(`สรุปรวมปี ${yearStr}`);
      summaryWs.columns = YEARLY_SUMMARY_COLUMNS;
      summaryWs.getRow(1).height = 25;

      let totalTrades = 0;
      let totalWins = 0;
      let totalProfit = 0;

      yearlyMonthlyStats.forEach(stat => {
        totalTrades += stat.total_trades;
        totalWins += stat.win_trades;
        totalProfit += stat.monthly_profit;

        const mm = stat.trade_month.substring(5, 7);
        const thaiName = THAI_MONTH_NAMES[mm] || stat.trade_month;

        summaryWs.addRow({
          month: `${thaiName} (${stat.trade_month})`,
          trades: stat.total_trades,
          wins: stat.win_trades,
          winRate: stat.win_rate_percent / 100,
          profit: Number(stat.monthly_profit.toFixed(2))
        });
      });

      // Grand total row
      const overallWinRate = totalTrades > 0 ? (totalWins / totalTrades) : 0;
      summaryWs.addRow({
        month: `สรุปผลรวมทั้งปี ${yearStr} (Year Total)`,
        trades: totalTrades,
        wins: totalWins,
        winRate: overallWinRate,
        profit: Number(totalProfit.toFixed(2))
      });

      applyWorksheetStyling(summaryWs);

      // ──────────────────────────────────────────────
      // 3. Save the file
      // ──────────────────────────────────────────────
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `trading_summary_${yearStr}.xlsx`);

    } catch (error) {
      console.error(error);
      setModalMessage("เกิดข้อผิดพลาดในการ Export ข้อมูล (อาจจะยังไม่ได้ลง Plugin โปรดดูคำแนะนำ)");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 relative">
      {/* Custom Modal */}
      {modalMessage && (
        <AlertModal message={modalMessage} onClose={() => setModalMessage(null)} />
      )}
      
      <main className="flex-1 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full space-y-8">
        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight">Monthly Overview</h2>
              
              {/* Month Navigator */}
              <div className="flex items-center rounded-md border border-input bg-background self-start sm:self-auto">
                <button
                  onClick={handlePrevMonth}
                  className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground transition-colors border-r"
                  aria-label="Previous month"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <MonthYearPicker currentDate={currentDate} onSelect={handleDateChange} />
                <button
                  onClick={handleNextMonth}
                  className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground transition-colors border-l"
                  aria-label="Next month"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex sm:justify-end">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Exporting..." : `Export Excel ${format(currentDate, "yyyy")}`}
              </button>
            </div>
          </div>
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
