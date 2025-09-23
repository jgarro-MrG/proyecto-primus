/*
  Warnings:

  - Made the column `display_order` on table `categories` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."categories" ALTER COLUMN "display_order" SET NOT NULL;
