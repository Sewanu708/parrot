CREATE TYPE "canned_response_visibility" AS ENUM('shared', 'personal');--> statement-breakpoint
CREATE TYPE "kb_article_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
ALTER TYPE "conversation_status" ADD VALUE 'pending';--> statement-breakpoint
CREATE TABLE "business_hour_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"property_id" uuid NOT NULL,
	"date" date NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "business_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"property_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canned_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tenant_id" uuid NOT NULL,
	"owner_id" uuid,
	"visibility" "canned_response_visibility" NOT NULL,
	"shortcut" text NOT NULL,
	"content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_canned_responses_owner_visibility" CHECK ((
        ("owner_id" IS NULL AND "visibility" = 'shared') OR
        ("owner_id" IS NOT NULL AND "visibility" = 'personal')
      ))
);
--> statement-breakpoint
CREATE TABLE "kb_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tenant_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"category_id" uuid,
	"title" text NOT NULL,
	"status" "kb_article_status" DEFAULT 'draft'::"kb_article_status" NOT NULL,
	"content" text,
	"author_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tenant_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"parent_id" uuid,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "last_message_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "description" text;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_business_hour_exceptions_property_date" ON "business_hour_exceptions" ("property_id","date");--> statement-breakpoint
CREATE INDEX "idx_business_hour_exceptions_property_id" ON "business_hour_exceptions" ("property_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_business_hours_property_day" ON "business_hours" ("property_id","day_of_week");--> statement-breakpoint
CREATE INDEX "idx_business_hours_property_id" ON "business_hours" ("property_id");--> statement-breakpoint
CREATE INDEX "idx_canned_responses_tenant_id" ON "canned_responses" ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_canned_responses_owner_id" ON "canned_responses" ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_kb_articles_tenant_property_id" ON "kb_articles" ("tenant_id","property_id");--> statement-breakpoint
CREATE INDEX "idx_kb_category_tenant_id" ON "kb_category" ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_kb_category_property_id" ON "kb_category" ("property_id");--> statement-breakpoint
CREATE INDEX "idx_kb_category_parent_id" ON "kb_category" ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_kb_category_tenant_property_slug" ON "kb_category" ("tenant_id","property_id","slug");--> statement-breakpoint
ALTER TABLE "business_hour_exceptions" ADD CONSTRAINT "business_hour_exceptions_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "canned_responses" ADD CONSTRAINT "canned_responses_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "canned_responses" ADD CONSTRAINT "canned_responses_owner_id_tenant_members_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "tenant_members"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "kb_articles" ADD CONSTRAINT "kb_articles_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "kb_articles" ADD CONSTRAINT "kb_articles_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "kb_articles" ADD CONSTRAINT "kb_articles_category_id_kb_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "kb_category"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "kb_articles" ADD CONSTRAINT "kb_articles_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "kb_category" ADD CONSTRAINT "kb_category_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "kb_category" ADD CONSTRAINT "kb_category_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "kb_category" ADD CONSTRAINT "kb_category_parent_id_kb_category_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "kb_category"("id") ON DELETE SET NULL;