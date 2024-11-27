/*
  Warnings:

  - You are about to drop the `character_inventory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `character_inventory` DROP FOREIGN KEY `character_inventory_characterId_fkey`;

-- DropForeignKey
ALTER TABLE `character_inventory` DROP FOREIGN KEY `character_inventory_itemId_fkey`;

-- DropTable
DROP TABLE `character_inventory`;

-- CreateTable
CREATE TABLE `character_item` (
    `characterId` INTEGER NOT NULL,
    `itemId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`characterId`, `itemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `character_item` ADD CONSTRAINT `character_item_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `character`(`characterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `character_item` ADD CONSTRAINT `character_item_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`itemId`) ON DELETE CASCADE ON UPDATE CASCADE;
