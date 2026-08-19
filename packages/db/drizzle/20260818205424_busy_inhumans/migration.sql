CREATE TABLE "custom_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tenant_id" uuid NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'string' NOT NULL,
	"default_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_custom_attributes_tenant_id" ON "custom_attributes" ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_custom_attributes_tenant_key" ON "custom_attributes" ("tenant_id","key");--> statement-breakpoint
ALTER TABLE "custom_attributes" ADD CONSTRAINT "custom_attributes_tenant_id_tenants_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;