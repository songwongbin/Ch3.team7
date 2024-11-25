import { prisma } from "../utils/prisma/index.js";

// 아이템 유효성 검사
export async function validateItem(req, res, next) {
  const { itemId } = req.body;

  if (!itemId || isNaN(+itemId)) {
    return res.status(400).json({ message: "유효하지 않은 itemId 입니다." });
  }

  const item = await prisma.items.findFirst({ where: { itemId: +itemId } });
  if (!item) {
    return res.status(404).json({ message: "아이템이 존재하지 않습니다." });
  }

  req.item = item;
  next();
}

// 캐릭터 유효성 검사
export async function validateCharacter(req, res, next) {
  const { accountId } = req.user;
  const characterId = req.params.characterId;

  if (!characterId || isNaN(+characterId)) {
    return res
      .status(400)
      .json({ message: "유효하지 않은 characterId 입니다." });
  }

  const character = await prisma.characters.findFirst({
    where: { characterId: +characterId },
  });
  if (!character) {
    return res.status(404).json({ message: "캐릭터가 존재하지 않습니다." });
  }

  if (character.accountId !== accountId) {
    return res
      .status(401)
      .json({ message: "이 캐릭터는 로그인된 계정과 연결되지 않았습니다." });
  }

  req.character = character;
  next();
}

// 캐릭터 인벤토리 유효성 검사
export async function validateCharacterInventory(req, res, next) {
  const characterId = req.params.characterId;

  const characterInventory = await prisma.characterInventorys.findFirst({
    where: { characterId: +characterId },
  });

  if (!characterInventory) {
    return res
      .status(404)
      .json({ message: "캐릭터의 인벤토리가 존재하지 않습니다." });
  }

  req.characterInventory = characterInventory;
  next();
}

// 캐릭터 장비 슬롯 검사
export async function validateCharacterItemSlot(req, res, next) {
  const characterId = req.params.characterId;

  const characterItem = await prisma.characterItems.findFirst({
    where: { characterId: +characterId },
  });

  if (!characterItem) {
    return res
      .status(404)
      .json({ message: "캐릭터의 장비 슬롯이 존재하지 않습니다." });
  }

  req.characterItem = characterItem;
  next();
}

export function validateItemOwnership(req, res, next) {
  //애는 아이템과 인벤토리의 유효성 이후 확인 가능.
  const { item, characterInventory } = req;

  if (item.characterInventoryId !== characterInventory.characterInventoryId) {
    return res
      .status(400)
      .json({ message: "해당 아이템은 캐릭터의 인벤토리에 없습니다." });
  }

  if (item.characterItemId) {
    return res.status(400).json({
      message: `아이템이 이미 다른 캐릭터에게 장착되어 있습니다.`,
    });
  }

  next();
}
