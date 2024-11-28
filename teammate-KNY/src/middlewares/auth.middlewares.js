import jwt from 'jsonwebtoken';
import { prisma } from '../utiles/prisma/index.js';
import dotenv from 'dotenv';

const SECRET_KEY = process.env.SECRET_KEY; // JWT 서명에 사용한 비밀 키
//.env 파일에 정의된 SECRET_KEY 값을 가져옵니다.

dotenv.config();

const authMiddleware = async (req, res, next) => {
  try {
        // Authorization 헤더 확인
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 제공되지 않았습니다.' });
    }

    const token = authHeader.split(' ')[1]; // Bearer 다음의 토큰 부분
    const decoded = jwt.verify(token, process.env.SECRET_KEY); // 토큰 검증

    // 토큰에서 추출한 정보를 `req.user`에 추가
    req.user = { userid: decoded.userId };

    //다음 미들웨어로 이동
    next();
  } catch (error) {
    console.error('JWT 검증 실패:', error.message);
    return res.status(401).json({ message: '토큰 검증 실패', error: error.message });
  }
};

export default authMiddleware;
