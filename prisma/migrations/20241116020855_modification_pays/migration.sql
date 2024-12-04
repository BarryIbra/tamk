/*
  Warnings:

  - Added the required column `monnaie` to the `Pays` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Pays` ADD COLUMN `monnaie` VARCHAR(191) NOT NULL;
