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

/*아이템 장착 API*/
router.put(
  "/characters/:characterId/equipped",
  authMiddleware,
  validateCharacter,
  validateCharacterInventory,
  validateCharacterItemSlot,
  validateItem,
  validateItemOwnership,

  async (req, res) => {
    const { item, character, characterItem } = req;

    try {
      await prisma.$transaction(
        async (tx) => {
          await tx.items.update({
            data: {
              characterInventoryId: null,
              characterItemId: characterItem.characterItemId,
            },
            where: { itemId: item.itemId },
          });

          const addAbilitie = await tx.addAbilities.findFirst({
            where: { itemId: item.itemId },
          });
          const Stat = await tx.stats.findFirst({
            where: { characterId: character.characterId },
          });

          await tx.stats.update({
            data: {
              hp: Stat.hp + addAbilitie.hp,
              str: Stat.str + addAbilitie.str,
            },
            where: { characterId: character.characterId },
          });

          return;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        }
      );

      return res.status(200).json({
        data: `${character.name} 가 ${item.name} 을 장착했습니다.`,
      });
    } catch (err) {
      console.error("Error updating item:", err);
      return res.status(500).json({ message: "서버 에러가 발생했습니다." });
    }
  }
);

/*아이템 탈착 API*/
router.put(
  "/characters/:characterId/detachment",
  authMiddleware,
  validateCharacter,
  validateCharacterInventory,
  validateCharacterItemSlot,
  validateItem,
  async (req, res) => {
    const { item, character, characterInventory, characterItem } = req;

    if (item.characterItemId !== characterItem.characterItemId) {
      return res
        .status(400)
        .json({ message: "해당 아이템은 캐릭터가 장착하지 않았습니다." });
    }

    try {
      await prisma.$transaction(
        async (tx) => {
          await tx.items.update({
            data: {
              characterInventoryId: characterInventory.characterInventoryId,
              characterItemId: null,
            },
            where: { itemId: item.itemId },
          });

          const addAbilitie = await tx.addAbilities.findFirst({
            where: { itemId: item.itemId },
          });
          const Stat = await tx.stats.findFirst({
            where: { characterId: character.characterId },
          });

          await tx.stats.update({
            data: {
              hp: Stat.hp - addAbilitie.hp,
              str: Stat.str - addAbilitie.str,
            },
            where: { characterId: character.characterId },
          });
          return;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        }
      );

      return res.status(200).json({
        data: `${character.name} 가 ${item.name} 을 장착해제 하였습니다.`,
      });
    } catch (err) {
      console.error("Error updating item:", err);
      return res.status(500).json({ message: "서버 에러가 발생했습니다." });
    }
  }
);

/*장착 아이템 조회 API*/ //이거 아직 안돌려봄.
router.get(
  "/characters/:characterId/characterItems",
  async (req, res, next) => {
    const characterId = req.params.characterId;

    if (!characterId || isNaN(+characterId)) {
      return res
        .status(400)
        .json({ message: "유효하지 않은 characterId 입니다." });
    }

    const character = await prisma.characters.findFirst({
      where: { characterId: +characterId },
    });

    if (!character)
      return res.status(404).json({ message: "캐릭터가 존재하지 않습니다." });

    const characterItem = await prisma.characterItems.findFirst({
      where: { characterId: +characterId },
    });

    const characterItemId = characterItem
      ? characterItem.characterItemId
      : null;

    const items = await prisma.items.findMany({
      where: { characterItemId: +characterItemId },
      select: {
        itemId: true,
        accountId: true,
        name: true,
        price: true,
        AddAbilities: {
          select: {
            hp: true,
            str: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // 아이템을 최신순으로 정렬합니다.
      },
    });

    return res.status(200).json({ data: items });
  }
);

export default router;
