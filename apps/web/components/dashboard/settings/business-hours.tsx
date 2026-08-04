"use client";

import { useState, useEffect } from "react";
import notify from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { useBusinessHours, useUpdateBusinessHours } from "@/hooks/use-settings";

const DAYS = [
  { label: "Monday", val: 1 },
  { label: "Tuesday", val: 2 },
  { label: "Wednesday", val: 3 },
  { label: "Thursday", val: 4 },
  { label: "Friday", val: 5 },
  { label: "Saturday", val: 6 },
  { label: "Sunday", val: 0 },
];

export function BusinessHoursSettings({ propertyId }: { propertyId: string }) {
  const [hours, setHours] = useState<any[]>([]);

  const { data, isLoading } = useBusinessHours(propertyId);
  const updateMutation = useUpdateBusinessHours();

  useEffect(() => {
    if (data?.data) {
      setHours(data.data.hours || []);
    }
  }, [data]);

  const handleSave = () => {
    updateMutation.mutate(
      { propertyId, data: { hours } },
      {
        onSuccess: () => notify.success("Business hours updated successfully!"),
        onError: () => notify.error("Failed to update business hours"),
      },
    );
  };

  const toggleDay = (dayIndex: number) => {
    const exists = hours.find((h) => h.dayOfWeek === dayIndex);
    if (exists) {
      setHours(hours.filter((h) => h.dayOfWeek !== dayIndex));
    } else {
      setHours([
        ...hours,
        { dayOfWeek: dayIndex, startTime: "09:00", endTime: "17:00" },
      ]);
    }
  };

  const updateTime = (
    dayIndex: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setHours(
      hours.map((h) =>
        h.dayOfWeek === dayIndex ? { ...h, [field]: value } : h,
      ),
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 py-8 border-b border-[#e9e9e7] dark:border-[#2d2d2d] last:border-0">
      <div className="md:col-span-1 space-y-1">
        <h2 className="text-base font-semibold text-[#37352f] dark:text-[#ffffff]">
          Business Hours
        </h2>
        <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b]">
          Configure when your chat widget appears online for visitors.
        </p>
      </div>
      <div className="md:col-span-2 space-y-4 max-w-xl">
        {isLoading ? (
          <div className="text-sm text-[#9b9b9b]">Loading schedule...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {DAYS.map((day) => {
              const config = hours.find((h) => h.dayOfWeek === day.val);
              const isOpen = !!config;

              return (
                <div
                  key={day.val}
                  className="flex items-center gap-4 py-2 border-b border-[#e9e9e7]/50 dark:border-[#2d2d2d]/50 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 px-2 -mx-2 rounded transition-colors"
                >
                  <div className="w-28 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isOpen}
                      onChange={() => toggleDay(day.val)}
                      className="w-4 h-4 cursor-pointer accent-black dark:accent-white"
                    />
                    <span
                      className={`text-sm font-medium ${isOpen ? "text-[#37352f] dark:text-white" : "text-[#37352f]/40 dark:text-[#9b9b9b]/50"}`}
                    >
                      {day.label}
                    </span>
                  </div>

                  {isOpen ? (
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="time"
                        value={config.startTime}
                        onChange={(e) =>
                          updateTime(day.val, "startTime", e.target.value)
                        }
                        className="bg-transparent border border-[#e9e9e7] dark:border-[#333] rounded px-2 py-1 text-[#37352f] dark:text-white focus:outline-none focus:border-black dark:focus:border-white cursor-pointer transition-colors"
                      />
                      <span className="text-[#37352f]/40 dark:text-[#9b9b9b]">
                        to
                      </span>
                      <input
                        type="time"
                        value={config.endTime}
                        onChange={(e) =>
                          updateTime(day.val, "endTime", e.target.value)
                        }
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
            })}

            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="cursor-pointer"
              >
                {updateMutation.isPending ? "Saving..." : "Save Hours"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
