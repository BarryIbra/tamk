/*
  Warnings:

  - Added the required column `paysArriveId` to the `Transport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Transport` ADD COLUMN `paysArriveId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Transport` ADD CONSTRAINT `Transport_paysArriveId_fkey` FOREIGN KEY (`paysArriveId`) REFERENCES `Pays`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
