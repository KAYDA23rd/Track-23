-- AlterTable
ALTER TABLE `remittance` ADD COLUMN `reviewNotes` VARCHAR(191) NULL,
    ADD COLUMN `reviewedAt` DATETIME(3) NULL,
    ADD COLUMN `reviewedByUserId` VARCHAR(191) NULL,
    ADD COLUMN `shiftId` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `varianceAmount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `varianceReason` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `route` ADD COLUMN `offPeakHeadwayMinutes` INTEGER NULL,
    ADD COLUMN `peakHeadwayMinutes` INTEGER NULL,
    ADD COLUMN `plannedDistanceKm` DOUBLE NULL,
    ADD COLUMN `plannedTripsPerShift` INTEGER NULL,
    ADD COLUMN `targetDurationMinutes` INTEGER NULL,
    ADD COLUMN `turnaroundMinutes` INTEGER NULL;

-- AlterTable
ALTER TABLE `shift` ADD COLUMN `closedAt` DATETIME(3) NULL,
    ADD COLUMN `closedByUserId` VARCHAR(191) NULL,
    ADD COLUMN `completedAt` DATETIME(3) NULL,
    ADD COLUMN `fuelInPercent` INTEGER NULL,
    ADD COLUMN `fuelOutPercent` INTEGER NULL,
    ADD COLUMN `handoverConfirmedAt` DATETIME(3) NULL,
    ADD COLUMN `handoverConfirmedByUserId` VARCHAR(191) NULL,
    ADD COLUMN `handoverNotes` VARCHAR(191) NULL,
    ADD COLUMN `issuedAt` DATETIME(3) NULL,
    ADD COLUMN `issuedByUserId` VARCHAR(191) NULL,
    ADD COLUMN `odometerIn` INTEGER NULL,
    ADD COLUMN `odometerOut` INTEGER NULL,
    ADD COLUMN `returnNotes` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('ASSIGNED', 'HANDED_OVER', 'ON_ROUTE', 'COMPLETED', 'CLOSED') NOT NULL DEFAULT 'ASSIGNED',
    ADD COLUMN `tripStartedAt` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `Remittance` ADD CONSTRAINT `Remittance_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `Shift`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
