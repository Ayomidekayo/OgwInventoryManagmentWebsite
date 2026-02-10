import express from "express";
import { 
  addItem, 
  deleteItem, 
  getAllItems, 
  getSingleItem, 
  releaseItem, 
  returnItem, 
  updateItem 
} from "../controller/itemController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ----------------------------------------
// Protect all routes
// ----------------------------------------
router.use(protect);

// ----------------------------------------
// Item routes (any logged-in user)
// ----------------------------------------
router.post("/add", addItem);
router.get("/get", getAllItems);
router.get("/:id", getSingleItem);
router.post("/release/:id", releaseItem);
router.post("/return/:id", returnItem);

// ----------------------------------------
// Admin / Superadmin routes
// ----------------------------------------
router.put("/:id", adminOnly(["superadmin"]), updateItem);
router.delete("/:id", adminOnly(["superadmin"]), deleteItem);

export default router;
