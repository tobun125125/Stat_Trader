"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface YearPickerProps {
  currentDate: Date;
  onSelect: (date: Date) => void;
}

export function YearPicker({ currentDate, onSelect }: YearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [decadeStart, setDecadeStart] = useState(
    Math.floor(currentDate.getFullYear() / 10) * 10
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  const selectedYear = currentDate.getFullYear();

  // Reset decade when currentDate changes
  useEffect(() => {
    setDecadeStart(Math.floor(currentDate.getFullYear() / 10) * 10);
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

  const handleYearClick = (year: number) => {
    const newDate = new Date(year, 0, 1, 12, 0, 0);
    onSelect(newDate);
    setIsOpen(false);
  };

  const currentYear = new Date().getFullYear();

  // Show 12 years (decade + 2 extra)
  const years = Array.from({ length: 12 }, (_, i) => decadeStart + i);

  return (
    <div className="relative" ref={pickerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-9 px-3 min-w-[100px] font-medium text-sm 
                   hover:bg-muted/50 transition-all cursor-pointer group rounded-sm"
        type="button"
      >
        <Calendar className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="group-hover:text-primary transition-colors">
          {selectedYear}
        </span>
      </button>

      {/* Dropdown Picker */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
                        w-[280px] rounded-xl border bg-popover text-popover-foreground shadow-xl
                        animate-in fade-in-0 zoom-in-95 duration-200">
          
          {/* Decade Navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <button
              onClick={() => setDecadeStart(v => v - 10)}
              className="h-8 w-8 rounded-md flex items-center justify-center 
                         hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold tracking-wide">
              {decadeStart} - {decadeStart + 11}
            </span>
            <button
              onClick={() => setDecadeStart(v => v + 10)}
              className="h-8 w-8 rounded-md flex items-center justify-center 
                         hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Year Grid */}
          <div className="grid grid-cols-3 gap-1.5 p-3">
            {years.map(year => {
              const isSelected = year === selectedYear;
              const isCurrent = year === currentYear;

              return (
                <button
                  key={year}
                  onClick={() => handleYearClick(year)}
                  type="button"
                  className={`
                    h-10 rounded-lg text-sm font-medium transition-all duration-150
                    ${isSelected
                      ? "bg-primary text-primary-foreground shadow-sm scale-105"
                      : isCurrent
                        ? "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                        : "hover:bg-muted text-foreground"
                    }
                  `}
                >
                  {year}
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="border-t px-3 py-2 flex gap-2">
            <button
              onClick={() => {
                const now = new Date();
                setDecadeStart(Math.floor(now.getFullYear() / 10) * 10);
                handleYearClick(now.getFullYear());
              }}
              type="button"
              className="flex-1 h-8 rounded-md text-xs font-medium
                         bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              ปีนี้
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
