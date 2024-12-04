/*
  Warnings:

  - Added the required column `paysDepartId` to the `Transport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Transport` ADD COLUMN `paysDepartId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Transport` ADD CONSTRAINT `Transport_paysDepartId_fkey` FOREIGN KEY (`paysDepartId`) REFERENCES `Pays`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
