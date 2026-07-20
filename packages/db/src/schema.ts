import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import { sql, InferSelectModel } from "drizzle-orm";

export const userStatusEnum = pgEnum("user_status", [
  "invited",
  "active",
  "suspended",
  "pending"
]);

export const conversationStatusEnum = pgEnum("conversation_status", [
  "open",
  "assigned",
  "closed",
]);

export const channelTypeEnum = pgEnum("channel_type", ["chat", "email", "sms"]);

export const senderTypeEnum = pgEnum("sender_type", [
  "agent",
  "visitor",
  "system",
]);

export const messageStatusEnum = pgEnum("message_status", [
  "sent",
  "delivered",
  "read",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);



export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  domain: text("domain"),
  supportEmail: text("support_email"),
  brandColor: text("brand_color"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_roles_tenant_name").on(table.tenantId, table.name),
    index("idx_roles_tenant_id").on(table.tenantId),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(), // use citext extension at DB level
    emailVerified: boolean("email_verified").notNull().default(false),
    status: userStatusEnum("status").notNull().default("pending"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  }
);

export const tenantMembers = pgTable(
  "tenant_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id").references(() => roles.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_tenant_members_tenant_user").on(table.tenantId, table.userId),
    index("idx_tenant_members_tenant_id").on(table.tenantId),
    index("idx_tenant_members_user_id").on(table.userId),
    index("idx_tenant_members_role_id").on(table.roleId),
  ],
);


// ──────────────────────────────────────────────
//  Sessions
//
//  Why session tokens instead of JWT?
//  This is a B2B platform — admins may need to kick out or demote a
//  member immediately. With JWT the client keeps its old claims until
//  the token expires. Session tokens allow instant revocation and
//  role-change propagation.
// ──────────────────────────────────────────────

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    activeTenantId: uuid("active_tenant_id").references(() => tenants.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").notNull().default(true),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_sessions_user_id").on(table.userId),
    index("idx_sessions_active_tenant_id").on(table.activeTenantId),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // 'credentials' | 'google' | 'github'
    providerAccountId: text("provider_account_id"), // null for 'credentials'
    passwordHash: text("password_hash"), // only for 'credentials'
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_accounts_provider_account").on(
      table.provider,
      table.providerAccountId,
    ),
    uniqueIndex("uq_accounts_user_provider").on(table.userId, table.provider),
  ],
);

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export const visitors = pgTable(
  "visitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    metadata: jsonb("metadata").notNull().default({}),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_visitors_tenant_id").on(table.tenantId)],
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, { onDelete: "restrict" }),
    assignedAgentId: uuid("assigned_agent_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: conversationStatusEnum("status").notNull().default("open"),
    channel: channelTypeEnum("channel").notNull().default("chat"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_conversations_tenant_status").on(table.tenantId, table.status),
    index("idx_conversations_visitor_id").on(table.visitorId),
    index("idx_conversations_assigned_agent").on(table.assignedAgentId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderType: senderTypeEnum("sender_type").notNull(),
    agentId: uuid("agent_id").references(() => users.id, {
      onDelete: "set null",
    }),
    visitorId: uuid("visitor_id").references(() => visitors.id, {
      onDelete: "set null",
    }),
    messageType: text("message_type").notNull().default("text"),
    body: text("body"),
    status: messageStatusEnum("status").notNull().default("sent"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_messages_conversation_id").on(table.conversationId),
    index("idx_messages_created_at").on(table.createdAt),
    check(
      "chk_messages_sender",
      sql`(
        (${table.senderType} = 'agent'   AND ${table.agentId}   IS NOT NULL AND ${table.visitorId} IS NULL) OR
        (${table.senderType} = 'visitor' AND ${table.visitorId} IS NOT NULL AND ${table.agentId}   IS NULL) OR
        (${table.senderType} = 'system'  AND ${table.agentId}   IS NULL     AND ${table.visitorId} IS NULL)
      )`,
    ),
  ],
);

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(() => conversations.id, {
      onDelete: "set null",
    }),
    visitorId: uuid("visitor_id")
      .notNull()
      .references(() => visitors.id, { onDelete: "restrict" }),
    assignedAgentId: uuid("assigned_agent_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: ticketStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_tickets_tenant_status").on(table.tenantId, table.status),
    index("idx_tickets_visitor_id").on(table.visitorId),
  ],
);

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    invitedBy: uuid("invited_by").references(() => users.id, {
      onDelete: "set null",
    }),
    status: inviteStatusEnum("status").notNull().default("pending"),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_invites_tenant_id").on(table.tenantId),
    index("idx_invites_expires_at").on(table.expiresAt),
  ],
);

// ──────────────────────────────────────────────
//  Inferred Types
// ──────────────────────────────────────────────

export type Tenant = InferSelectModel<typeof tenants>;
export type Role = InferSelectModel<typeof roles>;
export type User = InferSelectModel<typeof users>;
export type TenantMember = InferSelectModel<typeof tenantMembers>;
export type Session = InferSelectModel<typeof sessions>;
export type Account = InferSelectModel<typeof accounts>;
export type Permission = InferSelectModel<typeof permissions>;
export type RolePermission = InferSelectModel<typeof rolePermissions>;
export type Visitor = InferSelectModel<typeof visitors>;
export type Conversation = InferSelectModel<typeof conversations>;
export type Message = InferSelectModel<typeof messages>;
export type Ticket = InferSelectModel<typeof tickets>;
export type Invite = InferSelectModel<typeof invites>;
