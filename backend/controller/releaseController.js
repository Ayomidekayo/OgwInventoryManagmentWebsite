import Item from "../models/Item.js";
import ReleaseLog from "../models/ReleaseLog.js";
import Notification from "../models/Notification.js";
import ActionLog from "../models/ActionLog.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import { emailTemplates } from "../utils/emailTemplates.js";

export const createRelease = async (req, res) => {
  try {
    const { itemId, qtyReleased, releasedTo, expectedReturnBy } = req.body;

    // Automatically use logged-in user as "releasedBy"
    const releasedBy = req.user._id;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.quantity < qtyReleased)
      return res.status(400).json({ message: "Insufficient quantity" });

    // ✅ Update item quantity and status
    item.quantity -= qtyReleased;
    if (item.quantity === 0) item.currentStatus = "out";
    await item.save();

    // ✅ Create release log
    const release = await ReleaseLog.create({
      item: itemId,
      qtyReleased,
      releasedTo,
      releasedBy,
      isReturnable: item.isRefundable,
      expectedReturnBy: expectedReturnBy || null,
    });

    // ✅ Create notification
    await Notification.create({
      message: `${qtyReleased} x ${item.name} released to ${releasedTo}`,
      itemId: item._id,
      type: "info",
      meta: { releaseId: release._id },
    });

    // ✅ Log user action
    await ActionLog.create({
      user: releasedBy,
      action: "release_item",
      details: { itemId: item._id, releaseId: release._id, qtyReleased },
    });

    res.status(201).json({ message: "Item released", release });
  } catch (err) {
    console.error("❌ Error in createRelease:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
/**
 * Release an item to a user or department.
 * Accessible by all authenticated users.
 */
export const releaseItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { qtyReleased, releasedTo, expectedReturnBy } = req.body;
    const releasedBy = req.user._id;

    // ✅ Validate item ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    // ✅ Validate input
    if (!qtyReleased || qtyReleased <= 0 || !releasedTo) {
      return res.status(400).json({
        message: "Quantity released and recipient are required.",
      });
    }

    // ✅ Fetch item
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    // ✅ Stock validation
    if (item.quantity < qtyReleased) {
      return res.status(400).json({
        message: `Insufficient stock. Only ${item.quantity} unit(s) available.`,
      });
    }

    // ✅ Deduct stock & update status
    item.quantity -= qtyReleased;
    item.currentStatus = item.quantity === 0 ? "out" : "in";
    await item.save();

    // ✅ Create release log
    const release = await ReleaseLog.create({
      item: item._id,
      qtyReleased,
      releasedTo,
      releasedBy,
      isReturnable: item.isRefundable,
      expectedReturnBy: expectedReturnBy || null,
    });

    // ✅ Get releasing user
    const user = await User.findById(releasedBy).select("name email role");

    // ✅ Create in-app notification
    const notif = await Notification.create({
      toUser: releasedBy,
      itemId: item._id,
      type: "release-item",
      message: `${qtyReleased} ${item.measuringUnit}(s) of "${item.name}" released to ${releasedTo} by ${user.name}.`,
      meta: {
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        itemName: item.name,
        category: item.category,
        measuringUnit: item.measuringUnit,
        qtyReleased,
        remainingQty: item.quantity,
        isRefundable: item.isRefundable,
        expectedReturnBy,
      },
    });

    // ✅ Log user action
    await ActionLog.create({
      user: releasedBy,
      action: "release_item",
      details: {
        itemId: item._id,
        releaseId: release._id,
        qtyReleased,
        releasedTo,
      },
    });

    // ✅ Send email notification
    const subject = `📦 Item Released: ${item.name}`;
    const html = emailTemplates.itemReleased({
      item: item.name,
      releasedTo,
      quantity: qtyReleased,
      releasedBy: user.name,
    });

    // Send to admin + releasing user (if configured)
    const recipients = [process.env.ADMIN_EMAIL, user.email].filter(Boolean);

    for (const email of recipients) {
      await sendEmail({ to: email, subject, html });
    }

    //  Check low stock or trigger restock alerts
    await checkLowStock(item, user);

    // Respond to client
    res.status(201).json({
      message: "Item released successfully.",
      release,
      notification: notif,
      remainingQuantity: item.quantity,
    });
  } catch (err) {
    console.error("❌ Error releasing item:", err);
    res.status(500).json({
      message: "Server error while releasing item.",
      error: err.message,
    });
  }
};

/**
 * @desc Get list of released items (all users)
 * @route GET /api/releases
 * @access Admin, SuperAdmin, or Authenticated user
 */
export const getAllReleasedItems = async (req, res) => {
  try {
    const { itemId, releasedBy, releasedTo, startDate, endDate, status } = req.query;
    const query = {};

    // 🧩 Optional filters
    if (itemId) query.item = itemId;
    if (releasedBy) query.releasedBy = releasedBy;
    if (releasedTo) query.releasedTo = { $regex: releasedTo, $options: "i" };
    if (status) query.approvalStatus = status; // pending | approved | cancelled

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // ✅ Everyone (users, admins, superadmins) can now see ALL release items
    // ❌ Remove restriction that filtered by `releasedBy` for non-superadmins
    // (we no longer limit by req.user._id)

    // 🧠 Fetch release logs with item & user details
    const releases = await ReleaseLog.find(query)
      .populate({
        path: "item",
        select: "name category measuringUnit isRefundable",
      })
      .populate({
        path: "releasedBy",
        select: "name email role",
      })
      .sort({ createdAt: -1 });

    // 🪄 Format response for frontend
    const formattedReleases = releases.map((rel) => ({
      _id: rel._id,
      item: rel.item ? rel.item.name : "N/A",
      qtyReleased: rel.qtyReleased,
      releasedTo: rel.releasedTo,
      isReturnable: rel.isReturnable,
      expectedReturnBy: rel.expectedReturnBy,
      dateReleased: rel.dateReleased,
      returnStatus: rel.returnStatus,
      approvalStatus: rel.approvalStatus || "pending",
      releasedBy: rel.releasedBy ? {
        name: rel.releasedBy.name,
        email: rel.releasedBy.email,
        role: rel.releasedBy.role
      } : null,
    }));

    res.status(200).json({
      count: formattedReleases.length,
      data: formattedReleases,
    });
  } catch (error) {
    console.error("❌ Error fetching released items:", error);
    res.status(500).json({
      message: "Server error while fetching released items.",
      error: error.message,
    });
  }
};



/**
 * @desc Get a single released item by ID
 * @route GET /api/releases/:id
 * @access Admin, SuperAdmin, or Authenticated user
 */
export const getSingleReleasedItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid release ID format." });
    }

    // Find the release log by ID
    const release = await ReleaseLog.findById(id)
      .populate({
        path: "item",
        select: "name category measuringUnit isRefundable",
      })
      .populate({
        path: "releasedBy",
        select: "name email role",
      });

    if (!release) {
      return res.status(404).json({ message: "Release record not found." });
    }

    // Format clean response
    const formattedRelease = {
      _id: release._id,
      item: release.item?.name || "N/A",
      category: release.item?.category || "N/A",
      measuringUnit: release.item?.measuringUnit,
      isRefundable: release.item?.isRefundable || false,
      qtyReleased: release.qtyReleased,
      releasedTo: release.releasedTo,
      isReturnable: release.isReturnable,
      expectedReturnBy: release.expectedReturnBy,
      dateReleased: release.dateReleased,
      createdAt: release.createdAt,
      releasedBy: release.releasedBy
        ? {
            name: release.releasedBy.name,
            email: release.releasedBy.email,
            role: release.releasedBy.role,
          }
        : { name: "Unknown", role: "N/A" },
    };

    res.status(200).json({ data: formattedRelease });
  } catch (error) {
    console.error("Error fetching released item:", error);
    res.status(500).json({
      message: "Server error while fetching released item.",
      error: error.message,
    });
  }
};

/**
 * @desc Update/Edit a released item record
 * @route PUT /api/releases/:id
 * @access Admin or SuperAdmin
 */
export const updateReleasedItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid release ID format." });
    }

    // Check if release exists
    const release = await ReleaseLog.findById(id);
    if (!release) {
      return res.status(404).json({ message: "Release record not found." });
    }

    // If item is changed, ensure new item exists
    if (updates.item) {
      const itemExists = await Item.findById(updates.item);
      if (!itemExists) {
        return res.status(400).json({ message: "Referenced item not found." });
      }
    }

    // Apply updates
    Object.assign(release, updates);
    const updatedRelease = await release.save();

    res.status(200).json({
      message: "Release record updated successfully.",
      data: updatedRelease,
    });
  } catch (error) {
    console.error("❌ Error updating released item:", error);
    res.status(500).json({
      message: "Server error while updating release record.",
      error: error.message,
    });
  }
};

/**
 * @desc Delete a released item record
 * @route DELETE /api/releases/:id
 * @access Admin or SuperAdmin
 */
export const deleteReleasedItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid release ID format." });
    }

    // Check if release exists
    const release = await ReleaseLog.findById(id);
    if (!release) {
      return res.status(404).json({ message: "Release record not found." });
    }

    await release.deleteOne();

    res.status(200).json({ message: "Release record deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting released item:", error);
    res.status(500).json({
      message: "Server error while deleting release record.",
      error: error.message,
    });
  }
};

// Approve release
export const approveRelease = async (req, res) => {
  try {
    const release = await ReleaseLog.findById(req.params.id)
      .populate("item releasedBy", "name email");

    if (!release) return res.status(404).json({ message: "Release not found" });

    release.approvalStatus = "approved";
    await release.save();

    // Optional: create notification
    await Notification.create({
      message: `Release of ${release.qtyReleased} x ${release.item.name} approved.`,
      type: "success",
      itemId: release.item._id,
    });

    res.status(200).json({ message: "Release approved successfully", release });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error approving release" });
  }
};

// Cancel release
export const cancelRelease = async (req, res) => {
  try {
    const release = await ReleaseLog.findById(req.params.id)
      .populate("item releasedBy", "name email");

    if (!release) return res.status(404).json({ message: "Release not found" });

    release.approvalStatus = "cancelled";
    await release.save();

    // Optional: notify
    await Notification.create({
      message: `Release of ${release.qtyReleased} x ${release.item.name} was cancelled.`,
      type: "warning",
      itemId: release.item._id,
    });

    res.status(200).json({ message: "Release cancelled successfully", release });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error cancelling release" });
  }
};

// Make pending (optional)
export const makePending = async (req, res) => {
  try {
    const release = await ReleaseLog.findById(req.params.id);
    if (!release) return res.status(404).json({ message: "Release not found" });

    release.approvalStatus = "pending";
    await release.save();

    res.status(200).json({ message: "Release status set to pending", release });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller
export const updateReleaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    // ✅ Only Super Admin can perform this action
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied. Only Super Admin can perform this action." });
    }

    const validActions = ["approve", "cancel"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ message: "Invalid action type." });
    }

    const release = await ReleaseLog.findById(id);
    if (!release) return res.status(404).json({ message: "Release record not found." });

    // Update approval status
    release.approvalStatus = action === "approve" ? "approved" : "cancelled";
    await release.save();

    res.status(200).json({
      success: true,
      message: `Release ${action}d successfully.`,
      data: release,
    });
  } catch (error) {
    console.error("❌ Error updating release status:", error);
    res.status(500).json({
      message: "Server error while updating release status.",
      error: error.message,
    });
  }
};

