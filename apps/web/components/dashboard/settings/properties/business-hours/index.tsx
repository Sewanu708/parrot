"use client";

import { useState, useEffect } from "react";
import notify from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBusinessHours,
  useUpdateBusinessHours,
} from "@/hooks/use-settings";
import { ErrorHandler } from "@/lib/utilities";
import { BusinessHourRow, BusinessHourConfig } from "./row";
import {
  BusinessHourExceptions,
  BusinessHourExceptionConfig,
} from "./exceptions";

const DAYS = [
  { label: "Monday", val: 1 },
  { label: "Tuesday", val: 2 },
  { label: "Wednesday", val: 3 },
  { label: "Thursday", val: 4 },
  { label: "Friday", val: 5 },
  { label: "Saturday", val: 6 },
  { label: "Sunday", val: 0 },
];

export function BusinessHoursSettings({
  propertyId,
}: {
  propertyId: string;
}) {
  const [hours, setHours] = useState<BusinessHourConfig[]>([]);
  const [exceptions, setExceptions] = useState<BusinessHourExceptionConfig[]>([]);

  const { data, isLoading } = useBusinessHours(propertyId);
  const updateMutation = useUpdateBusinessHours();

  useEffect(() => {
    if (data?.data) {
      setHours(data.data.hours || []);
      setExceptions(data.data.exceptions || []);
    }
  }, [data]);

  const handleSave = () => {
    updateMutation.mutate(
      { propertyId, data: { hours, exceptions } },
      {
        onSuccess: () =>
          notify.success("Business hours & exceptions updated successfully!"),
        onError: (err: unknown) => {
          const formattedError = ErrorHandler(err);
          notify.error(err, formattedError);
        },
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

  const handleAddException = (newEx: BusinessHourExceptionConfig) => {
    const exists = exceptions.some((e) => e.date === newEx.date);
    if (exists) {
      notify.error(`An exception for ${newEx.date} already exists`);
      return;
    }
    setExceptions([...exceptions, newEx]);
  };

  const handleRemoveException = (dateToRemove: string) => {
    setExceptions(exceptions.filter((e) => e.date !== dateToRemove));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 py-8 border-b border-[#e9e9e7] dark:border-[#2d2d2d] last:border-0">
      <div className="md:col-span-1 space-y-1">
        <h2 className="text-base font-semibold text-[#37352f] dark:text-[#ffffff]">
          Business Hours & Holidays
        </h2>
        <p className="text-sm text-[#37352f]/60 dark:text-[#9b9b9b]">
          Configure your weekly schedule and holiday closures for this property.
        </p>
      </div>
      <div className="md:col-span-2 space-y-6 max-w-xl">
        {isLoading ? (
          <div className="flex flex-col gap-3 py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-[#e9e9e7]/50 dark:border-[#2d2d2d]/50"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-7 w-36 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              {DAYS.map((day) => {
                const config = hours.find((h) => h.dayOfWeek === day.val);

                return (
                  <BusinessHourRow
                    key={day.val}
                    dayLabel={day.label}
                    dayValue={day.val}
                    config={config}
                    onToggle={toggleDay}
                    onUpdateTime={updateTime}
                  />
                );
              })}
            </div>

            <BusinessHourExceptions
              exceptions={exceptions}
              onAddException={handleAddException}
              onRemoveException={handleRemoveException}
            />

            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="cursor-pointer"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
