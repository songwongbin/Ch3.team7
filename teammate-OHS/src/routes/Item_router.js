import express from "express";

const router = express.Router();

router.get("/Item", (req, res) => {
  const Item_list = [
    {
      item_code: 1,
      name: "치명적인 반지",
      item_price: 10,
    },
    {
      item_code: 2,
      name: "어느 낚시꾼의 신발",
      item_price: 15,
    },
    {
      item_code: 3,
      name: "신기하게 생긴 알",
      item_price: 150,
    },
  ];
  console.log(Item_list);
  return res.json(Item_list);
});

export default router;
