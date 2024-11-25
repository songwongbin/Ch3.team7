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

const router = express.Router();

/**인벤토리에 아이템 넣기 **/ //다른 사람이 가지고 있으면 못얻음.
router.put(
  "/characters/:characterId/CharacterInventorys",
  authMiddleware,
  validateCharacter,
  validateCharacterInventory,
  validateItem,
  async (req, res, next) => {
    const { item, character, characterInventory } = req;

    try {
      if (item.characterItemId) {
        return res.status(400).json({
          message: `아이템이 이미 다른 캐릭터에게 장착되어 있습니다.`,
        });
      }

      if (item.characterInventoryId) {
        return res
          .status(400)
          .json({
            message: "아이템이 이미 다른 캐릭터에게 소유되어 있습니다.",
          });
      }

      await prisma.items.update({
        data: { characterInventoryId: characterInventory.characterInventoryId }, //참조할 애를 잘
        where: {
          itemId: item.itemId,
        },
      });

      return res.status(200).json({
        data: `${character.name} 인벤토리에 ${item.name} 을 넣었습니다. `,
      });
    } catch (err) {
      console.error("Error updating item:", err);
      return res.status(500).json({ message: "서버 에러가 발생했습니다." });
    }
  }
);

/** 인벤토리 조회 API **/ //미들 웨어가 코인 있을때만 쓸수 있어서 좀 힘드네.
router.get(
  "/characters/:characterId/CharacterInventorys",
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

    const characterInventory = await prisma.characterInventorys.findFirst({
      where: { characterId: +characterId },
    });

    const characterInventoryId = characterInventory
      ? characterInventory.characterInventoryId
      : null;

    const items = await prisma.items.findMany({
      where: { characterInventoryId: +characterInventoryId },
      select: {
        characterInventoryId: true,
        itemId: true,
        name: true,
        price: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc", // 캐릭터를 최신순으로 정렬합니다.
      },
    });

    return res.status(200).json({ data: items });
  }
);

export default router;
