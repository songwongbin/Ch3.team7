import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import dotenv from 'dotenv';

dotenv.config();

export default async function (req, res, next) {
  try {
    const { authorization } = req.headers;
    if (!authorization) throw new Error("헤더가 존재하지 않습니다.");

    const [tokenType, token] = authorization.split(" ");

    if (tokenType !== "Bearer")
      throw new Error("토큰 타입이 일치하지 않습니다.");

    const decodedToken = jwt.verify(token, process.env.AUTT_SECRET_KEY);
    const accountId = decodedToken.accountId;

    const account = await prisma.accounts.findFirst({
      where: { accountId: +accountId },
    });
    if (!accountId) throw new Error("토큰 사용자가 존재하지 않습니다.");
    req.user = account;

    next();
  } catch (error) {
    // 토큰이 만료되었거나, 조작되었을 때, 에러 메시지를 다르게 출력합니다.
    switch (error.name) {
      case "TokenExpiredError":
        return res.status(401).json({ message: "토큰이 만료되었습니다." });
      case "JsonWebTokenError":
        return res.status(401).json({ message: "토큰이 조작되었습니다." });
      default:
        return res
          .status(401)
          .json({ message: error.message ?? "비정상적인 요청입니다." });
    }
  }
}
