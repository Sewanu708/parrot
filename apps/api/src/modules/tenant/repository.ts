import { db } from "@parrot/db/src/config";
import {
  tenants,
  tenantMembers,
  roles,
  properties,
} from "@parrot/db/src/schema";
import { eq, and } from "drizzle-orm";
import type { CreateTenantDto, UpdateTenantDto } from "@parrot/sdk";

export class TenantRepository {
  async createTenantWithOwner(userId: string, data: CreateTenantDto) {
    return await db.transaction(async (tx) => {
      // 1. Create the tenant
      const [newTenant] = await tx
        .insert(tenants)
        .values({
          name: data.name,
        })
        .returning();

      if (!newTenant) {
        throw new Error("Failed to create tenant");
      }

      // 1b. Auto-provision the Default Property
      const [newProperty] =await tx
        .insert(properties)
        .values({
          tenantId: newTenant.id,
          name: `${data.name} Default Property`,
          domain: data.domain,
          supportEmail: data.supportEmail,
          brandColor: data.brandColor,
          logoUrl: data.logoUrl,
          settings: {},
        })
        .returning();

      // 2. Create default roles (Owner, Admin, Agent)
      const [ownerRole] = await tx
        .insert(roles)
        .values([
          { tenantId: newTenant.id, name: "Owner" },
          { tenantId: newTenant.id, name: "Admin" },
          { tenantId: newTenant.id, name: "Agent" },
        ])
        .returning();

      // 3. Add the user as the Owner of this tenant
      await tx.insert(tenantMembers).values({
        tenantId: newTenant.id,
        userId: userId,
        roleId: ownerRole.id,
      });

      return { tenant: newTenant, defaultProperty: newProperty };
    });
  }

  async getTenantById(tenantId: string) {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    return tenant;
  }

  async updateTenant(tenantId: string, data: UpdateTenantDto) {
    const [updatedTenant] = await db
      .update(tenants)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    return updatedTenant;
  }

  // Check if a user is a member of a tenant
  async isUserMemberOfTenant(userId: string, tenantId: string) {
    const [member] = await db
      .select()
      .from(tenantMembers)
      .where(
        and(
          eq(tenantMembers.userId, userId),
          eq(tenantMembers.tenantId, tenantId),
        ),
      );
    return !!member;
  }
}

export const tenantRepository = new TenantRepository();
