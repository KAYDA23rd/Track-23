-- CreateTable
CREATE TABLE `RemittanceConfig` (
    `id` INTEGER NOT NULL,
    `expectedAmount` INTEGER NOT NULL DEFAULT 25000,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
