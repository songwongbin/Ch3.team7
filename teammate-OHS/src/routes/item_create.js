import express from "express";

const router = express.Router();
const Item = []; // Item 배열 정의

router.post("/Item", (req, res) => {
  const { item_code, item_name, item_price } = req.body;

  // newitem 변수를 정의 (예시로 빈 객체 사용)
  const newitem = {}; // 실제 필요한 값을 여기에 설정해야 함

  const gooditem = {
    newitem,
    item_code,
    item_name,
    item_price,
  };

  Item.push(gooditem); // Item 배열에 gooditem 추가
  console.log("새로 추가된 아이템:", gooditem);
  return res.status(201).json(Item); // Item 배열을 응답으로 반환
});

export default router;
