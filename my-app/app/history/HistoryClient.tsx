"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { DailyTradingStat, MonthlyTradingStat, TradingDeal } from "@/types/supabase";
import { MonthYearPicker } from "@/components/ui/MonthYearPicker";
import { DayPicker } from "@/components/ui/DayPicker";
import { YearPicker } from "@/components/ui/YearPicker";
import { Calendar, TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, addMonths, addYears, parseISO, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";

type ViewMode = "daily" | "monthly" | "yearly";
type SortField = "date" | "trades" | "wins" | "winRate" | "profit" | "symbol" | "volume" | "type";
type SortDirection = "asc" | "desc";

interface HistoryRow {
  label: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  profit: number;
  symbol?: string;
  volume?: number;
  type?: number;
  _sortKey?: string;
}

const THAI_MONTH_FULL: Record<string, string> = {
  '01': 'มกราคม', '02': 'กุมภาพันธ์', '03': 'มีนาคม',
  '04': 'เมษายน', '05': 'พฤษภาคม', '06': 'มิถุนายน',
  '07': 'กรกฎาคม', '08': 'สิงหาคม', '09': 'กันยายน',
  '10': 'ตุลาคม', '11': 'พฤศจิกายน', '12': 'ธันวาคม',
};

const THAI_DAY_NAMES = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

function formatThaiDate(dateStr: string): string {
  const d = parseISO(dateStr);
  const day = d.getDate();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dayName = THAI_DAY_NAMES[d.getDay()];
  const monthName = THAI_MONTH_FULL[mm] || mm;
  return `${dayName} ${day} ${monthName}`;
}

function tradeTypeLabel(type?: number): string {
  if (type === 0) return "Buy";
  if (type === 1) return "Sell";
  return "-";
}

export function HistoryClient() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Data states
  const [dailyStats, setDailyStats] = useState<DailyTradingStat[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyTradingStat[]>([]);
  const [rawDeals, setRawDeals] = useState<TradingDeal[]>([]);

  // Fetch data based on viewMode + selectedDate
  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      if (viewMode === "daily") {
        const dayStr = format(selectedDate, "yyyy-MM-dd");
        const { data } = await supabase
          .from("trading_deals")
          .select("*")
          .gte("close_time", `${dayStr} 00:00:00`)
          .lte("close_time", `${dayStr} 23:59:59`)
          .order("close_time", { ascending: false });
        setRawDeals(data || []);
      } else if (viewMode === "monthly") {
        const monthStart = format(startOfMonth(selectedDate), "yyyy-MM-dd");
        const monthEnd = format(endOfMonth(selectedDate), "yyyy-MM-dd");
        const { data } = await supabase
          .from("daily_trading_stats")
          .select("*")
          .gte("trade_date", monthStart)
          .lte("trade_date", monthEnd)
          .order("trade_date", { ascending: false });
        setDailyStats(data || []);
      } else if (viewMode === "yearly") {
        const yearStr = format(selectedDate, "yyyy");
        const { data } = await supabase
          .from("monthly_trading_stats")
          .select("*")
          .gte("trade_month", `${yearStr}-01`)
          .lte("trade_month", `${yearStr}-12`)
          .order("trade_month", { ascending: false });
        setMonthlyStats(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch history data:", err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Process rows
  const rows: HistoryRow[] = useMemo(() => {
    let data: HistoryRow[] = [];

    if (viewMode === "daily") {
      data = rawDeals.map(deal => ({
        label: deal.close_time.split(" ")[1] || deal.close_time,
        trades: 1,
        wins: deal.net_profit > 0 ? 1 : 0,
        losses: deal.net_profit < 0 ? 1 : 0,
        winRate: deal.net_profit > 0 ? 100 : 0,
        profit: deal.net_profit,
        symbol: deal.symbol,
        volume: deal.volume,
        type: deal.trade_type,
        _sortKey: deal.close_time,
      }));
    } else if (viewMode === "monthly") {
      data = dailyStats.map(stat => ({
        label: formatThaiDate(stat.trade_date),
        trades: stat.total_trades,
        wins: stat.win_trades,
        losses: stat.total_trades - stat.win_trades,
        winRate: stat.win_rate_percent,
        profit: stat.daily_profit,
        _sortKey: stat.trade_date,
      }));
    } else if (viewMode === "yearly") {
      data = monthlyStats.map(stat => {
        const mm = stat.trade_month.substring(5, 7);
        const yyyy = stat.trade_month.substring(0, 4);
        return {
          label: `${THAI_MONTH_FULL[mm] || stat.trade_month} ${yyyy}`,
          trades: stat.total_trades,
          wins: stat.win_trades,
          losses: stat.total_trades - stat.win_trades,
          winRate: stat.win_rate_percent,
          profit: stat.monthly_profit,
          _sortKey: stat.trade_month,
        };
      });
    }

    return [...data].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sortField) {
        case "date": aVal = a._sortKey || a.label; bVal = b._sortKey || b.label; break;
        case "trades": aVal = a.trades; bVal = b.trades; break;
        case "wins": aVal = a.wins; bVal = b.wins; break;
        case "winRate": aVal = a.winRate; bVal = b.winRate; break;
        case "profit": aVal = a.profit; bVal = b.profit; break;
        case "symbol": aVal = a.symbol || ""; bVal = b.symbol || ""; break;
        case "volume": aVal = a.volume || 0; bVal = b.volume || 0; break;
        case "type": aVal = a.type ?? -1; bVal = b.type ?? -1; break;
        default: aVal = a._sortKey || a.label; bVal = b._sortKey || b.label;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [dailyStats, monthlyStats, rawDeals, viewMode, sortField, sortDir]);

  // Summary
  const summary = useMemo(() => {
    const totalTrades = rows.reduce((sum, r) => sum + r.trades, 0);
    const totalWins = rows.reduce((sum, r) => sum + r.wins, 0);
    const totalProfit = rows.reduce((sum, r) => sum + r.profit, 0);
    const totalWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
    return { totalTrades, totalWins, totalLosses: totalTrades - totalWins, totalProfit, totalWinRate };
  }, [rows]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  // Search filter
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(r =>
      r.label.toLowerCase().includes(q) ||
      (r.symbol && r.symbol.toLowerCase().includes(q)) ||
      r.profit.toString().includes(q)
    );
  }, [rows, searchQuery]);

  // Reset page when data/search/pageSize changes
  useEffect(() => { setCurrentPage(1); }, [filteredRows.length, pageSize]);

  // Pagination
  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  // Page numbers to display
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safeCurrentPage, totalPages]);

  const viewLabel = viewMode === "daily" ? "รายวัน" : viewMode === "monthly" ? "รายเดือน" : "รายปี";
  const colCount = viewMode === "daily" ? 5 : 5;

  const handlePrev = () => {
    if (viewMode === "daily") setSelectedDate(prev => subDays(prev, 1));
    else if (viewMode === "monthly") setSelectedDate(prev => subMonths(prev, 1));
    else if (viewMode === "yearly") setSelectedDate(prev => addYears(prev, -1));
  };

  const handleNext = () => {
    if (viewMode === "daily") setSelectedDate(prev => addDays(prev, 1));
    else if (viewMode === "monthly") setSelectedDate(prev => addMonths(prev, 1));
    else if (viewMode === "yearly") setSelectedDate(prev => addYears(prev, 1));
  };

  const handleDateSelect = (date: Date) => setSelectedDate(date);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 relative">
      <main className="flex-1 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full space-y-6">

        {/* Header + View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Trade History</h2>
              <p className="text-sm text-muted-foreground">ประวัติการเทรดทั้งหมด ({viewLabel})</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Navigator — same style as Manage page */}
            <div className="flex items-center rounded-md border border-input bg-background self-start sm:self-auto">
              <button
                onClick={handlePrev}
                className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground transition-colors border-r"
                aria-label="Previous"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              {viewMode === "daily" && (
                <DayPicker currentDate={selectedDate} onSelect={handleDateSelect} />
              )}
              {viewMode === "monthly" && (
                <MonthYearPicker currentDate={selectedDate} onSelect={handleDateSelect} />
              )}
              {viewMode === "yearly" && (
                <YearPicker currentDate={selectedDate} onSelect={handleDateSelect} />
              )}

              <button
                onClick={handleNext}
                className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground transition-colors border-l"
                aria-label="Next"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-background border rounded-md p-1 shadow-sm overflow-x-auto">
              {(["daily", "monthly", "yearly"] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setViewMode(mode); setSortField("date"); setSortDir("desc"); }}
                  className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-sm transition-colors whitespace-nowrap ${
                    viewMode === mode
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === "daily" ? "วัน" : mode === "monthly" ? "เดือน" : "ปี"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">จำนวนเทรดทั้งหมด</span>
            <span className="text-xl md:text-2xl font-bold text-purple-500">{summary.totalTrades.toLocaleString()}</span>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Win / Loss</span>
            <span className="text-xl md:text-2xl font-bold">
              <span className="text-emerald-500">{summary.totalWins}W</span>
              <span className="text-muted-foreground mx-1">-</span>
              <span className="text-rose-500">{summary.totalLosses}L</span>
            </span>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Win Rate</span>
            <span className={`text-xl md:text-2xl font-bold ${summary.totalWinRate >= 50 ? 'text-blue-500' : 'text-rose-500'}`}>
              {summary.totalWinRate.toFixed(1)}%
            </span>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">กำไร/ขาดทุนสุทธิ</span>
            <span className={`text-xl md:text-2xl font-bold flex items-center gap-1 ${summary.totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {summary.totalProfit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(summary.totalProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-xl border bg-card shadow-sm flex flex-col">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-8 w-16 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search:</span>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-[150px] sm:w-[200px] rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="ค้นหา..."
                />
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">กำลังโหลดข้อมูล...</span>
            </div>
          )}

          {!loading && (
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm relative">
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur shadow-sm">
                  <tr>
                    <th className="text-left p-3 md:p-4 border-b">
                      <button onClick={() => handleSort("date")} className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                        {viewMode === "daily" ? "เวลาปิด" : viewMode === "monthly" ? "วันที่" : "เดือน"}
                        <SortIcon field="date" />
                      </button>
                    </th>
                    {viewMode === "daily" && (
                      <>
                        <th className="text-center p-3 md:p-4 border-b">
                          <button onClick={() => handleSort("symbol")} className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mx-auto">
                            Symbol
                            <SortIcon field="symbol" />
                          </button>
                        </th>
                        <th className="text-center p-3 md:p-4 border-b">
                          <button onClick={() => handleSort("type")} className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mx-auto">
                            Type
                            <SortIcon field="type" />
                          </button>
                        </th>
                        <th className="text-center p-3 md:p-4 border-b hidden sm:table-cell">
                          <button onClick={() => handleSort("volume")} className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mx-auto">
                            Volume
                            <SortIcon field="volume" />
                          </button>
                        </th>
                      </>
                    )}
                    {viewMode !== "daily" && (
                      <>
                        <th className="text-center p-3 md:p-4 border-b">
                          <button onClick={() => handleSort("trades")} className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mx-auto">
                            เทรด
                            <SortIcon field="trades" />
                          </button>
                        </th>
                        <th className="text-center p-3 md:p-4 border-b hidden sm:table-cell">
                          <button onClick={() => handleSort("wins")} className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mx-auto">
                            W / L
                            <SortIcon field="wins" />
                          </button>
                        </th>
                        <th className="text-center p-3 md:p-4 border-b">
                          <button onClick={() => handleSort("winRate")} className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mx-auto">
                            Win Rate
                            <SortIcon field="winRate" />
                          </button>
                        </th>
                      </>
                    )}
                    <th className="text-right p-3 md:p-4 border-b">
                      <button onClick={() => handleSort("profit")} className="flex items-center gap-1.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors ml-auto">
                        กำไร/ขาดทุน
                        <SortIcon field="profit" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={colCount} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Calendar className="h-8 w-8 opacity-40" />
                          <p>ไม่มีข้อมูล</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, idx) => {
                      const isProfit = row.profit > 0;
                      const isLoss = row.profit < 0;

                      return (
                        <tr
                          key={idx}
                          className={`border-b last:border-b-0 hover:bg-muted/30 transition-colors ${idx % 2 === 1 ? 'bg-muted/10' : ''}`}
                        >
                          <td className="p-3 md:p-4 font-medium text-sm">
                            {row.label}
                          </td>
                          {viewMode === "daily" && (
                            <>
                              <td className="p-3 md:p-4 text-center font-mono text-xs md:text-sm text-foreground/80">
                                {row.symbol}
                              </td>
                              <td className="p-3 md:p-4 text-center text-xs md:text-sm">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  row.type === 0
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-rose-500/10 text-rose-500'
                                }`}>
                                  {tradeTypeLabel(row.type)}
                                </span>
                              </td>
                              <td className="p-3 md:p-4 text-center text-sm text-muted-foreground hidden sm:table-cell">
                                {row.volume?.toFixed(2)}
                              </td>
                            </>
                          )}
                          {viewMode !== "daily" && (
                            <>
                              <td className="p-3 md:p-4 text-center text-sm text-muted-foreground">
                                {row.trades}
                              </td>
                              <td className="p-3 md:p-4 text-center text-sm hidden sm:table-cell">
                                <span className="text-emerald-500">{row.wins}W</span>
                                <span className="text-muted-foreground mx-1">-</span>
                                <span className="text-rose-500">{row.losses}L</span>
                              </td>
                              <td className="p-3 md:p-4 text-center text-sm">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  row.winRate >= 60
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : row.winRate >= 40
                                      ? 'bg-amber-500/10 text-amber-500'
                                      : 'bg-rose-500/10 text-rose-500'
                                }`}>
                                  {row.winRate.toFixed(1)}%
                                </span>
                              </td>
                            </>
                          )}
                          <td className="p-3 md:p-4 text-right text-sm font-semibold">
                            <span className={isProfit ? 'text-emerald-500' : isLoss ? 'text-rose-500' : 'text-muted-foreground'}>
                              {isProfit ? '+' : ''}{row.profit < 0 ? '-' : ''}{Math.abs(row.profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* Summary footer */}
                {rows.length > 0 && (
                  <tfoot className="bg-muted/50">
                    <tr className="border-t-2 border-primary/20 font-semibold shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.1)]">
                      <td className="p-3 md:p-4 text-sm">
                        รวมทั้งหมด ({filteredRows.length} {viewMode === "daily" ? "ไม้" : viewMode === "monthly" ? "วัน" : "เดือน"})
                      </td>
                      {viewMode === "daily" ? (
                        <>
                          <td className="p-3 md:p-4"></td>
                          <td className="p-3 md:p-4"></td>
                          <td className="p-3 md:p-4 hidden sm:table-cell"></td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 md:p-4 text-center text-sm">{summary.totalTrades}</td>
                          <td className="p-3 md:p-4 text-center text-sm hidden sm:table-cell">
                            <span className="text-emerald-500">{summary.totalWins}W</span>
                            <span className="text-muted-foreground mx-1">-</span>
                            <span className="text-rose-500">{summary.totalLosses}L</span>
                          </td>
                          <td className="p-3 md:p-4 text-center text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              summary.totalWinRate >= 50 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                            }`}>
                              {summary.totalWinRate.toFixed(1)}%
                            </span>
                          </td>
                        </>
                      )}
                      <td className="p-3 md:p-4 text-right text-sm">
                        <span className={`font-bold ${summary.totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {summary.totalProfit >= 0 ? '+' : '-'}{Math.abs(summary.totalProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && filteredRows.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t text-sm text-muted-foreground">
              <div>
                Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-3 py-1 rounded border hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                
                {pageNumbers.map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[32px] px-2 py-1 rounded transition-colors ${
                      page === safeCurrentPage 
                        ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
                        : 'hover:bg-muted border'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="px-3 py-1 rounded border hover:bg-muted disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
