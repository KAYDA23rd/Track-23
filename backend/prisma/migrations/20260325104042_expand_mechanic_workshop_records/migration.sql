-- AlterTable
ALTER TABLE `maintenanceticket` ADD COLUMN `assignedMechanicName` VARCHAR(191) NULL,
    ADD COLUMN `brakeChecked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `diagnosis` VARCHAR(191) NULL,
    ADD COLUMN `electricalChecked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `engineChecked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `partsUsed` VARCHAR(191) NULL,
    ADD COLUMN `repairNotes` VARCHAR(191) NULL,
    ADD COLUMN `returnedToServiceAt` DATETIME(3) NULL,
    ADD COLUMN `roadTestPassed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `tireChecked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `workStartedAt` DATETIME(3) NULL,
    ADD COLUMN `workshopPriority` INTEGER NULL;
