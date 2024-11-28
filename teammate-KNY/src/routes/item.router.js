import express from 'express';
import { prisma } from '../utiles/prisma/index.js';
import authMiddleware from '../middlewares/auth.middlewares.js';
import dotenv from 'dotenv'; // 환경 변수 관리 라이브러리 가져오기
import jwt from 'jsonwebtoken';

// 환경 변수 파일(.env)을 로드합니다.
dotenv.config();

// Express 라우터를 초기화합니다.
const router = express.Router();

// 아이템 생성 api
router.post('/items', authMiddleware, async (req, res, next) => {
  try {
    // 인증 미들웨어를 통해 현재 사용자의 정보를 가져옵니다.
    const { userid } = req.user;

    // 사용자 인증 후에도 userId가 없으면 에러 반환
    if (!userid) {
      return res.status(401).json({ error: '유저 아이디가 없습니다.' });
    }

    // 요청 본문에서 아이템 데이터를 추출합니다.
    const { code, itemname, ability, price } = req.body;

    // 필수 데이터가 제공되었는지 확인합니다.
    if (!code || !itemname || !ability || price == null) {
      return res.status(400).json({
        error: 'Item code, Item name, ability, price를 기입해주세요. ',
      });
    }

    // 아이템 능력(`ability`)이 올바른 JSON 형식인지 확인합니다.
    if (typeof ability !== 'object' || Array.isArray(ability)) {
      return res.status(400).json({
        error: '아이템 능력이 올바른 형식이 아닙니다.',
      });
    }

    // Prisma를 사용해 데이터베이스에 새로운 아이템을 생성합니다.
    const item = await prisma.item.create({
      data: {
        code, // 아이템 코드
        itemname, // 아이템 이름
        ability, // JSON 형식의 아이템 능력 (Prisma는 Json 타입을 지원)
        price: +price, // 아이템 가격을 숫자로 변환하여 저장
        userid: userid, // 현재 사용자 ID를 저장하여 소유권 설정
      },
    });

    // 생성된 아이템 데이터를 상태 코드 201과 함께 클라이언트에 반환합니다.
    return res.status(201).json({ data: item });
  } catch (error) {
    // Prisma 에러 처리
    if (error.code === 'P2002') {
      return res.status(400).json({ error: '중복된 아이템 코드입니다.' });
    }

    // 기타 에러 처리
    console.error('Error creating item:', error.message);
    next(error);
  }
});


/** 아이템 수정 API **/
// patch 요청으로 아이템을 수정
router.patch('/:code/refresh', async (req, res, next) => {
  try {
    // URI에서 code를 추출합니다.
    const { code } = req.params;

    // 요청 본문에서 아이템 이름과 능력치를 추출합니다.
    const { itemname, ability } = req.body;

    // code가 숫자인지 확인
    if (!code || isNaN(parseInt(code, 10))) {
      return res.status(400).json({ message: '유효하지 않은 아이템 코드입니다.' });
    }

    const numericCode = parseInt(code, 10);

    // 필수 데이터 확인
    if (!itemname || !ability) {
      return res.status(400).json({
        message: '아이템 이름(itemname)과 능력치(ability)를 입력해야 합니다.',
      });
    }

    // ability가 JSON 객체인지 확인
    if (typeof ability !== 'object' || Array.isArray(ability)) {
      return res.status(400).json({ message: '아이템 능력치(ability)는 JSON 형식이어야 합니다.' });
    }

    // 데이터베이스에서 해당 아이템 코드로 아이템 검색
    const item = await prisma.item.findUnique({
      where: { code: numericCode },
    });

    // 아이템이 존재하지 않으면 404 반환
    if (!item) {
      return res.status(404).json({ message: '아이템이 존재하지 않습니다.' });
    }

    // 아이템 수정
    const updatedItem = await prisma.item.update({
      where: { code: numericCode },
      data: {
        itemname, // 아이템 이름 업데이트
        ability,  // 아이템 능력치 업데이트
      },
    });

    // 수정된 아이템 반환
    return res.status(200).json({
      message: '아이템이 성공적으로 수정되었습니다.',
      data: updatedItem,
    });
  } catch (error) {
    // 에러 처리
    console.error('아이템 수정 중 에러 발생:', error.message);
    next(error);
  }
});

// 아이템 목록 조회
router.get('/items', async (req, res, next) => {
  try {
    // 데이터베이스에서 모든 아이템을 조회
    const items = await prisma.item.findMany({
      select: {
        code: true,      // 아이템 코드
        itemname: true,  // 아이템 이름
        price: true,     // 아이템 가격
      },
      orderBy: {
        createdAt: 'desc', // 최신순으로 정렬
      },
    });

    // 조회된 데이터 반환
    return res.status(200).json({ data: items });
  } catch (error) {
    console.error('아이템 목록 조회 중 에러 발생:', error.message);
    next(error);
  }
});


/** 아이템 상세 조회 API **/
// 특정 아이템 코드를 기반으로 아이템 상세 정보 조회
router.get('/items/:code', async (req, res, next) => {
  try {
    // URI에서 아이템 코드 추출
    const { code } = req.params;

    // 아이템 코드 유효성 확인
    if (!code || isNaN(parseInt(code, 10))) {
      return res.status(400).json({ message: '유효한 아이템 코드를 제공해야 합니다.' });
    }

    // Prisma를 사용하여 데이터베이스에서 아이템 검색
    const item = await prisma.item.findUnique({
      where: {
        code: parseInt(code, 10), // 아이템 코드를 정수로 변환하여 조회
      },
      select: {
        code: true,      // 아이템 코드
        itemname: true,  // 아이템 이름
        ability: true,   // 아이템 속성
        price: true,     // 아이템 가격
      },
    });

    // 아이템이 존재하지 않으면 404 반환
    if (!item) {
      return res.status(404).json({ message: '아이템이 존재하지 않습니다.' });
    }

    // 조회된 데이터를 클라이언트에 반환
    return res.status(200).json({ data: item });
  } catch (error) {
    // 에러 발생 시 로그 출력 및 에러 처리 미들웨어로 전달
    console.error('아이템 상세 조회 실패:', error.message);
    next(error);
  }
});

export default router;