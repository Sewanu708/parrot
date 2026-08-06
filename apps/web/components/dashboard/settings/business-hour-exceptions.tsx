"use client";

import { useState } from "react";
import { Plus, Trash2, CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface BusinessHourExceptionConfig {
  id?: string;
  date: string; // YYYY-MM-DD
  isClosed: boolean;
  reason?: string|null;
}

interface BusinessHourExceptionsProps {
  exceptions: BusinessHourExceptionConfig[];
  onAddException: (exception: BusinessHourExceptionConfig) => void;
  onRemoveException: (date: string) => void;
}

export function BusinessHourExceptions({
  exceptions,
  onAddException,
  onRemoveException,
}: BusinessHourExceptionsProps) {
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    onAddException({
      date: newDate,
      isClosed: true,
      reason: newReason.trim() || "Closed for holiday",
    });

    setNewDate("");
    setNewReason("");
  };

  return (
    <div className="space-y-4 pt-6 border-t border-[#e9e9e7] dark:border-[#2d2d2d]">
      <div>
        <h3 className="text-sm font-semibold text-[#37352f] dark:text-white">
          Date Exceptions & Holidays
        </h3>
        <p className="text-xs text-[#37352f]/60 dark:text-[#9b9b9b]">
          Set specific dates when your office is closed or offline.
        </p>
      </div>

      {/* Add Exception Form */}
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
        <Input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="sm:w-44 font-mono text-xs"
          required
        />
        <Input
          type="text"
          placeholder="Reason (e.g., Christmas Day)"
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          className="flex-1 text-xs"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Exception
        </Button>
      </form>

      {/* Exception List */}
      {exceptions.length > 0 ? (
        <div className="divide-y divide-[#e9e9e7]/50 dark:divide-[#2d2d2d]/50 border border-[#e9e9e7] dark:border-[#2d2d2d] rounded-lg bg-neutral-50/50 dark:bg-white/2">
          {exceptions.map((ex) => (
            <div
              key={ex.date}
              className="flex items-center justify-between p-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <CalendarOff className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <span className="font-mono font-semibold text-[#37352f] dark:text-white">
                    {ex.date}
                  </span>
                  <span className="ml-2 text-neutral-500 dark:text-neutral-400">
                    ({ex.reason || "Closed"})
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveException(ex.date)}
                className="h-7 w-7 p-0 text-neutral-400 hover:text-red-500 hover:bg-transparent cursor-pointer"
                title="Remove exception"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-neutral-400 italic">
          No holiday exceptions configured.
        </p>
      )}
    </div>
  );
}
