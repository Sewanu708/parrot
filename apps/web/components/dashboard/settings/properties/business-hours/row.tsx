"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export interface BusinessHourConfig {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface BusinessHourRowProps {
  dayLabel: string;
  dayValue: number;
  config?: BusinessHourConfig;
  onToggle: (dayValue: number) => void;
  onUpdateTime: (
    dayValue: number,
    field: "startTime" | "endTime",
    value: string,
  ) => void;
}

export function BusinessHourRow({
  dayLabel,
  dayValue,
  config,
  onToggle,
  onUpdateTime,
}: BusinessHourRowProps) {
  const isEnabled = !!config;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#e9e9e7] dark:border-[#2d2d2d] last:border-0">
      <div className="flex items-center gap-3 w-32">
        <Checkbox
          checked={isEnabled}
          onCheckedChange={() => onToggle(dayValue)}
          id={`day-${dayValue}`}
        />
        <label
          htmlFor={`day-${dayValue}`}
          className={`text-sm font-medium cursor-pointer ${
            isEnabled
              ? "text-[#37352f] dark:text-white"
              : "text-[#37352f]/40 dark:text-[#9b9b9b]"
          }`}
        >
          {dayLabel}
        </label>
      </div>

      {isEnabled ? (
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={config.startTime}
            onChange={(e) => onUpdateTime(dayValue, "startTime", e.target.value)}
            className="w-32 h-8 text-xs font-mono text-[#37352f] dark:text-white bg-white dark:bg-[#191919]"
          />
          <span className="text-xs text-[#37352f]/40 dark:text-[#9b9b9b]">to</span>
          <Input
            type="time"
            value={config.endTime}
            onChange={(e) => onUpdateTime(dayValue, "endTime", e.target.value)}
            className="w-32 h-8 text-xs font-mono text-[#37352f] dark:text-white bg-white dark:bg-[#191919]"
          />
        </div>
      ) : (
        <span className="text-xs text-[#37352f]/40 dark:text-[#666666] font-medium pr-4">
          Closed
        </span>
      )}
    </div>
  );
}
