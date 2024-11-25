// src/routes/users.router.js

import express from "express";
import { prisma } from "../utils/prisma/index.js";
import Joi from "joi";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import authMiddleware from "../middlewares/auth.middleware.js";
import { Prisma } from "@prisma/client";

const router = express.Router();

const signUpSchema = Joi.object({
  loginId: Joi.string()
    .pattern(/^[a-z0-9]+$/)
    .min(4)
    .max(20)
    .required()
    .messages({
      "string.pattern.base":
        "아이디는 영어 소문자와 숫자만 사용할 수 있습니다.",
      "string.min": "아이디는 최소 4자 이상이어야 합니다.",
      "string.max": "아이디는 최대 20자까지 가능합니다.",
    }),
  password: Joi.string().min(6).required().messages({
    "string.min": "비밀번호는 최소 6자 이상이어야 합니다.",
  }),
  verifyPassword: Joi.string().required(),
  name: Joi.string().required(),
});

router.post("/sign-up", async (req, res, next) => {
  try {
    const { loginId, password, verifyPassword, name } =
      await signUpSchema.validateAsync(req.body, { abortEarly: false });

    const isExistUser = await prisma.accounts.findFirst({
      where: {
        loginId,
      },
    });

    if (isExistUser) {
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }
    if (password !== verifyPassword) {
      return res.status(401).json({ message: "비밀번호가 다릅니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Accounts 테이블에 사용자를 추가합니다.

    const account = await prisma.$transaction(
      async (tx) => {
        const account = await tx.accounts.create({
          data: {
            loginId,
            password: hashedPassword,
            name,
          },
        });

        return account;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );

    return res.status(201).json({ message: "회원가입이 완료되었습니다." });
  } catch (error) {
    if (error.isJoi) {
      return res.status(401).json({
        message: "요청 데이터가 올바르지 않습니다.",
        details: error.details.map((detail) => detail.message),
      });
    }
    next(error);
  }
});

/** 로그인 API **/
router.post("/sign-in", async (req, res, next) => {
  const { loginId, password } = req.body;
  const account = await prisma.accounts.findFirst({ where: { loginId } });

  if (!account)
    return res.status(401).json({ message: "존재하지 않는 아이디입니다." });
  // 입력받은 사용자의 비밀번호와 데이터베이스에 저장된 비밀번호를 비교합니다.
  else if (!(await bcrypt.compare(password, account.password)))
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

  // 로그인에 성공하면, 사용자의 userId를 바탕으로 토큰을 생성합니다.
  const token = jwt.sign(
    {
      accountId: account.accountId,
    },
    "custom-secret-key"
  );

  return res.status(200).json({
    message: "로그인 성공",
    token: `Bearer ${token}`,
  });
});

/** 계정 조회 API **/
router.get("/accounts", authMiddleware, async (req, res, next) => {
  const { accountId } = req.user;

  const account = await prisma.accounts.findFirst({
    where: { accountId: +accountId },
    select: {
      accountId: true,
      name: true,
      loginId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ data: account });
});

export default router;
