export interface BusinessHourShift {
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // "HH:MM" (24-hour)
  endTime: string; // "HH:MM" (24-hour)
}

export interface BusinessHourException {
  date: string; // "YYYY-MM-DD"
  isClosed: boolean;
}

/**
 * Calculates whether a property is currently online based on their configured
 * timezone, business hours, and date exceptions.
 * 
 * Uses the native Intl.DateTimeFormat API to handle timezones safely without
 * external dependencies.
 */
export function isPropertyOnline(
  timezone: string,
  businessHours: BusinessHourShift[],
  exceptions: BusinessHourException[]
): boolean {
  if (!businessHours.length && !exceptions.length) {
    return false;
  }

  const now = new Date();
 
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "long",
  }).formatToParts(now);

  let year, month, day, hour, minute, weekdayStr;
  
  for (const p of parts) {
    if (p.type === "year") year = p.value;
    if (p.type === "month") month = p.value;
    if (p.type === "day") day = p.value;
    if (p.type === "hour") hour = p.value;
    if (p.type === "minute") minute = p.value;
    if (p.type === "weekday") weekdayStr = p.value;
  }

  // Handle midnight hour formatting in Intl API
  if (hour === "24") hour = "00";

  const currentDateStr = `${year}-${month}-${day}`;
  const currentTimeStr = `${hour}:${minute}`;

  const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  
  const currentDayOfWeek = dayMap[weekdayStr as string];

  // 1. Check Exceptions (e.g. Holidays)
  const todayException = exceptions.find((ex) => ex.date === currentDateStr);
  if (todayException) {
    if (todayException.isClosed) {
      return false;
    }
  }

  // 2. Check Standard Business Hours
  const todaysShifts = businessHours.filter((h) => h.dayOfWeek === currentDayOfWeek);

  if (todaysShifts.length === 0) {
    return false; 
  }

  for (const shift of todaysShifts) {
    if (currentTimeStr >= shift.startTime && currentTimeStr <= shift.endTime) {
      return true; // Online! We are inside business hours.
    }
  }

  // Outside of business hours
  return false;
}
