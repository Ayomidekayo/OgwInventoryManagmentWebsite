import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", default: null },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // actionable user
  date: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ["info","low_stock","return_overdue","return_confirmation","registration","add-item","update-item","release-item","delete-item","restock"], default: "info" },
  meta: { type: mongoose.Schema.Types.Mixed }, // extra data
});

export default mongoose.model("Notification", notificationSchema);
