import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ReleaseApprovalButton from "./ReleaseApprovalButton";
import { motion } from "framer-motion";
import api from "../api/apiClient";

const ReleaseApprovalPanel = ({ user, onUpdate }) => {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all releases that are pending approval
  const fetchReleases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get("/release", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Show only releases that are pending approval
      const pending = (res.data.data || []).filter(
        (r) => r.approvalStatus === "pending"
      );
      setReleases(pending);
    } catch (err) {
      console.error("❌ Error fetching releases:", err);
      toast.error("Failed to fetch releases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const handleStatusChange = async () => {
    await fetchReleases(); // Refresh panel
    if (onUpdate) onUpdate(); // Also refresh My Releases tab
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-gray-600 font-semibold"
        >
          Loading releases...
        </motion.div>
      </div>
    );
  }

  if (!releases.length) {
    return (
      <p className="text-center text-gray-500 mt-4">
        No releases pending approval.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white shadow rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="p-3 text-left">Item</th>
            <th className="p-3 text-left">Qty</th>
            <th className="p-3 text-left">Released To</th>
            <th className="p-3 text-left">Released By</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {releases.map((rel) => (
            <motion.tr
              key={rel._id}
              className="border-b hover:bg-gray-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <td className="p-3">{rel.item?.name || "Unknown"}</td>
              <td className="p-3">{rel.qtyReleased}</td>
              <td className="p-3">{rel.releasedTo}</td>
              <td className="p-3">{rel.releasedBy?.name || "N/A"}</td>
              <td className="p-3">
                {rel.dateReleased
                  ? new Date(rel.dateReleased).toLocaleDateString()
                  : "N/A"}
              </td>
              <td className="p-3 font-semibold capitalize">
                {rel.approvalStatus}
              </td>
              <td className="p-3 flex gap-2 flex-wrap">
                {["approve", "cancel", "pending"].map((action) => (
                  <ReleaseApprovalButton
                    key={action}
                    releaseId={rel._id}
                    action={action}
                    onUpdated={handleStatusChange}
                  />
                ))}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReleaseApprovalPanel;
