/*
  Warnings:

  - Made the column `paysId` on table `Utilisateur` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Utilisateur` DROP FOREIGN KEY `Utilisateur_paysId_fkey`;

-- AlterTable
ALTER TABLE `Utilisateur` MODIFY `paysId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Utilisateur` ADD CONSTRAINT `Utilisateur_paysId_fkey` FOREIGN KEY (`paysId`) REFERENCES `Pays`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
