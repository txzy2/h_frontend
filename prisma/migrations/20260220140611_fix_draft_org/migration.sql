/*
  Warnings:

  - Added the required column `phone_number` to the `draft_organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan` to the `draft_organization` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "draft_organization" ADD COLUMN     "phone_number" VARCHAR(11) NOT NULL,
ADD COLUMN     "plan" VARCHAR(50) NOT NULL;
