import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../api/apiClient"; // Make sure this points to backend
import { motion } from "framer-motion";

const ReleaseApprovalButton = ({ releaseId, action, onUpdated }) => {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!releaseId || !action) return;

    setLoading(true);
    try {
      // Send PATCH to backend
      const res = await api.patch(`/release/${releaseId}/status`, { action });

      toast.success(res.data.message || `Release ${action}d successfully!`);

      // Trigger parent refresh if needed
      if (onUpdated) onUpdated(res.data.data);
    } catch (err) {
      console.error("Release action error:", err);
      toast.error(err.response?.data?.message || "Failed to update release status");
    } finally {
      setLoading(false);
    }
  };

  // Button text
  const buttonText = loading
    ? `${action.charAt(0).toUpperCase() + action.slice(1)}ing...`
    : action.charAt(0).toUpperCase() + action.slice(1);

  // Button color mapping
  const actionColors = {
    approve: "bg-green-500 hover:bg-green-600",
    cancel: "bg-red-500 hover:bg-red-600",
    pending: "bg-yellow-500 hover:bg-yellow-600",
  };

  return (
    <motion.button
      onClick={handleAction}
      whileTap={{ scale: 0.95 }}
      className={`text-white px-4 py-2 rounded transition ${actionColors[action]} ${
        loading ? "opacity-70 cursor-not-allowed" : ""
      }`}
      disabled={loading}
    >
      {buttonText}
    </motion.button>
  );
};

export default ReleaseApprovalButton;
