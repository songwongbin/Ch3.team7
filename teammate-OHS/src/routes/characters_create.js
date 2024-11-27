import express from "express";
import { prisma } from "../utils/prisma/index.js";
const router = express.Router();
const characters = [];

router.post("/characters", (req, res) => {
  console.log("요청 본문:", req.body);
  console.log("현재 캐릭터 배열:", characters); // 캐릭터 배열 로그 추가

  const { character_name, character_health, character_power } = req.body;

  if (!character_name) {
    return res.status(400).json({
      errorMessage: "데이터 형식이 올바르지 않습니다.",
    });
  }

  const newCharacterId = characters.length + 1;
  characters.push({
    id: newCharacterId,
    name: character_name,
    health: character_health || 100,
    power: character_power || 50,
  });

  res.json({
    message: `새로운 캐릭터 ‘${character_name}’를 생성하셨습니다!`,
    data: {
      character_id: newCharacterId,
    },
  });
});

// // // // 캐릭터 상세 조회
// // // router.get("/:id", (req, res) => {
// // //   const characterId = parseInt(req.params.id, 10);
// // //   const character = characters.find((c) => c.id === characterId);

// // //   if (!character) {
// // //     return res.status(404).json({
// // //       message: "캐릭터 조회에 실패하였습니다.",
// // //     });
// // //   }

// // //   res.json({
// // //     data: {
// // //       name: character.name,
// // //       health: character.health,
// // //       power: character.power,
// // //     },
// // //   });
// // // });

// // // 캐릭터 삭제
// // // router.delete("/charcter/:characterId", async (req, res) => {
// // //   const { characterId } = req.params;
// // //   console.log("실행");
// // //   const todo = await characters;
// // //   if (!todo) {
// // //     return res
// // //       .status(404)
// // //       .json({ errorMessage: "존재하지 않는 캐릭터입니다." });
// // //   }

// // //   await prisma.character.delete({ where: { character_name } });

// // //   return res.status(200).json({});
// // // //   console.log(`삭제 요청 ID: ${characterId}`);

// // //   const characterIndex = characters.findIndex((c) => c.id === characterId);
// // //   if (characterIndex === "1") {
// // //     return res.status(404).json({
// // //       message: "캐릭터에 해당하는 ID가 존재하지 않습니다.",
// // //     });
// // //   }

// // //   const deletedCharacter = characters.splice(characterIndex, 1)[0];
// // //   res.json({
// // //     message: `캐릭터 ‘${deletedCharacter.name}’을 삭제하셨습니다.`,
// // //   });
// // // });

export default router;
