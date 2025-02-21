/*
  Warnings:

  - You are about to drop the column `permissions` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `permissions` on the `SuperAdmin` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `SuperAdmin` table. All the data in the column will be lost.
  - Made the column `maxDevices` on table `SuperAdmin` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Admin` DROP COLUMN `permissions`,
    DROP COLUMN `role`;

-- AlterTable
ALTER TABLE `SuperAdmin` DROP COLUMN `permissions`,
    DROP COLUMN `role`,
    MODIFY `maxDevices` INTEGER NOT NULL DEFAULT 1;
