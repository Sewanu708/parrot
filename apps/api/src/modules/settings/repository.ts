import { db } from "@parrot/db/src/config";
import { businessHours, businessHourExceptions } from "@parrot/db/src/schema";
import { eq } from "drizzle-orm";
import type { UpdateBusinessHoursConfigDto } from "@parrot/sdk";

export class SettingsRepository {
  static async getBusinessHours(propertyId: string) {
    const hours = await db
      .select()
      .from(businessHours)
      .where(eq(businessHours.propertyId, propertyId));
      
    const exceptions = await db
      .select()
      .from(businessHourExceptions)
      .where(eq(businessHourExceptions.propertyId, propertyId));

    return { hours, exceptions };
  }

  static async updateBusinessHours(propertyId: string, data: UpdateBusinessHoursConfigDto) {
    return db.transaction(async (tx) => {
      // 1. Process hours if provided
      if (data.hours !== undefined) {
        await tx
          .delete(businessHours)
          .where(eq(businessHours.propertyId, propertyId));

        if (data.hours.length > 0) {
          const insertHours = data.hours.map((h) => ({
            propertyId,
            dayOfWeek: h.dayOfWeek,
            startTime: h.startTime,
            endTime: h.endTime,
          }));
          await tx.insert(businessHours).values(insertHours);
        }
      }

      // 2. Process exceptions if provided
      if (data.exceptions !== undefined) {
        await tx
          .delete(businessHourExceptions)
          .where(eq(businessHourExceptions.propertyId, propertyId));

        if (data.exceptions.length > 0) {
          const insertExceptions = data.exceptions.map((ex) => ({
            propertyId,
            date: ex.date,
            isClosed: ex.isClosed,
            reason: ex.reason,
          }));
          await tx.insert(businessHourExceptions).values(insertExceptions);
        }
      }

      // 3. Return fresh state
      const freshHours = await tx
        .select()
        .from(businessHours)
        .where(eq(businessHours.propertyId, propertyId));
        
      const freshExceptions = await tx
        .select()
        .from(businessHourExceptions)
        .where(eq(businessHourExceptions.propertyId, propertyId));

      return { hours: freshHours, exceptions: freshExceptions };
    });
  }
}
