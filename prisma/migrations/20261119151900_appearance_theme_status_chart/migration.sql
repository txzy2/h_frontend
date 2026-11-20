-- AlterTable
ALTER TABLE "organization_appearance" ADD COLUMN     "chart_colors" JSONB,
ADD COLUMN     "default_theme" VARCHAR(10) NOT NULL DEFAULT 'system',
ADD COLUMN     "status_colors" JSONB;

-- AlterTable
ALTER TABLE "registration_draft" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL '7 days';
