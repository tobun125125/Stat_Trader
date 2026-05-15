import { Calendar } from "lucide-react";

export default function HistoryLoading() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 relative">
      <main className="flex-1 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary animate-pulse" />
            <div>
              <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded-lg animate-pulse mt-1" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-48 bg-muted rounded-md animate-pulse" />
            <div className="h-9 w-32 bg-muted rounded-md animate-pulse" />
          </div>
        </div>

        {/* Summary cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card shadow-sm p-4 flex flex-col gap-2">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-7 w-16 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 w-full bg-muted/60 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
