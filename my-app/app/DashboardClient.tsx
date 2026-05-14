"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, addMonths } from "date-fns";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { TradingCalendar } from "@/components/dashboard/TradingCalendar";
import { DailyTradingStat, MonthlyTradingStat } from "@/types/supabase";
import { createClient } from "@/utils/supabase/client";
import { Download } from "lucide-react";

interface DashboardClientProps {
  initialDate: Date;
  dailyStats: DailyTradingStat[];
  monthlyStats: MonthlyTradingStat | null;
}

export function DashboardClient({ initialDate, dailyStats, monthlyStats }: DashboardClientProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [isExporting, setIsExporting] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const supabase = createClient();

  // When date changes, update the URL to trigger server-side fetch
  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
    const monthStr = format(newDate, "yyyy-MM");
    router.push(`/?month=${monthStr}`, { scroll: false });
  };

  // Real-time Auto Refresh (ทุกๆ 60 วินาที)
  useEffect(() => {
    const interval = setInterval(() => {
      // สั่งให้ Next.js ไปดึงข้อมูลชุดใหม่จาก Server (Supabase) แบบแนบเนียน
      router.refresh();
    }, 60000); // 60,000 ms = 60 วินาที

    return () => clearInterval(interval);
  }, [router]);

  const handleExport = async () => {
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

      // 1. ปรับความกว้างคอลัมน์แรกให้กว้างขึ้น เพื่อไม่ให้คำว่า "สรุปผลรวมทั้งเดือน" โดนตัด
      worksheet.columns = [
        { header: 'วันที่ (Date)', key: 'date', width: 28 },
        { header: 'จำนวนเทรด (Trades)', key: 'trades', width: 20 },
        { header: 'ชนะ (Win)', key: 'wins', width: 15 },
        { header: 'Win Rate (%)', key: 'winRate', width: 15 },
        { header: 'กำไร/ขาดทุนสุทธิ (Net Profit)', key: 'profit', width: 30 }
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.height = 25;

      dailyStats.forEach(stat => {
        worksheet.addRow({
          date: stat.trade_date,
          trades: stat.total_trades,
          wins: stat.win_trades,
          // 2. ส่งค่าเป็นตัวเลขทศนิยม (เช่น 0.6333) แทนการส่งเป็น Text "63.33%" 
          // เพื่อแก้ปัญหาจุดสีเขียวมุมซ้ายบนใน Excel (Number stored as text)
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

      const lastRow = worksheet.rowCount;
      const colCount = 5; // จำกัดแค่ 5 คอลัมน์เท่านั้น

      worksheet.eachRow((row, rowNumber) => {
        // จัดรูปแบบเฉพาะคอลัมน์ 1-5 เท่านั้น ป้องกันเซลล์เปล่าล้นออกไปทางขวา
        for (let colNumber = 1; colNumber <= colCount; colNumber++) {
          const cell = row.getCell(colNumber);

          // --- Border ---
          const isLastRow = rowNumber === lastRow;
          cell.border = {
            top: isLastRow ? { style: 'medium' } : { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };

          // --- Header Row ---
          if (rowNumber === 1) {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF0F172A' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            continue;
          }

          // --- Summary Row (last row) ---
          if (isLastRow) {
            cell.font = { bold: true, size: 12 };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF1F5F9' }
            };
            cell.height = 25;
          } else if (rowNumber % 2 === 0) {
            // --- Alternating row color (แถวคู่) ---
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' }
            };
          }

          // --- Column-specific formatting ---
          if (colNumber === 1) {
            cell.alignment = { vertical: 'middle', horizontal: isLastRow ? 'left' : 'center' };
          } else if (colNumber === 2 || colNumber === 3) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.numFmt = '#,##0';
          } else if (colNumber === 4) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.numFmt = '0.00%';
          } else if (colNumber === 5) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '#,##0.00';

            const val = Number(cell.value);
            if (val > 0) {
              cell.font = { ...cell.font, color: { argb: 'FF16A34A' } };
            } else if (val < 0) {
              cell.font = { ...cell.font, color: { argb: 'FFDC2626' } };
            }
          }
        }

        // กำหนดความสูงแถวสรุป
        if (rowNumber === lastRow) {
          row.height = 25;
        }
      });

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

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 relative">
      <DashboardHeader currentDate={currentDate} onDateChange={handleDateChange} />
      
      {/* Custom Modal */}
      {modalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-semibold text-lg text-foreground">แจ้งเตือน</h3>
            <p className="text-muted-foreground text-sm">{modalMessage}</p>
            <div className="flex justify-end">
              <button 
                onClick={() => setModalMessage(null)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-1 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Monthly Overview</h2>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Export to Excel"}
            </button>
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
