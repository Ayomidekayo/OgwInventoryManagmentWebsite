import Item from "../models/Item.js";
import Return from "../models/Return.js";
import Notification from "../models/Notification.js";
import ActionLog from "../models/ActionLog.js";
import sendEmail from "../utils/sendEmail.js";
import ReleaseLog from "../models/ReleaseLog.js";


/**
 * CREATE Return Record
 */
export const addReturn = async (req, res) => {
  try {
    const {
      itemId,
      returnedBy,
      returnedByEmail,
      quantityReturned,
      condition,
      remarks,
      processedBy,
      expectedReturnBy,
    } = req.body;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (!item.isRefundable)
      return res.status(400).json({ message: "This item is not refundable" });

    const returnRecord = await Return.create({
      item: itemId,
      returnedBy,
      returnedByEmail,
      quantityReturned,
      condition,
      remarks,
      processedBy,
      expectedReturnBy,
    });

    // Update item stock
    item.returns.push(returnRecord._id);
    item.quantity = (item.quantity || 0) + Number(quantityReturned);
    item.currentStatus = "in";
    await item.save();

    // Create Notification
    await Notification.create({
      message: `${quantityReturned} x ${item.name} returned by ${returnedBy}`,
      itemId: item._id,
      type: "return_recorded",
      meta: { returnId: returnRecord._id },
    });

    // Log Action
    await ActionLog.create({
      user: processedBy || null,
      action: "return_item",
      details: { itemId: item._id, returnId: returnRecord._id, quantityReturned },
    });

    // Email Notification
    if (returnedByEmail) {
      const subject = `Return Confirmation - ${item.name}`;
      const html = `
        <p>Hello ${returnedBy},</p>
        <p>Your return of <strong>${quantityReturned}</strong> ${item.measuringUnit}(s) of <strong>${item.name}</strong> has been successfully processed.</p>
        <p>Condition: ${condition}</p>
        <p>Remarks: ${remarks || "None"}</p>
        <p>Thank you for your compliance.</p>
      `;
      await sendEmail(returnedByEmail, subject, html);
    }

    res.status(201).json({ message: "Return recorded successfully", returnRecord });
  } catch (error) {
    console.error("Return creation failed:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * GET All Returns
 */

export const getAllReturns = async (req, res) => {
  try {
    let returns = await Return.find()
      .populate("item", "name category measuringUnit")
      .populate("processedBy", "name email role")
      .sort({ createdAt: -1 });

    // 🔄 Fill expectedReturnBy if missing from ReleaseLog
    returns = await Promise.all(
      returns.map(async (r) => {
        if (!r.expectedReturnBy) {
          const release = await ReleaseLog.findOne({ item: r.item._id, isReturnable: true }).sort({ dateReleased: -1 });
          if (release) {
            r.expectedReturnBy = release.expectedReturnBy;
          }
        }
        return r;
      })
    );

    res.status(200).json({ count: returns.length, returns });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch returns", error: error.message });
  }
};
// export const getAllReturns = async (req, res) => {
//   try {
//     // 1️⃣ Find all release logs that are returnable
//     const returnableReleases = await ReleaseLog.find({ isReturnable: true })
//       .populate("item", "name category measuringUnit")
//       .populate("releasedBy", "name email role");

//     // 2️⃣ Extract all returnable release IDs
//     const returnableReleaseIds = returnableReleases.map((r) => r._id);

//     // 3️⃣ Fetch returns that belong to returnable releases
//     const returns = await Return.find({ item: { $in: returnableReleases.map(r => r.item._id) } })
//       .populate("item", "name category measuringUnit")
//       .populate("processedBy", "name email role")
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       count: returns.length,
//       returns,
//       returnableReleases, // optional, in case you want release info too
//     });
//   } catch (error) {
//     console.error("Error fetching returns:", error);
//     res.status(500).json({ message: "Failed to fetch returns", error: error.message });
//   }
// };

//get items is return true
export const getReturnableItems = async (req, res) => {
  try {
    // Only items where isRefundable === true
    const items = await Item.find({ isRefundable: true })
      .populate("returns") // populate return records if needed
      .populate("addedBy", "name email role");

    res.status(200).json({ count: items.length, items });
  } catch (error) {
    console.error("Error fetching returnable items:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
/**
 * GET Single Return
 */
export const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    const returnRecord = await Return.findById(id)
      .populate("item", "name category measuringUnit")
      .populate("processedBy", "name email role");

    if (!returnRecord) return res.status(404).json({ message: "Return record not found" });

    res.status(200).json(returnRecord);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving return", error: error.message });
  }
};


export const getReturnableItemsWithReturns = async (req, res) => {
  try {
    const items = await Item.find({ isRefundable: true })
      .populate({
        path: "returns",
        populate: { path: "processedBy", select: "name email role" },
      })
      .populate("addedBy", "name email role");

    res.status(200).json({ count: items.length, items });
  } catch (error) {
    console.error("Error fetching returnable items with returns:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
/**
 * GET Overdue Returns
 */
export const getOverdueReturns = async (req, res) => {
  try {
    const today = new Date();
    const overdueReturns = await Return.find({
      expectedReturnBy: { $lt: today },
      status: { $ne: "archived" },
    }).populate("item", "name category measuringUnit");

    res.status(200).json({
      count: overdueReturns.length,
      overdueReturns,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching overdue returns", error: error.message });
  }
};

/**
 * UPDATE Return
 */
export const updateReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await Return.findByIdAndUpdate(id, updates, { new: true });

    if (!updated) return res.status(404).json({ message: "Return not found" });

    await ActionLog.create({
      user: req.user?._id || null,
      action: "update_return",
      details: { returnId: id, updates },
    });

    res.status(200).json({ message: "Return updated", updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating return", error: error.message });
  }
};

/**
 * DELETE Return (soft delete)
 */
export const deleteReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const returnRecord = await Return.findById(id);
    if (!returnRecord) return res.status(404).json({ message: "Return not found" });

    returnRecord.status = "archived";
    await returnRecord.save();

    await ActionLog.create({
      user: req.user?._id || null,
      action: "delete_return",
      details: { returnId: id },
    });

    res.status(200).json({ message: "Return archived successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error archiving return", error: error.message });
  }
};
