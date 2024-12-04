/*
  Warnings:

  - You are about to drop the column `paysId` on the `Transport` table. All the data in the column will be lost.
  - Added the required column `paysDepartId` to the `Transport` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Transport` DROP FOREIGN KEY `Transport_paysId_fkey`;

-- AlterTable
ALTER TABLE `Transport` DROP COLUMN `paysId`,
    ADD COLUMN `paysDepartId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Transport` ADD CONSTRAINT `Transport_paysDepartId_fkey` FOREIGN KEY (`paysDepartId`) REFERENCES `Pays`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
