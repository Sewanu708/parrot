CREATE TYPE "property_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"widget_key" text NOT NULL UNIQUE,
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visitors" DROP CONSTRAINT "visitors_tenant_id_tenants_id_fkey";--> statement-breakpoint
DROP INDEX "idx_visitors_tenant_id";--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "property_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "client_visitor_id" uuid;--> statement-breakpoint
ALTER TABLE "visitors" DROP COLUMN "tenant_id";--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "uq_visitors_property_client_visitor_id" UNIQUE("property_id","client_visitor_id");--> statement-breakpoint
CREATE INDEX "idx_properties_tenant_id" ON "properties" ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_visitors_property_id" ON "visitors" ("property_id");--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;