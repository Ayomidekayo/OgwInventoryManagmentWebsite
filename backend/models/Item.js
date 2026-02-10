import mongoose from "mongoose";
import { MEASURING_UNITS } from "../constants/measuringUntits.js";


const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },

    measuringUnit: {
      type: String,
      enum: MEASURING_UNITS,
      required: true,
      default: "piece",
    },

    quantity: { type: Number, required: true, min: 0 },

    description: { type: String, trim: true, default: "" },

    // Is this item refundable / returnable (true = needs to be tracked for returns)
    isRefundable: { type: Boolean, default: false },

    // If item is currently in/out or partially out
    currentStatus: {
      type: String,
      enum: ["in", "out","deleted"],
      default: "in",
    },

    // Link to return records
    returns: [{ type: mongoose.Schema.Types.ObjectId, ref: "Return" }],

    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Item", itemSchema);
