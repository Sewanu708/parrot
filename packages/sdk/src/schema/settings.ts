import { z } from "zod";

export const BusinessHourSchema = z.object({
  id: z.string().uuid().optional(),
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
});

export const BusinessHourExceptionSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  isClosed: z.boolean(),
  reason: z.string().optional().nullable(),
});

export const UpdateBusinessHoursConfigSchema = z.object({
  hours: z.array(BusinessHourSchema).optional(),
  exceptions: z.array(BusinessHourExceptionSchema).optional(),
});

export type BusinessHourDto = z.infer<typeof BusinessHourSchema>;
export type BusinessHourExceptionDto = z.infer<typeof BusinessHourExceptionSchema>;
export type UpdateBusinessHoursConfigDto = z.infer<typeof UpdateBusinessHoursConfigSchema>;
