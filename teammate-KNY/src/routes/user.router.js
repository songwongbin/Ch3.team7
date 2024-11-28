import express from 'express';
import { prisma } from '../utiles/prisma/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv'; // 환경 변수 관리 라이브러리 가져오기

// 환경 변수 파일(.env)을 로드합니다.
dotenv.config();

// Express 라우터를 초기화합니다.
const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || 'custom_secret_key'; //.env에서 비밀 키 가져오기

/**
 * 사용자 회원가입 API
 * - 이메일 중복 체크
 * - 비밀번호 암호화 (bcrypt 사용)
 * - Prisma 트랜잭션을 이용해 사용자 데이터 저장
 */

// 입력값 검증 함수
const validateSignUpInput = (email, password) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return '유효한 이메일 주소를 입력하세요.';
    }
    if (!password || password.length < 6) {
      return '비밀번호는 최소 6자 이상이어야 합니다.';
    }
    return null;
  };
  
  /** 사용자 회원가입 API */
  router.post('/sign-up', async (req, res) => {
    const { email, password } = req.body;
  
    // 입력값 검증
    const errorMessage = validateSignUpInput(email, password);
    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }
  
    try {
      // 이메일 중복 체크
      const isExistUser = await prisma.users.findFirst({
        where: { email },
      });
  
      if (isExistUser) {
        return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
      }
  
      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // 사용자 생성
      const user = await prisma.users.create({
        data: {
          email,
          password: hashedPassword, // 암호화된 비밀번호 저장
        },
      });
  
      res.status(201).json({
        message: '회원가입이 완료되었습니다.',
        user: { id: user.userid, email: user.email, createdAt: user.createdAt },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '서버 에러', error: error.message });
    }
  });
  
  /** 로그인 API */
  router.post('/sign-in', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // 사용자 조회
      const user = await prisma.users.findFirst({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
      }
  
      // 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
      }
  
      // JWT 생성
      const token = jwt.sign(
        { userId: user.userid, email: user.email }, // 페이로드에 필요한 정보 추가
        SECRET_KEY,
        { expiresIn: '1h' }
      );
  
      res.status(200).json({
        message: '로그인 성공',
        token: `Bearer ${token}`,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: '서버 에러', error: error.message });
    }
  });
  

export default router;
