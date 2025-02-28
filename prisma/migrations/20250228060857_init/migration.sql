/*
  Warnings:

  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DeviceSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocumentYearData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Superadmin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Admin` DROP FOREIGN KEY `Admin_superAdminId_fkey`;

-- DropForeignKey
ALTER TABLE `DeviceSession` DROP FOREIGN KEY `DeviceSession_adminId_fkey`;

-- DropForeignKey
ALTER TABLE `Document` DROP FOREIGN KEY `Document_userId_fkey`;

-- DropForeignKey
ALTER TABLE `DocumentYearData` DROP FOREIGN KEY `DocumentYearData_documentId_fkey`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_adminId_fkey`;

-- DropTable
DROP TABLE `Admin`;

-- DropTable
DROP TABLE `DeviceSession`;

-- DropTable
DROP TABLE `Document`;

-- DropTable
DROP TABLE `DocumentYearData`;

-- DropTable
DROP TABLE `Superadmin`;

-- DropTable
DROP TABLE `User`;

-- CreateTable
CREATE TABLE `superadmin` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `maxDevices` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `superadmin_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `superAdminId` VARCHAR(191) NOT NULL,
    `allowedDevices` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_username_key`(`username`),
    INDEX `admin_superAdminId_idx`(`superAdminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deviceSession` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `deviceInfo` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NOT NULL,
    `loginTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `logoutTime` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `deviceSession_adminId_idx`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `whatsappNumber` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `age` INTEGER NULL,
    `gender` ENUM('Male', 'Female', 'Other') NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `lastInteraction` VARCHAR(191) NULL DEFAULT '0',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_whatsappNumber_key`(`whatsappNumber`),
    UNIQUE INDEX `user_email_key`(`email`),
    INDEX `user_adminId_idx`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `year` VARCHAR(191) NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `document_userId_year_idx`(`userId`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documentYearData` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `yearRange` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `documentYearData_documentId_idx`(`documentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `admin` ADD CONSTRAINT `admin_superAdminId_fkey` FOREIGN KEY (`superAdminId`) REFERENCES `superadmin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deviceSession` ADD CONSTRAINT `deviceSession_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document` ADD CONSTRAINT `document_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documentYearData` ADD CONSTRAINT `documentYearData_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `document`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
