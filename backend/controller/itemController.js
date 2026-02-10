import Item from "../models/Item.js";
import sendEmail from "../utils/sendEmail.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";
import ReleaseLog from "../models/ReleaseLog.js";
import ActionLog from "../models/ActionLog.js";
import { emailTemplates } from "../utils/emailTemplates.js";
import { checkLowStock } from "../utils/checkLowStock.js";
import Return from "../models/Return.js";

const LOW = process.env.LOW_STOCK_THRESHOLD || 20;

export const addItem = async (req, res) => {
  try {
    const { name, category, measuringUnit, quantity, description, isRefundable } = req.body;

    if (!name || !category || !measuringUnit || quantity === undefined) {
      return res.status(400).json({ message: "Name, category, measuring unit, and quantity are required." });
    }

    // Create the item
    const item = await Item.create({
      name,
      category,
      measuringUnit,
      quantity,
      description: description || "",
      isRefundable: isRefundable || false,
      addedBy: req.user._id,
      currentStatus: quantity > 0 ? "in" : "out",
    });

    // Fetch user info for notifications
    const user = await User.findById(req.user._id).select("name email");

    // Create "add-item" notification for the user who added it
    const notif = await Notification.create({
      toUser: req.user._id,
      createdBy: req.user._id,
      itemId: item._id,
      type: "add-item",
      message: `Item "${item.name}" (${item.category}) added by ${user.name}.`,
      meta: {
        userName: user.name,
        userEmail: user.email,
        itemName: item.name,
        itemCategory: item.category,
        itemType: item.measuringUnit,
        quantity: item.quantity,
        isRefundable: item.isRefundable,
      },
    });

    // Send email to admin (if ADMIN_EMAIL is defined)
    if (process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New item added: ${item.name}`,
        text: `A new item was added by ${user.name} (${user.email}):\n\nName: ${item.name}\nCategory: ${item.category}\nUnit: ${measuringUnit}\nQuantity: ${quantity}\nRefundable: ${isRefundable}`,
      });
    }

    // LOW STOCK: notify all admins
    if (item.quantity < LOW) {
      const admins = await User.find({ role: { $in: ["admin", "superadmin"] } }).select("_id name email");

      const lowStockNotifications = admins.map(admin => ({
        toUser: admin._id,
        createdBy: req.user._id,
        itemId: item._id,
        type: "low_stock",
        message: `Warning: Item "${item.name}" quantity is low (${item.quantity}).`,
        meta: {
          userName: user.name,
          userEmail: user.email,
          itemName: item.name,
          itemCategory: item.category,
          itemType: item.measuringUnit,
          quantity: item.quantity,
        },
      }));

      await Notification.insertMany(lowStockNotifications);

      // Send email to all admins
      for (const admin of admins) {
        if (admin.email) {
          await sendEmail({
            to: admin.email,
            subject: `Low stock warning: ${item.name}`,
            text: `Item "${item.name}" has low stock: ${item.quantity} units remaining.`,
          });
        }
      }
    }

    res.status(201).json({
      message: "Item added successfully",
      item,
      notification: notif,
    });

  } catch (error) {
    console.error("Error adding item:", error);
    res.status(500).json({ message: "Error adding item", error: error.message });
  }
};

export const getAllItems = async (req, res) => {
  try {
    // Fetch all items, exclude description, populate addedBy with name and email
    const items = await Item.find({})
      .select("-description") // exclude the description field
      .populate("addedBy", "name") // include name & email of the user who added it
      .sort({ createdAt: -1 });

    // Handle no items found
    if (!items || items.length === 0) {
      return res.status(200).json({
        message: "No items found in the inventory.",
        count: 0,
        items: [],
      });
    }

    // Success response
    res.status(200).json({
      message: "Items retrieved successfully.",
      count: items.length,
      items,
    });
  } catch (error) {
    console.error("❌ Error fetching items:", error);
    res.status(500).json({
      message: "An error occurred while retrieving items.",
      error: error.message,
    });
  }
};

export const updateItem = async (req, res) => {
  try {
    const role = req.user.role;

    //  Check user role authorization
    if (role !== "superadmin") {
      return res.status(403).json({ message: "Unauthorized: Superadmin access only" });
    }

    const { id } = req.params;
    const { name, category, measuringUnit, quantity, description, isRefundable } = req.body;

    // Validate required fields
    if (!name || !category || !measuringUnit || quantity === undefined) {
      return res.status(400).json({
        message: "Name, category, measuring unit, and quantity are required.",
      });
    }

    //  Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    //  Find item
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const oldQuantity = item.quantity;

    //  Update item fields
    item.name = name;
    item.category = category;
    item.measuringUnit = measuringUnit;
    item.quantity = quantity;
    item.description = description;
    item.isRefundable = isRefundable;

    await item.save();

    // Fetch user info for notification
    const user = await User.findById(req.user._id).select("name email");

    // Create "update-item" notification for the user
    const notif = await Notification.create({
      toUser: req.user._id,
      itemId: item._id,
      type: "update-item",
      message: `Item "${item.name}" (${item.category}) updated by ${user.name}.`,
      meta: {
        userName: user.name,
        userEmail: user.email,
        itemName: item.name,
        itemCategory: item.category,
        measuringUnit: item.measuringUnit,
        quantity: item.quantity,
        isRefundable: item.isRefundable,
        oldQuantity,
      },
    });

    //  Send notification email to admin
    if (process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `Item Updated: ${item.name}`,
        text: `Item "${item.name}" was updated by ${user.name} (${user.email}).\n\n` +
              `Category: ${item.category}\n` +
              `Unit: ${item.measuringUnit}\n` +
              `Old Quantity: ${oldQuantity}\n` +
              `New Quantity: ${quantity}\n` +
              `Refundable: ${isRefundable ? "Yes" : "No"}`,
      });
    }

    //  Low stock notification to all admins
    if (item.quantity < LOW) {
      const admins = await User.find({
        role: { $in: ["admin", "superadmin"] },
      }).select("_id name email");

      // Prepare notifications
      const lowStockNotifications = admins.map((admin) => ({
        toUser: admin._id,
        itemId: item._id,
        type: "low_stock",
        message: `⚠️ Low Stock: "${item.name}" has only ${item.quantity} remaining.`,
        meta: {
          adminName: admin.name,
          triggeredBy: user.name,
          itemName: item.name,
          quantity: item.quantity,
        },
      }));

      await Notification.insertMany(lowStockNotifications);

      // Send low stock emails
      for (const admin of admins) {
        if (admin.email) {
          await sendEmail({
            to: admin.email,
            subject: `Low Stock Warning: ${item.name}`,
            text: `Item "${item.name}" has low stock (${item.quantity} units remaining).\n` +
                  `Updated by: ${user.name} (${user.email})`,
          });
        }
      }
    }

    //  Send success response
    res.status(200).json({
      message: "Item updated successfully",
      item,
      notification: notif,
    });

  } catch (error) {
    console.error(" Error updating item:", error);
    res.status(500).json({ message: "Error updating item", error: error.message });
  }
};

// RELEASE item by all users


export const releaseItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { qtyReleased, releasedTo, reason, isReturnable, expectedReturnBy } = req.body;
    const releasedBy = req.user._id;

    // Validate item ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    // Validate required fields
    if (!qtyReleased || qtyReleased <= 0 || !releasedTo || !reason) {
      return res.status(400).json({ message: "Quantity, recipient, and reason are required." });
    }

    // Fetch item
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    // Check stock availability
    if (item.quantity < qtyReleased) {
      return res.status(400).json({
        message: `Insufficient quantity. Only ${item.quantity} unit(s) available.`,
      });
    }

    // Deduct quantity and update status
    item.quantity -= qtyReleased;
    if (item.quantity === 0) item.currentStatus = "out";
    await item.save();

    // Create release log
    const release = await ReleaseLog.create({
      item: item._id,
      qtyReleased,
      releasedTo,
      releasedBy,
      reason,
      isReturnable: !!isReturnable,
      expectedReturnBy: isReturnable ? expectedReturnBy || null : null,
    });

    // Fetch releasing user
    const user = await User.findById(releasedBy).select("name email role");

    // Create notification
    const notif = await Notification.create({
      toUser: releasedBy,
      itemId: item._id,
      type: "release-item",
      message: `${qtyReleased} ${item.measuringUnit}(s) of "${item.name}" released to ${releasedTo} by ${user.name}. Reason: ${reason}`,
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
        isReturnable: !!isReturnable,
        reason,
        expectedReturnBy,
      },
    });

    // Log action
    await ActionLog.create({
      user: releasedBy,
      action: "release_item",
      details: {
        itemId: item._id,
        releaseId: release._id,
        qtyReleased,
        releasedTo,
        reason,
        isReturnable: !!isReturnable,
        expectedReturnBy: expectedReturnBy || null,
      },
    });

    // Send Email Notification
    const superAdmin = await User.findOne({ role: "superadmin" });
    const emailRecipients = [process.env.ADMIN_EMAIL, superAdmin?.email, user.email].filter(Boolean);

    for (const recipient of emailRecipients) {
      await sendEmail({
        to: recipient,
        subject: `Item Released: ${item.name}`,
        html: emailTemplates.itemReleased({
          item: item.name,
          releasedTo,
          quantity: qtyReleased,
          releasedBy: user.name,
          reason,
          isReturnable: !!isReturnable,
          expectedReturnBy,
        }),
      });
    }

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
 * @desc    Process the return of a previously released item
 * @route   POST /api/items/:id/return
 * @access  Authenticated Users
 */

export const returnItem = async (req, res) => {
  try {
    const { id } = req.params; // Item ID
    const {
      releaseId,
      returnedBy,
      returnedByEmail,
      quantityReturned,
      condition,
      remarks,
    } = req.body;

    const processedBy = req.user?._id;
    const processorName = req.user?.name || "System";

    // ===== Validate Item ID =====
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // ===== Check if refundable/returnable =====
    if (!item.isRefundable) {
      return res
        .status(400)
        .json({ message: "This item is not marked as returnable/refundable." });
    }

    // ===== Validate Release Record =====
    if (!releaseId || !mongoose.Types.ObjectId.isValid(releaseId)) {
      return res
        .status(400)
        .json({ message: "A valid releaseId is required to process a return." });
    }

    const release = await ReleaseLog.findById(releaseId);
    if (!release) {
      return res.status(404).json({ message: "Release record not found." });
    }

    if (!release.isReturnable) {
      return res
        .status(400)
        .json({ message: "This released item was not marked as returnable." });
    }

    // ===== Quantity Checks =====
    if (!quantityReturned || quantityReturned <= 0) {
      return res
        .status(400)
        .json({ message: "Returned quantity must be greater than zero." });
    }

    if (quantityReturned > release.qtyReleased) {
      return res.status(400).json({
        message: `Returned quantity (${quantityReturned}) exceeds released quantity (${release.qtyReleased}).`,
      });
    }

    // ===== Create Return Record =====
    const returnRecord = await Return.create({
      item: item._id,
      returnedBy,
      returnedByEmail,
      quantityReturned,
      condition,
      remarks,
      processedBy,
    });

    // ===== Update Item Inventory =====
    item.returns = item.returns || [];
    item.returns.push(returnRecord._id);
    item.quantity = (item.quantity || 0) + Number(quantityReturned);
    if (item.quantity > 0) {
      item.currentStatus = "in";
    }
    await item.save();

    // ===== Run Low-Stock / Restock Alerts =====
    await checkLowStock(item, req.user);

    // ===== Record Notification =====
    await Notification.create({
      message: `${quantityReturned} × ${item.name} returned by ${returnedBy}.`,
      itemId: item._id,
      type: "return_confirmation",
      createdBy: processedBy,
      meta: {
        returnId: returnRecord._id,
        releaseId: release._id,
      },
    });

    // ===== Log the Action =====
    await ActionLog.create({
      user: processedBy,
      action: "return_item",
      details: {
        itemId: item._id,
        releaseId: release._id,
        returnId: returnRecord._id,
        quantityReturned,
        condition,
      },
    });

    // ===== Email Notifications =====
    const subject = `Item Returned – ${item.name}`;
    const emailHtml = emailTemplates.itemReturned({
      item: item.name,
      returnedBy,
      quantity: quantityReturned,
      condition,
      remarks,
      processedBy: processorName,
      category: item.category,
    });

    // Build a recipients list
    const emailRecipients = [];

    // Include returning person if email provided
    if (returnedByEmail) {
      emailRecipients.push(returnedByEmail);
    }

    // Include all superadmins
    const superAdmins = await User.find({ role: "superadmin" }).select("email name");
    for (const admin of superAdmins) {
      if (admin.email) {
        emailRecipients.push(admin.email);
      }
    }

    // Deduplicate email addresses
    const uniqueRecipients = [ ...new Set(emailRecipients) ];

    if (uniqueRecipients.length === 0) {
      console.warn(`returnItem: no email recipients for return of item ${item._id}`);
    } else {
      for (const recipientAddress of uniqueRecipients) {
        try {
          await sendEmail({
            to: recipientAddress,
            subject,
            html: emailHtml,
            // optionally you can include a `text` fallback, e.g.:
            // text: `Item ${item.name} was returned by ${returnedBy}, quantity: ${quantityReturned}`
          });
        } catch (sendErr) {
          console.error(`Error sending return email to ${recipientAddress}:`, sendErr);
        }
      }
    }

    // ===== Send Response =====
    return res.status(201).json({
      message: "Item return processed successfully.",
      data: {
        returnRecord,
        updatedItem: item,
      },
    });

  } catch (error) {
    console.error("❌ Error in returnItem:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


/**
 * @desc Get a single item by ID (with details)
 * @route GET /api/items/:id
 * @access Authenticated users
 */
export const getSingleItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid item ID." });
    }

    // Fetch item and populate relationships
    const item = await Item.findById(id)
      .populate("addedBy", "name email role -_id")
      .populate("deletedBy", "name email role -_id")
      .populate({
        path: "returns",
        select:
          "quantityReturned condition dateReturned remarks returnedBy returnedByEmail processedBy -_id",
      })
      .lean();

    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    // Fetch releases for this item
    const releases = await ReleaseLog.find({ item: id })
      .select(
        "qtyReleased qtyReturned releasedTo releasedBy isReturnable expectedReturnBy returnStatus createdAt -_id"
      )
      .populate("releasedBy", "name email role -_id")
      .sort({ createdAt: -1 })
      .lean();

    // Sort returns by dateReturned descending
    const returns = (item.returns || []).sort(
      (a, b) => new Date(b.dateReturned) - new Date(a.dateReturned)
    );

    return res.status(200).json({
      message: "Item retrieved successfully.",
      item,
      releases,
      returns,
    });
  } catch (error) {
    console.error("❌ Error retrieving item:", error);
    return res.status(500).json({
      message: "Server error while fetching item.",
      error: error.message,
    });
  }
};


/**
 * @desc Soft delete an item (mark as deleted but keep record)
 * @route DELETE /api/items/:id
 * @access Admin or Superadmin
 */
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid item ID." });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    // Prevent double deletion
    if (item.deletedBy) {
      return res
        .status(400)
        .json({ message: "Item has already been deleted previously." });
    }

    // Mark as soft deleted
    item.deletedBy = userId;
    item.currentStatus = "deleted"; // optional new state for clarity
    await item.save();

    res.status(200).json({
      message: `Item "${item.name}" was soft deleted successfully.`,
      deletedBy: userId,
      deletedAt: new Date(),
    });
  } catch (error) {
    console.error("❌ Error soft deleting item:", error);
    res.status(500).json({
      message: "Server error while deleting item.",
      error: error.message,
    });
  }
};


/**
 * @desc Restore a soft-deleted item
 * @route PATCH /api/items/:id/restore
 * @access Admin or Superadmin
 */
export const restoreItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid item ID." });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    if (!item.deletedBy) {
      return res.status(400).json({ message: "Item is not deleted." });
    }

    // Restore
    item.deletedBy = null;
    item.currentStatus = item.quantity > 0 ? "in" : "out";
    await item.save();

    res.status(200).json({
      message: `Item "${item.name}" restored successfully.`,
    });
  } catch (error) {
    console.error("❌ Error restoring item:", error);
    res.status(500).json({
      message: "Server error while restoring item.",
      error: error.message,
    });
  }
};
  
