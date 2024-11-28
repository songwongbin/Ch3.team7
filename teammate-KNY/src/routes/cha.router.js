import express from 'express';
import { prisma } from '../utiles/prisma/index.js';
import authMiddleware from '../middlewares/auth.middlewares.js';
import dotenv from 'dotenv';// 환경 변수 관리 라이브러리 가져오기


// 환경 변수 파일(.env)을 로드합니다.
dotenv.config();

// Express 라우터를 초기화합니다.
const router = express.Router();

/** 캐릭터 생성 API **/
// 캐릭터 생성 시 중복 이름 체크 및 기본 값 설정
router.post('/characters', authMiddleware, async (req, res, next) => {
  try {
    const { userid } = req.user; // 인증된 사용자 ID
    const { charactername } = req.body; // 캐릭터 이름 받기

    // 캐릭터 이름 중복 확인
    const existingCharacter = await prisma.character.findFirst({
      where: { charactername, userid },
    });

    // 중복된 이름이면 에러 반환
    if (existingCharacter) {
      return res.status(409).json({ message: '이미 존재하는 캐릭터 이름입니다.' });
    }

    // 캐릭터 생성
    const character = await prisma.character.create({
      data: {
        charactername, // 캐릭터 이름
        health: 500,   // 기본 체력
        power: 100,    // 기본 힘
        money: 10000,  // 기본 지급 머니
        userid,        // 인증된 사용자와 연결
      },
    });

    res.status(201).json({
      message: '캐릭터가 생성되었습니다.'
    });
  } catch (error) {
    console.error('캐릭터 생성 실패:', error.message);
    res.status(500).json({ message: '캐릭터 생성 실패', error: error.message });
  }
});

/** 캐릭터 삭제 API **/
// 삭제할 캐릭터가 인증된 사용자 소유인지 확인 후 삭제
router.delete('/:characterid', authMiddleware, async (req, res) => {
  try {
    const { characterid } = req.params; // URI에서 캐릭터 ID 추출
    const { userid } = req.user;       // 인증된 사용자 ID

    // 캐릭터 존재 여부 및 소유 확인
    const character = await prisma.character.findFirst({
      where: {
        characterid: parseInt(characterid, 10), // 캐릭터 ID
        userid, // 현재 사용자 소유인지 확인
      },
    });

    if (!character) {
      return res.status(404).json({ message: '캐릭터가 존재하지 않거나 권한이 없습니다.' });
    }

    // 캐릭터 삭제
    await prisma.character.delete({
      where: { characterid: parseInt(characterid, 10) },
    });

    res.status(200).json({ message: '캐릭터가 삭제되었습니다.' });
  } catch (error) {
    console.error('캐릭터 삭제 실패:', error.message);
    res.status(500).json({ message: '캐릭터 삭제 실패', error: error.message });
  }
});


/** 캐릭터 상세 조회 API **/
router.get('/:characterid', authMiddleware, async (req, res) => {
  try {
    const { characterid } = req.params; // URI에서 캐릭터 ID 추출
    const { userid } = req.user; // 인증된 사용자 ID

    // 캐릭터 ID 유효성 확인
    if (!characterid || isNaN(parseInt(characterid, 10))) {
      return res.status(400).json({ message: '유효한 캐릭터 ID를 제공해야 합니다.' });
    }

    // 캐릭터 조회
    const character = await prisma.character.findUnique({
      where: {
        characterid: parseInt(characterid, 10),
      },
    });

    // 캐릭터가 없으면 404 반환
    if (!character) {
      return res.status(404).json({ message: '캐릭터가 존재하지 않습니다.' });
    }

    // 반환 데이터 구성
    const response = {
      charactername: character.charactername,
      health: character.health,
      power: character.power,
    };

    // 내 캐릭터인지 확인 후 게임 머니 포함
    if (character.userid === userid) {
      response.money = character.money;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('캐릭터 상세 조회 실패:', error.message);
    res.status(500).json({ message: '캐릭터 상세 조회 실패', error: error.message });
  }
});

/** 캐릭터 인벤토리 API **/
// 특정 캐릭터의 인벤토리에 아이템 추가
router.post('/:characterid/inventory', authMiddleware, async (req, res) => {
  try {
    // URI에서 캐릭터 ID를 추출
    const { characterid } = req.params;

    // 인증된 사용자 ID
    const { userid } = req.user;

    // 요청 본문에서 아이템 이름과 속성을 추출
    const { itemname, itemAttributes } = req.body;

    // 요청 본문 유효성 검사
    if (!itemname || !itemAttributes) {
      return res.status(400).json({
        message: 'itemname(아이템 이름)과 itemAttributes(아이템 속성)를 제공해야 합니다.',
      });
    }

    // itemAttributes가 JSON 형식인지 확인
    if (typeof itemAttributes !== 'object' || Array.isArray(itemAttributes)) {
      return res.status(400).json({
        message: 'itemAttributes는 JSON 형식이어야 합니다.',
      });
    }

    // 캐릭터 존재 확인
    const character = await prisma.character.findFirst({
      where: {
        characterid: parseInt(characterid, 10), // 정수로 변환하여 비교
        userid, // 인증된 사용자의 캐릭터인지 확인
      },
    });

    // 캐릭터가 없으면 404 에러 반환
    if (!character) {
      return res.status(404).json({ message: '캐릭터가 존재하지 않습니다.' });
    }

    // 인벤토리에 아이템 추가
    const inventoryItem = await prisma.inventory.create({
      data: {
        characterid: parseInt(characterid, 10), // 캐릭터와 연결
        name: itemname, // 아이템 이름
        attributes: itemAttributes, // JSON 형식으로 아이템 속성 저장
      },
    });

    // 성공 응답 반환
    res.status(201).json({
      message: '아이템이 인벤토리에 추가되었습니다.',
      inventoryItem,
    });
  } catch (error) {
    // JSON 형식이 잘못된 경우 처리
    if (error instanceof SyntaxError) {
      return res.status(400).json({
        message: '요청 본문이 유효한 JSON 형식이 아닙니다.',
      });
    }

    // 기타 에러 처리
    res.status(500).json({ message: '인벤토리 추가 실패', error: error.message });
  }
});


//특정 캐릭터의 인벤토리에 있는 모든 아이템을 조회합니다.
router.get('/:characterid/inventory', authMiddleware, async (req, res) => {
  try {
    const { characterid } = req.params; // URI에서 캐릭터 ID 추출
    const { userid } = req.user; // 인증된 사용자 ID

    // 캐릭터 존재 확인
    const character = await prisma.character.findFirst({
      where: {
        characterid: parseInt(characterid, 10),
        userid, // 현재 사용자 소유인지 확인
      },
    });

    if (!character) {
      return res.status(404).json({ message: '캐릭터가 존재하지 않습니다.' });
    }

    // 인벤토리 조회
    const inventoryItems = await prisma.inventory.findMany({
      where: {
        characterid: parseInt(characterid, 10), // 해당 캐릭터의 아이템만 조회
      },
    });

    res.status(200).json({ inventoryItems });
  } catch (error) {
    res.status(500).json({ message: '인벤토리 조회 실패', error: error.message });
  }
});

export default router;
