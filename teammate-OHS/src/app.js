import express from "express";
import dotenv from "dotenv";
import goodsRouter from "./routes/sign_up_router.js";
import Item_list from "./routes/Item_router.js";
import New_Item from "./routes/item_create.js";
import characterName from "./routes/characters_create.js";

dotenv.config();

const app = express();
const PORT = (process.env.PORT = 3000);
// router 연결
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", [goodsRouter, Item_list, New_Item, characterName]);
// 서버 열기
app.listen(PORT, () => {
  console.log(`서버가 ${PORT} 포털 열렸습니다.`);
});
