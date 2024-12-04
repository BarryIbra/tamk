-- AlterTable
ALTER TABLE `Transport` MODIFY `dateArrive` DATETIME(3) NULL,
    MODIFY `dateDepart` DATETIME(3) NULL,
    MODIFY `villeArrive` VARCHAR(191) NULL,
    MODIFY `villeDepart` VARCHAR(191) NULL;
