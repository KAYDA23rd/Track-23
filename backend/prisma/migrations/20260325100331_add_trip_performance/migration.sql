-- AlterTable
ALTER TABLE `shift` ADD COLUMN `actualDurationMinutes` INTEGER NULL,
    ADD COLUMN `completedLoops` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `completedTrips` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `passengerCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `plannedTripsTarget` INTEGER NULL,
    ADD COLUMN `targetDurationMinutesSnapshot` INTEGER NULL,
    ADD COLUMN `tripPerformanceNotes` VARCHAR(191) NULL;
