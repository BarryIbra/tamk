/*
  Warnings:

  - You are about to drop the column `paysArriveId` on the `Transport` table. All the data in the column will be lost.
  - You are about to drop the column `paysDepartId` on the `Transport` table. All the data in the column will be lost.
  - Added the required column `dateArrive` to the `Transport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateDepart` to the `Transport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `villeArrive` to the `Transport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `villeDepart` to the `Transport` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Transport` DROP FOREIGN KEY `Transport_paysArriveId_fkey`;

-- DropForeignKey
ALTER TABLE `Transport` DROP FOREIGN KEY `Transport_paysDepartId_fkey`;

-- AlterTable
ALTER TABLE `Transport` DROP COLUMN `paysArriveId`,
    DROP COLUMN `paysDepartId`,
    ADD COLUMN `dateArrive` DATETIME(3) NOT NULL,
    ADD COLUMN `dateDepart` DATETIME(3) NOT NULL,
    ADD COLUMN `villeArrive` VARCHAR(191) NOT NULL,
    ADD COLUMN `villeDepart` VARCHAR(191) NOT NULL;
