import { db } from "./config";
import {
  tenants,
  roles,
  users,
  accounts,
  tenantMembers,
  permissions,
  properties,
  visitors,
  conversations,
  messages,
} from "./schema";
import bcrypt from "bcrypt";

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Seed Permissions
  console.log("  → Seeding permissions...");
  const basePermissions = [
    { name: "conversations:read", description: "View conversations" },
    { name: "conversations:write", description: "Send messages" },
    { name: "conversations:assign", description: "Assign conversations to agents" },
    { name: "tickets:manage", description: "Manage support tickets" },
    { name: "settings:manage", description: "Manage workspace settings" },
    { name: "members:manage", description: "Manage team members" },
  ];

  await db.insert(permissions).values(basePermissions).onConflictDoNothing();

  // 2. Seed Demo Tenant
  console.log("  → Seeding demo tenant...");
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: "Acme Corp",
    })
    .returning();

  // 3. Seed Roles
  console.log("  → Seeding tenant roles...");
  const [ownerRole] = await db
    .insert(roles)
    .values([
      { tenantId: tenant.id, name: "Owner" },
      { tenantId: tenant.id, name: "Admin" },
      { tenantId: tenant.id, name: "Agent" },
    ])
    .returning();

  // 4. Seed Demo Agent User & Account
  console.log("  → Seeding agent user...");
  const passwordHash = await bcrypt.hash("password123", 10);

  const [agentUser] = await db
    .insert(users)
    .values({
      name: "Alex Support Agent",
      email: "agent@acme.com",
      emailVerified: true,
      status: "active",
    })
    .returning();

  await db.insert(accounts).values({
    userId: agentUser.id,
    provider: "credentials",
    passwordHash: passwordHash,
  });

  await db.insert(tenantMembers).values({
    tenantId: tenant.id,
    userId: agentUser.id,
    roleId: ownerRole.id,
  });

  // 5. Seed Property
  console.log("  → Seeding property...");
  const [property] = await db
    .insert(properties)
    .values({
      tenantId: tenant.id,
      name: "Acme Store Website",
      domain: "acme.com",
      supportEmail: "support@acme.com",
      brandColor: "#4f46e5",
    })
    .returning();

  // 6. Seed Demo Visitor & Conversation
  console.log("  → Seeding visitor & sample conversation...");
  const [visitor] = await db
    .insert(visitors)
    .values({
      propertyId: property.id,
      name: "John Customer",
      email: "john@example.com",
      clientVisitorId: "6d8cf158-5ebd-43f6-b39b-34d6ab525814",
    })
    .returning();

  const [conversation] = await db
    .insert(conversations)
    .values({
      tenantId: tenant.id,
      visitorId: visitor.id,
      assignedAgentId: agentUser.id,
      status: "open",
      channel: "chat",
    })
    .returning();

  await db.insert(messages).values([
    {
      conversationId: conversation.id,
      senderType: "visitor",
      visitorId: visitor.id,
      body: "Hello! I have a question about shipping to Canada.",
    },
    {
      conversationId: conversation.id,
      senderType: "agent",
      agentId: agentUser.id,
      body: "Hi John! We ship worldwide with 3-day express shipping.",
    },
  ]);

  console.log("✅ Seeding completed successfully!");
  console.log("----------------------------------------");
  console.log(`Demo Tenant ID : ${tenant.id}`);
  console.log(`Property ID    : ${property.id}`);
  console.log(`Agent Login    : agent@acme.com / password123`);
  console.log("----------------------------------------");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
