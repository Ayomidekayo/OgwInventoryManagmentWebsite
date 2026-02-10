import express from "express";
import { adminOnly } from "../middleware/roleMiddleware.js";
import {
  approveRelease,
  cancelRelease,
  deleteReleasedItem,
  getAllReleasedItems,
  getSingleReleasedItem,
  updateReleasedItem,
  createRelease,
  updateReleaseStatus,
  makePending
} from "../controller/releaseController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ CREATE release
router.post("/", protect, createRelease);

// ✅ GET all releases
router.get("/", protect, getAllReleasedItems);

// ✅ GET single release
router.get("/:id", protect, getSingleReleasedItem);

// ✅ UPDATE release
router.put("/:id", protect, adminOnly, updateReleasedItem);

// ✅ DELETE release
router.delete("/:id", protect, adminOnly, deleteReleasedItem);

// ✅ APPROVE / CANCEL
router.patch("/:id/approve", protect, adminOnly(["superadmin"]), approveRelease);
router.patch("/:id/cancel", protect, adminOnly(["superadmin"]), cancelRelease);
router.patch("/:id/pending", protect, adminOnly(["superadmin"]), makePending);

// For users/admins to view all releases
// show filtered by role


router.patch("/:id/status", protect, updateReleaseStatus);

export default router;
