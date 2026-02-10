import cron from "node-cron";
import Item from "../models/Item.js";
import ReleaseLog from "../models/ReleaseLog.js";
import sendEmail from "../utils/sendEmail.js";
import Notification from "../models/Notification.js";

// run daily at 01:00
export function initScheduledJobs() {
  // Low stock checker — runs daily
  cron.schedule("0 1 * * *", async () => {
    try {
      const thresholds = [20, 10, 5]; // you can make dynamic by item or config
      const lowItems = await Item.find({ quantity: { $lt: Math.max(...thresholds) }});
      for (const item of lowItems) {
        const thresholdHit = thresholds.find(t => item.quantity <= t);
        if (!thresholdHit) continue;

        const message = `Low stock alert: ${item.name} is at ${item.quantity} ${item.measuringUnit}(s). Threshold: ${thresholdHit}`;
        await Notification.create({ message, itemId: item._id, type: "low_stock" });

        // Notify admins via email
        // get ADMIN email list (this is illustrative — implement query to get admin users)
        // Example: sendEmail(adminEmail, `Low stock: ${item.name}`, `<p>${message}</p>`);
      }
    } catch (err) {
      console.error("Low stock job error", err.message);
    }
  });

  // Overdue returns checker — run daily
  cron.schedule("0 2 * * *", async () => {
    try {
      // Find releases that are returnable and expectedReturnBy < now and no return recorded for that release
      const overdueReleases = await ReleaseLog.find({
        isReturnable: true,
        expectedReturnBy: { $lte: new Date() }
      }).populate('item');

      for (const release of overdueReleases) {
        // check if item has returns that reference this release? (if not tracked, you can compare dates)
        // For simplicity create a notification per release
        const message = `Overdue return: ${release.qtyReleased} x ${release.item.name} released to ${release.releasedTo} on ${release.dateReleased.toDateString()} is overdue for return.`;
        await Notification.create({ message, itemId: release.item._id, type: "return_overdue", meta: { releaseId: release._id }});

        // Optionally email the releasedTo if you have email stored in release details
      }
    } catch (err) {
      console.error("Overdue returns job error", err.message);
    }
  });
}
