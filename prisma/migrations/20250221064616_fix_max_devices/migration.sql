-- AlterTable
ALTER TABLE `Admin` ADD COLUMN `permissions` JSON NULL,
    ADD COLUMN `role` ENUM('SupportAdmin', 'FullAdmin') NOT NULL DEFAULT 'SupportAdmin';

-- AlterTable
ALTER TABLE `SuperAdmin` ADD COLUMN `permissions` JSON NULL,
    ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'SuperAdmin',
    MODIFY `maxDevices` INTEGER NULL;
