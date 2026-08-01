import { db } from "@parrot/db/src/config";
import {
  tenants,
  tenantMembers,
  roles,
  properties,
  permissions,
  rolePermissions,
  businessHours,
  businessHourExceptions,
} from "@parrot/db/src/schema";
import { eq, and } from "drizzle-orm";
import type {
  CreateTenantDto,
  UpdateTenantDto,
  UpdatePropertyDto,
} from "@parrot/sdk";
import { PermissionKey, PERMISSIONS } from "../../express/constant";
import { PgAsyncTransaction } from "drizzle-orm/pg-core";

export class TenantRepository {
  async createTenantWithOwner(userId: string, data: CreateTenantDto) {
    return await db.transaction(async (tx) => {
      // 1. Create the tenant
      const [newTenant] = await tx
        .insert(tenants)
        .values({
          name: data.name,
          logoUrl: data.logoUrl,
        })
        .returning();

      if (!newTenant) {
        throw new Error("Failed to create tenant");
      }

      // 1b. Auto-provision the Default Property
      const [newProperty] = await tx
        .insert(properties)
        .values({
          tenantId: newTenant.id,
          name: data.propertyName,
          domain: data.domain,
          supportEmail: data.supportEmail,
          brandColor: data.brandColor,
          logoUrl: data.logoUrl,
          settings: {},
        })
        .returning();

      // 1c. Set default business hours (24/7)
      const defaultHours = [];
      for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
        defaultHours.push({
          propertyId: newProperty.id,
          dayOfWeek,
          startTime: "00:00",
          endTime: "23:59",
        });
      }
      await tx.insert(businessHours).values(defaultHours);

      await this.seedRolePermissions(newTenant.id, userId, tx);

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

  private async seedRolePermissions(
    tenantId: string,
    userId: string,
    tx: PgAsyncTransaction<any, any>,
  ) {
    // 2. Create default roles (Owner, Admin, Agent)
    const [ownerRole, adminRole, agentRole] = await tx
      .insert(roles)
      .values([
        { tenantId: tenantId, name: "Owner", isSystem: true },
        { tenantId: tenantId, name: "Admin", isSystem: true },
        { tenantId: tenantId, name: "Agent", isSystem: true },
      ])
      .returning();

    // 3. Map default roles to permissions
    const allPerms = await tx.select().from(permissions);
    const rolePermsToInsert: { roleId: string; permissionId: string }[] = [];

    const agentPermNames: PermissionKey[] = [
      PERMISSIONS.CONVERSATIONS_READ,
      PERMISSIONS.CONVERSATIONS_WRITE,
      PERMISSIONS.CONVERSATIONS_ASSIGN,
      PERMISSIONS.TICKETS_READ,
      PERMISSIONS.TICKETS_WRITE,
      PERMISSIONS.KB_READ,
      PERMISSIONS.TEAM_READ,
    ];

    allPerms.forEach((p) => {
      // Owner gets absolutely everything
      rolePermsToInsert.push({ roleId: ownerRole.id, permissionId: p.id });

      // Admin gets everything (same as owner for now)
      rolePermsToInsert.push({ roleId: adminRole.id, permissionId: p.id });

      // Agent gets restricted day-to-day permissions

      if (agentPermNames.includes(p.name as PermissionKey)) {
        rolePermsToInsert.push({ roleId: agentRole.id, permissionId: p.id });
      }
    });

    if (rolePermsToInsert.length > 0) {
      await tx.insert(rolePermissions).values(rolePermsToInsert);
    }

    // 4. Add the user as the Owner of this tenant
    await tx.insert(tenantMembers).values({
      tenantId: tenantId,
      userId: userId,
      roleId: ownerRole.id,
    });
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

  // Update a property
  async updateProperty(propertyId: string, data: UpdatePropertyDto) {
    const [updated] = await db
      .update(properties)
      .set(data)
      .where(eq(properties.id, propertyId))
      .returning();
    return updated;
  }

  async getWidgetPropertyConfig(propertyId: string) {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId));

    if (!property) return null;

    const hours = await db
      .select()
      .from(businessHours)
      .where(eq(businessHours.propertyId, propertyId));

    const exceptions = await db
      .select()
      .from(businessHourExceptions)
      .where(eq(businessHourExceptions.propertyId, propertyId));

    return { property, hours, exceptions };
  }

  // Get properties for a tenant
  async getPropertiesByTenantId(tenantId: string) {
    return db
      .select()
      .from(properties)
      .where(eq(properties.tenantId, tenantId))
      .orderBy(properties.createdAt);
  }

  static async seedPermissions() {
    const permissionsDef = [
      {
        key: PERMISSIONS.CONVERSATIONS_READ,
        description: "View the shared inbox and read chats",
        category: "Conversations",
      },
      {
        key: PERMISSIONS.CONVERSATIONS_WRITE,
        description: "Send messages to visitors.",
        category: "Conversations",
      },
      {
        key: PERMISSIONS.CONVERSATIONS_ASSIGN,
        description: "Assign or reassign conversations to other agents.",
        category: "Conversations",
      },
      {
        key: PERMISSIONS.TICKETS_READ,
        description: "View tickets.",
        category: "Ticketing",
      },
      {
        key: PERMISSIONS.TICKETS_WRITE,
        description: "Reply to and update the status of tickets.",
        category: "Ticketing",
      },
      {
        key: PERMISSIONS.KB_READ,
        description: "Read articles internally.",
        category: "Knowledge Base",
      },
      {
        key: PERMISSIONS.KB_WRITE,
        description: "Create and edit article drafts.",
        category: "Knowledge Base",
      },
      {
        key: PERMISSIONS.KB_PUBLISH,
        description:
          "Approve and publish articles to the public SEO routes (this is the one we restrict to Admins).",
        category: "Knowledge Base",
      },
      {
        key: PERMISSIONS.CANNED_RESPONSES_MANAGE,
        description:
          "Create and edit shared canned responses for the whole tenant (everyone can manage their own personal ones by default).",
        category: "Agent Productivity",
      },
      {
        key: PERMISSIONS.SETTINGS_MANAGE,
        description:
          "Update widget brand colors, business hours, and offline behavior.",
        category: "Settings & Configuration",
      },
      {
        key: PERMISSIONS.TEAM_READ,
        description: "View the list of tenant members.",
        category: "Team & Access Management",
      },
      {
        key: PERMISSIONS.TEAM_WRITE,
        description: "Invite new members and revoke access.",
        category: "Team & Access Management",
      },
      {
        key: PERMISSIONS.ROLES_MANAGE,
        description:
          "Create, edit, and assign custom roles (Highly restricted).",
        category: "Team & Access Management",
      },
    ];
    for (const element of permissionsDef) {
      await db
        .insert(permissions)
        .values({
          name: element.key,
          description: element.description,
        })
        .onConflictDoNothing();
    }
  }
}

export const tenantRepository = new TenantRepository();
