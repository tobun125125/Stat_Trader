"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, subMonths, addMonths } from "date-fns";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { TradingCalendar } from "@/components/dashboard/TradingCalendar";
import { DailyTradingStat, MonthlyTradingStat } from "@/types/supabase";
import { AlertModal } from "@/components/ui/AlertModal";
import { MonthYearPicker } from "@/components/ui/MonthYearPicker";
import { Download, FileSpreadsheet, ArrowLeft, ArrowRight } from "lucide-react";
import { applyWorksheetStyling, TRADING_SUMMARY_COLUMNS, YEARLY_SUMMARY_COLUMNS } from "@/lib/exportExcel";

interface ManageClientProps {
  initialDate: Date;
  dailyStats: DailyTradingStat[];
  monthlyStats: MonthlyTradingStat | null;
  yearlyMonthlyStats: MonthlyTradingStat[];
}

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

  const handleExportMonthly = async () => {
    setIsExporting(true);
    try {
      if (!dailyStats || dailyStats.length === 0) {
        setModalMessage("ไม่มีข้อมูลให้ Export ในเดือนนี้ครับ");
        setIsExporting(false);
        return;
      }

      const monthStr = format(currentDate, "yyyy-MM");

      const ExcelJS = await import('exceljs');
      const { saveAs } = await import('file-saver');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Trading Summary');

      worksheet.columns = TRADING_SUMMARY_COLUMNS;

      const headerRow = worksheet.getRow(1);
      headerRow.height = 25;

      dailyStats.forEach(stat => {
        worksheet.addRow({
          date: stat.trade_date,
          trades: stat.total_trades,
          wins: stat.win_trades,
          winRate: stat.win_rate_percent / 100, 
          profit: Number(stat.daily_profit.toFixed(2))
        });
      });

      if (monthlyStats) {
        worksheet.addRow({
          date: 'สรุปผลรวมทั้งเดือน (Total)',
          trades: monthlyStats.total_trades,
          wins: monthlyStats.win_trades,
          winRate: monthlyStats.win_rate_percent / 100,
          profit: Number(monthlyStats.monthly_profit.toFixed(2))
        });
      }

      applyWorksheetStyling(worksheet);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `trading_summary_${monthStr}.xlsx`);
      
    } catch (error) {
      console.error(error);
      setModalMessage("เกิดข้อผิดพลาดในการ Export ข้อมูล (อาจจะยังไม่ได้ลง Plugin โปรดดูคำแนะนำ)");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportYearly = async () => {
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

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Yearly Summary ${yearStr}`);

      worksheet.columns = YEARLY_SUMMARY_COLUMNS;

      const headerRow = worksheet.getRow(1);
      headerRow.height = 25;

      let totalTrades = 0;
      let totalWins = 0;
      let totalProfit = 0;

      yearlyMonthlyStats.forEach(stat => {
        totalTrades += stat.total_trades;
        totalWins += stat.win_trades;
        totalProfit += stat.monthly_profit;

        worksheet.addRow({
          month: stat.trade_month,
          trades: stat.total_trades,
          wins: stat.win_trades,
          winRate: stat.win_rate_percent / 100, 
          profit: Number(stat.monthly_profit.toFixed(2))
        });
      });

      // Add Yearly Summary Row
      const overallWinRate = totalTrades > 0 ? (totalWins / totalTrades) : 0;
      worksheet.addRow({
        month: `สรุปผลรวมทั้งปี ${yearStr} (Year Total)`,
        trades: totalTrades,
        wins: totalWins,
        winRate: overallWinRate,
        profit: Number(totalProfit.toFixed(2))
      });

      applyWorksheetStyling(worksheet);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `trading_summary_yearly_${yearStr}.xlsx`);
      
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

            {/* Export Buttons - separate row on mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <button
                onClick={handleExportMonthly}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export Month"}
              </button>
              <button
                onClick={handleExportYearly}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export Year"}
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
