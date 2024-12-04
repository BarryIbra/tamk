-- CreateTable
CREATE TABLE `Utilisateur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `roles` ENUM('admin', 'user', 'transporteur') NULL DEFAULT 'user',
    `password` VARCHAR(191) NULL,
    `firstname` VARCHAR(191) NOT NULL,
    `lastname` VARCHAR(191) NOT NULL,
    `paysId` INTEGER NULL,
    `phone` VARCHAR(191) NOT NULL,
    `anneeNaissance` DATETIME(3) NULL,
    `profession` VARCHAR(191) NULL,
    `profil` VARCHAR(191) NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Utilisateur_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pays` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `codeCountry` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Colis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroColis` VARCHAR(191) NOT NULL,
    `poids` DOUBLE NOT NULL,
    `ville` VARCHAR(191) NOT NULL,
    `modeTransport` VARCHAR(191) NOT NULL,
    `destinateurId` INTEGER NULL,
    `transporteurId` INTEGER NOT NULL,
    `expediteurId` INTEGER NOT NULL,
    `paysId` INTEGER NOT NULL,
    `localisation` ENUM('en_cours', 'livre', 'en_attente') NOT NULL DEFAULT 'en_attente',

    UNIQUE INDEX `Colis_numeroColis_key`(`numeroColis`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModeLivraison` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `libelle` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prix` DOUBLE NOT NULL,
    `utilisateurId` INTEGER NOT NULL,
    `paysId` INTEGER NOT NULL,
    `modeLivraisonId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ville` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `paysId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Utilisateur` ADD CONSTRAINT `Utilisateur_paysId_fkey` FOREIGN KEY (`paysId`) REFERENCES `Pays`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Colis` ADD CONSTRAINT `Colis_destinateurId_fkey` FOREIGN KEY (`destinateurId`) REFERENCES `Utilisateur`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Colis` ADD CONSTRAINT `Colis_transporteurId_fkey` FOREIGN KEY (`transporteurId`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Colis` ADD CONSTRAINT `Colis_expediteurId_fkey` FOREIGN KEY (`expediteurId`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Colis` ADD CONSTRAINT `Colis_paysId_fkey` FOREIGN KEY (`paysId`) REFERENCES `Pays`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transport` ADD CONSTRAINT `Transport_modeLivraisonId_fkey` FOREIGN KEY (`modeLivraisonId`) REFERENCES `ModeLivraison`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transport` ADD CONSTRAINT `Transport_utilisateurId_fkey` FOREIGN KEY (`utilisateurId`) REFERENCES `Utilisateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transport` ADD CONSTRAINT `Transport_paysId_fkey` FOREIGN KEY (`paysId`) REFERENCES `Pays`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ville` ADD CONSTRAINT `Ville_paysId_fkey` FOREIGN KEY (`paysId`) REFERENCES `Pays`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
