import mongoose from "mongoose";

const releaseSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    qtyReleased: { type: Number, required: true },
    qtyReturned: { type: Number, default: 0 },
    releasedTo: { type: String, required: true },
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateReleased: { type: Date, default: Date.now },
    isReturnable: { type: Boolean, default: false },
    expectedReturnBy: { type: Date, default: null },

    // ✅ Reason for release
    reason: { type: String, trim: true },

    // ✅ Approval-specific field
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "cancelled"],
      default: "pending",
    },

    // ✅ Return tracking
    returnStatus: {
      type: String,
      enum: ["pending", "partially returned", "fully returned"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ReleaseLog", releaseSchema);
