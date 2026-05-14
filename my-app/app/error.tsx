"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 items-center justify-center">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-sm text-muted-foreground">
            {error.message || "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง"}
          </p>
        </div>
        <button
          onClick={reset}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          ลองใหม่
        </button>
      </div>
    </div>
  );
}
