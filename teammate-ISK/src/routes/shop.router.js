import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";

import {
  validateItem,
  validateCharacter,
  validateCharacterInventory,
  validateCharacterItemSlot,
  validateItemOwnership,
} from "../middlewares/validate.middleware.js";

import { prisma } from "../utils/prisma/index.js";
import { Prisma } from "@prisma/client";

const router = express.Router();

/*돈복사 api*/
router.put(
  "/characters/:characterId/money",
  authMiddleware,
  validateCharacter,
  async (req, res, next) => {
    const { character } = req;

    try {
      await prisma.characters.update({
        data: { money: character.money + 10000 },
        where: {
          characterId: character.characterId,
        },
      });

      return res.status(200).json({
        data: `${character.name} 의 money가 ${character.money+ 10000}이 되었습니다.`,
      });
    } catch (err) {
      console.error("Error updating item:", err);
      return res.status(500).json({ message: "서버 에러가 발생했습니다." });
    }
  }
);

/*아이템 구매api*/
router.put(
  "/characters/:characterId/purchase",
  authMiddleware,
  validateCharacter,
  validateCharacterInventory,
  validateItem,
  async (req, res, next) => {
    const { item, character, characterInventory } = req;

    console.log("Character:", character);
console.log("Character Money:", character.money);

    try {
      if (item.prise > character.money) {
        return res.status(400).json({
          message: `캐릭터의 money가 부족합니다.`,
        });
      }

      if (item.characterItemId) {
        return res.status(400).json({
          message: `아이템이 이미 다른 캐릭터에게 장착되어 있습니다.`,
        });
      }

      if (item.characterInventoryId) {
        return res.status(400).json({
          message: "아이템이 이미 다른 캐릭터에게 소유되어 있습니다.",
        });
      }

      await prisma.$transaction(
        async (tx) => {
          await tx.items.update({
            data: {
              characterInventoryId: characterInventory.characterInventoryId,
            },
            where: {
              itemId: item.itemId,
            },
          });

          await tx.characters.update({
            data: { money: character.money - item.price },
            where: {
              characterId: character.characterId,
            },
          });
          return ;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        }
      );

      return res.status(200).json({
        data: `${character.name} 가 ${item.name} 을 구매했습니다.
남은 money는 ${character.money-item.price}입니다. `,
      });

    } catch (err) {
      console.error("Error updating item:", err);
      return res.status(500).json({ message: "서버 에러가 발생했습니다." });
    }
  }
);

/*아이템 판매api*/
router.put(
  "/characters/:characterId/sale",
  authMiddleware,
  validateCharacter,
  validateCharacterInventory,
  validateItem,
  async (req, res, next) => {
    const { item, character, characterInventory } = req;

    try {
      if (item.characterItemId) {
        return res.status(400).json({
          message: `아이템이 장착되어 있습니다.`,
        });
      }

      if (
        item.characterInventoryId !== characterInventory.characterInventoryId
      ) {
        return res.status(400).json({
          message: "아이템이 다른 캐릭터에게 소유되어 있습니다.",
        });
      }

      await prisma.$transaction(
        async (tx) => {
          await tx.items.update({
            data: { characterInventoryId: null },
            where: {
              itemId: item.itemId,
            },
          });

          await tx.characters.update({
            data: { money: character.money + (2 * item.price) / 3 },
            where: {
              characterId: character.characterId,
            },
          });

          return;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        }
      );

      return res.status(200).json({
        data: `${character.name} 가 ${item.name} 을 판매했습니다.
  남은 money는 ${character.money + (2 * item.price) / 3 }입니다. `,
      });
    } catch (err) {
      console.error("Error updating item:", err);
      return res.status(500).json({ message: "서버 에러가 발생했습니다." });
    }
  }
);

export default router;
