import mongoose from "mongoose";

const returnSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    returnedBy: { type: String, required: true },
    returnedByEmail: { type: String, trim: true },
    quantityReturned: { type: Number, required: true, min: 1 },
    dateReturned: { type: Date, default: Date.now },
    expectedReturnBy: { type: Date }, // link to release info
    condition: {
      type: String,
      enum: ["good", "damaged", "expired", "lost", "other"],
      default: "good",
    },
    remarks: { type: String, trim: true, default: "" },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["processed", "pending_review", "archived"],
      default: "processed",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Return", returnSchema);
