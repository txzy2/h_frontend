-- AlterTable
ALTER TABLE "registration_draft" ALTER COLUMN "expires_at" SET DEFAULT NOW() + INTERVAL '7 days';
