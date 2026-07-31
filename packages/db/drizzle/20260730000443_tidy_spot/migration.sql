ALTER TABLE "properties" DROP CONSTRAINT "properties_widget_key_key";--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "support_email" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "brand_color" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "widget_key";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "domain";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "support_email";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "brand_color";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "logo_url";