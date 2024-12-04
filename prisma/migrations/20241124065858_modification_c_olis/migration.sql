/*
  Warnings:

  - Added the required column `dateDepart` to the `Colis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `villeDepart` to the `Colis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Colis` ADD COLUMN `dateDepart` DATETIME(3) NOT NULL,
    ADD COLUMN `villeDepart` VARCHAR(191) NOT NULL;
