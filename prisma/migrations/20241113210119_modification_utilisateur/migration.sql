-- AlterTable
ALTER TABLE `Utilisateur` ADD COLUMN `emailDestinateur` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL;
