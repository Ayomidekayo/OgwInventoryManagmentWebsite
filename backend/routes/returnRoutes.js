import express from "express";
import {
  addReturn,
  getAllReturns,
  getReturnById,
  getOverdueReturns,
  updateReturn,
  deleteReturn,
  getReturnableItems,
  getReturnableItemsWithReturns,
} from "../controller/returnController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addReturn);
router.get("/returnable", protect, getReturnableItems);
router.get("/", protect, getAllReturns);
router.get("/overdue", protect, getOverdueReturns);
router.get("/returnable-with-returns", protect, getReturnableItemsWithReturns);
router.get("/:id", protect, getReturnById);
router.put("/:id", protect, updateReturn);
router.delete("/:id", protect, deleteReturn);

export default router;
