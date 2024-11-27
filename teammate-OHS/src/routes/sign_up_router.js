import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";
const router = express.Router();
// const users = [];

// router.post("/signup", (request, response) => {
//   const { id, password } = request.body; // { id: 'test', password: 'test' }
//   users.push({ id, password });
//   console.log(`ID: ${id}, Password: ${password}`);
//   return response.json({ users });
// });
// 사용자 회원가입 api
router.post("/signup", authMiddleware, async (req, res, next) => {
  const { email, password, name, age, gender } = req.body;
  const isExistUser = await prisma.users.findFirst({
    where: {
      email,
    },
  });

  if (isExistUser) {
    return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
  }
  const hashedpassword = await bcrypt.hash(password, 10);
  const user = await prisma.users.create({
    data: {
      email,
      password: hashedpassword,
    },
  });

  const userInfo = await prisma.userInfos.create({
    data: {
      userId: user.userId, // 생성한 유저의 userId를 바탕으로 사용자 정보를 생성합니다.
      name,
      age,
      gender: gender.toUpperCase(), // 성별을 대문자로 변환합니다.
    },
  });

  return res.status(201).json({ message: "회원가입이 완료되었습니다." });
});

router.post("/signin", async (req, res, next) => {
  const { email, password } = req.body;

  const user = await prisma.users.findFirst({ where: { email } });

  if (!user)
    return res.status(401).json({ message: "존재하지 않는 이메일 입니다." });
  if (!(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

  const token = jwt.sign({ userId: user.userId }, "custom-secret-key");

  res.cookie("authorization", `bearer ${token}`);
  res.setHeader("authorization", `Bearer ${token}`);
  return res.status(200).json({ message: "로그인에 성공하였습니다." });
});
// 유저 상세 조회 하는 로직 인데 "message": "Cannot destructure property 'authorization' of 'req.cookies' as it is undefined."
//                               이렇게 뜨는거 한번 확인하고 다음으로 진행하기
router.get("/users", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  const user = await prisma.users.findFirst({
    where: { userId: +userId },
    select: {
      userId: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      userInfos: {
        select: {
          name: true,
          age: true,
          gender: true,
        },
      },
    },
  });

  return res.status(200).json({ data: user });
});
export default router;
