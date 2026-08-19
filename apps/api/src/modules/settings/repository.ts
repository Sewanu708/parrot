import { db } from "@parrot/db/src/config";
import {
  businessHours,
  businessHourExceptions,
  cannedResponses,
  customAttributes,
  permissions,
  rolePermissions,
} from "@parrot/db/src/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import type {
  UpdateBusinessHoursConfigDto,
  CreateCannedResponseDto,
  UpdateCannedResponseDto,
  CreateCustomAttributeDto,
  UpdateCustomAttributeDto,
} from "@parrot/sdk";

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

  static async checkPermission(roleId: string | null, permissionName: string): Promise<boolean> {
    if (!roleId) return false;
    
    const [permRecord] = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.name, permissionName));
      
    if (!permRecord) return false;

    const [hasAccess] = await db
      .select()
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permRecord.id)
        )
      );

    return !!hasAccess;
  }

  // --- Canned Responses ---

  static async getCannedResponses(tenantId: string, memberId: string) {
    return db
      .select()
      .from(cannedResponses)
      .where(
        and(
          eq(cannedResponses.tenantId, tenantId),
          or(
            isNull(cannedResponses.ownerId),
            eq(cannedResponses.ownerId, memberId)
          )
        )
      )
      .orderBy(cannedResponses.createdAt);
  }

  static async getCannedResponseById(id: string) {
    const results = await db
      .select()
      .from(cannedResponses)
      .where(eq(cannedResponses.id, id))
      .limit(1);
    return results[0] || null;
  }

  static async createCannedResponse(tenantId: string, ownerId: string | null, data: CreateCannedResponseDto) {
    const results = await db
      .insert(cannedResponses)
      .values({
        tenantId,
        ownerId,
        visibility: data.visibility,
        shortcut: data.shortcut,
        content: data.content,
      })
      .returning();
    return results[0];
  }

  static async updateCannedResponse(id: string, data: UpdateCannedResponseDto, ownerId?: string | null) {
    const payload: Partial<typeof cannedResponses.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (data.shortcut !== undefined) payload.shortcut = data.shortcut;
    if (data.content !== undefined) payload.content = data.content;
    if (data.visibility !== undefined) {
      payload.visibility = data.visibility;
      if (ownerId !== undefined) {
        payload.ownerId = ownerId;
      }
    }

    const results = await db
      .update(cannedResponses)
      .set(payload)
      .where(eq(cannedResponses.id, id))
      .returning();
    return results[0];
  }

  static async deleteCannedResponse(id: string) {
    await db.delete(cannedResponses).where(eq(cannedResponses.id, id));
  }

  // --- Custom Attributes ---

  static async getCustomAttributes(tenantId: string) {
    return db
      .select()
      .from(customAttributes)
      .where(eq(customAttributes.tenantId, tenantId))
      .orderBy(customAttributes.createdAt);
  }

  static async getCustomAttributeById(id: string) {
    const results = await db
      .select()
      .from(customAttributes)
      .where(eq(customAttributes.id, id))
      .limit(1);
    return results[0] || null;
  }

  static async getCustomAttributeByKey(tenantId: string, key: string) {
    const results = await db
      .select()
      .from(customAttributes)
      .where(
        and(
          eq(customAttributes.tenantId, tenantId),
          eq(customAttributes.key, key),
        ),
      )
      .limit(1);
    return results[0] || null;
  }

  static async createCustomAttribute(
    tenantId: string,
    data: CreateCustomAttributeDto,
  ) {
    const results = await db
      .insert(customAttributes)
      .values({
        tenantId,
        key: data.key,
        label: data.label,
        description: data.description,
        type: data.type || "string",
        defaultValue: data.defaultValue,
      })
      .returning();
    return results[0];
  }

  static async updateCustomAttribute(
    id: string,
    data: UpdateCustomAttributeDto,
  ) {
    const payload: Partial<typeof customAttributes.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (data.label !== undefined) payload.label = data.label;
    if (data.description !== undefined) payload.description = data.description;
    if (data.type !== undefined) payload.type = data.type;
    if (data.defaultValue !== undefined) payload.defaultValue = data.defaultValue;

    const results = await db
      .update(customAttributes)
      .set(payload)
      .where(eq(customAttributes.id, id))
      .returning();
    return results[0];
  }

  static async deleteCustomAttribute(id: string) {
    await db.delete(customAttributes).where(eq(customAttributes.id, id));
  }
}
