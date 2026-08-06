"use client";

export interface BusinessHourConfig {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface BusinessHourRowProps {
  dayLabel: string;
  dayValue: number;
  config: BusinessHourConfig | undefined;
  onToggle: (dayIndex: number) => void;
  onUpdateTime: (
    dayIndex: number,
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
  const isOpen = !!config;

  return (
    <div className="flex items-center gap-4 py-2 border-b border-[#e9e9e7]/50 dark:border-[#2d2d2d]/50 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 px-2 -mx-2 rounded transition-colors">
      <div className="w-28 flex items-center gap-3">
        <input
          type="checkbox"
          checked={isOpen}
          onChange={() => onToggle(dayValue)}
          className="w-4 h-4 cursor-pointer accent-black dark:accent-white"
        />
        <span
          className={`text-sm font-medium ${
            isOpen
              ? "text-[#37352f] dark:text-white"
              : "text-[#37352f]/40 dark:text-[#9b9b9b]/50"
          }`}
        >
          {dayLabel}
        </span>
      </div>

      {isOpen && config ? (
        <div className="flex items-center gap-2 text-sm">
          <input
            type="time"
            value={config.startTime}
            onChange={(e) =>
              onUpdateTime(dayValue, "startTime", e.target.value)
            }
            className="bg-transparent border border-[#e9e9e7] dark:border-[#333] rounded px-2 py-1 text-[#37352f] dark:text-white focus:outline-none focus:border-black dark:focus:border-white cursor-pointer transition-colors"
          />
          <span className="text-[#37352f]/40 dark:text-[#9b9b9b]">to</span>
          <input
            type="time"
            value={config.endTime}
            onChange={(e) => onUpdateTime(dayValue, "endTime", e.target.value)}
            className="bg-transparent border border-[#e9e9e7] dark:border-[#333] rounded px-2 py-1 text-[#37352f] dark:text-white focus:outline-none focus:border-black dark:focus:border-white cursor-pointer transition-colors"
          />
        </div>
      ) : (
        <div className="text-sm text-[#37352f]/40 dark:text-[#9b9b9b]/50 italic pl-1">
          Closed
        </div>
      )}
    </div>
  );
}
