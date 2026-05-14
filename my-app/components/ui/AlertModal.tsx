"use client";

import React from "react";

interface AlertModalProps {
  message: string;
  onClose: () => void;
}

export function AlertModal({ message, onClose }: AlertModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="font-semibold text-lg text-foreground">แจ้งเตือน</h3>
        <p className="text-muted-foreground text-sm">{message}</p>
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
}
