"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";

const THAI_MONTH_NAMES = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.",
  "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.",
  "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

const THAI_DAY_HEADERS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

interface DayPickerProps {
  currentDate: Date;
  onSelect: (date: Date) => void;
}

export function DayPicker({ currentDate, onSelect }: DayPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth());
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());
  const pickerRef = useRef<HTMLDivElement>(null);

  const selectedDay = currentDate.getDate();
  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();

  // Reset view when currentDate changes
  useEffect(() => {
    setViewMonth(currentDate.getMonth());
    setViewYear(currentDate.getFullYear());
  }, [currentDate]);

  // Close picker when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day, 12, 0, 0);
    onSelect(newDate);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(v => v - 1);
    } else {
      setViewMonth(v => v - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(v => v + 1);
    } else {
      setViewMonth(v => v + 1);
    }
  };

  const daysInMonth = getDaysInMonth(new Date(viewYear, viewMonth, 1));
  const firstDayOfWeek = getDay(startOfMonth(new Date(viewYear, viewMonth, 1)));

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="relative" ref={pickerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-9 px-3 min-w-[150px] font-medium text-sm 
                   hover:bg-muted/50 transition-all cursor-pointer group rounded-sm"
        type="button"
      >
        <Calendar className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="group-hover:text-primary transition-colors">
          {selectedDay} {THAI_MONTH_NAMES[selectedMonth]} {selectedYear}
        </span>
      </button>

      {/* Dropdown Picker */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
                        w-[300px] rounded-xl border bg-popover text-popover-foreground shadow-xl
                        animate-in fade-in-0 zoom-in-95 duration-200">
          
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <button
              onClick={handlePrevMonth}
              className="h-8 w-8 rounded-md flex items-center justify-center 
                         hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold tracking-wide">
              {THAI_MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="h-8 w-8 rounded-md flex items-center justify-center 
                         hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0.5 px-3 pt-3 pb-1">
            {THAI_DAY_HEADERS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="h-9" />;
              }

              const isSelected = day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear;
              const isToday = day === todayDay && viewMonth === todayMonth && viewYear === todayYear;

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  type="button"
                  className={`
                    h-9 rounded-lg text-sm font-medium transition-all duration-150
                    ${isSelected
                      ? "bg-primary text-primary-foreground shadow-sm scale-105"
                      : isToday
                        ? "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                        : "hover:bg-muted text-foreground"
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="border-t px-3 py-2 flex gap-2">
            <button
              onClick={() => {
                const now = new Date();
                setViewYear(now.getFullYear());
                setViewMonth(now.getMonth());
                handleDayClick(now.getDate());
              }}
              type="button"
              className="flex-1 h-8 rounded-md text-xs font-medium
                         bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              วันนี้
            </button>
            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="flex-1 h-8 rounded-md text-xs font-medium
                         bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
