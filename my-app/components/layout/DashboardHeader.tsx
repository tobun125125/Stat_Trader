"use client";

import { ArrowLeft, ArrowRight, BarChart3 } from "lucide-react";
import { addMonths, format, subMonths } from "date-fns";

interface DashboardHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function DashboardHeader({ currentDate, onDateChange }: DashboardHeaderProps) {
  const handlePrevMonth = () => onDateChange(subMonths(currentDate, 1));
  const handleNextMonth = () => onDateChange(addMonths(currentDate, 1));

  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span>StatTrader Dashboard</span>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center rounded-md border border-input bg-background">
            <button
              onClick={handlePrevMonth}
              className="flex items-center justify-center h-10 w-10 text-muted-foreground hover:text-foreground transition-colors border-r"
              aria-label="Previous month"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center justify-center h-10 px-4 min-w-[140px] font-medium text-sm">
              {format(currentDate, "MMMM yyyy")}
            </div>
            <button
              onClick={handleNextMonth}
              className="flex items-center justify-center h-10 w-10 text-muted-foreground hover:text-foreground transition-colors border-l"
              aria-label="Next month"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
