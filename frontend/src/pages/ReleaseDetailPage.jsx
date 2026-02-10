import React, { useEffect, useState } from "react";
import { useParams, useNavigate, data } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const ReleaseDetailPage = () => {
  const { id } = useParams(); // Item ID from route
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    releaseQuantity: "",
    releasedTo: "",
    reason: "",
    isReturnable: false,
    expectedReturnBy: "",
  });

  // ✅ Fetch item details
  useEffect(() => {
    if (!token) {
      toast.error("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const fetchItemDetails = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/item/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(res.data.item)
        setItem(res.data.item);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load item details.");
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [id, token, navigate]);

  // ✅ Handle form input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ Handle release submission
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!item) {
    toast.error("Item details not loaded yet.");
    return;
  }

  try {
    const response = await axios.post(
      `http://localhost:5000/api/item/release/${item._id}`, // use item._id here
      {
        qtyReleased: Number(formData.releaseQuantity),
        releasedTo: formData.releasedTo,
        reason: formData.reason,
        isReturnable: formData.isReturnable,
        expectedReturnBy: formData.isReturnable
          ? formData.expectedReturnBy
          : null,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    toast.success(response.data.message || "Item released successfully!");

    // Reset form
    setFormData({
      releaseQuantity: "",
      releasedTo: "",
      reason: "",
      isReturnable: false,
      expectedReturnBy: "",
    });

    // Redirect
    navigate("/items");
  } catch (error) {
    console.error("❌ Release error:", error);
    if (error.response) {
      toast.error(error.response.data.message || "Unexpected server response.");
    } else {
      toast.error("Network error. Please check your connection.");
    }
  }
};


  // ✅ Status color utility
  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "approved":
        return "text-green-600 font-semibold";
      case "pending":
        return "text-yellow-500 font-semibold";
      case "cancelled":
        return "text-red-600 font-semibold";
      default:
        return "text-gray-500 font-semibold";
    }
  };

  // ✅ Loading State
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        <h2 className="text-xl font-semibold mb-4">Loading item details...</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 rounded w-1/3 mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  // ✅ Not Found State
  if (!item) {
    return (
      <div className="p-6 text-center text-red-600">
        <h2 className="text-xl font-semibold">Item not found.</h2>
      </div>
    );
  }

  // ✅ Main Render
  return (
    <div className="p-6 flex flex-col gap-8 max-w-4xl mx-auto">
      {/* ITEM DETAILS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white shadow rounded-lg p-6 border"
      >
        <h2 className="text-2xl font-bold mb-4">Item Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
          <div>
            <p><span className="font-semibold">Name:</span> {item.name}</p>
            <p><span className="font-semibold">Category:</span> {item.category}</p>
            <p><span className="font-semibold">Unit:</span> {item.measuringUnit}</p>
            <p><span className="font-semibold">Quantity Available:</span> {item.quantity}</p>
          </div>
          <div>
            <p><span className="font-semibold">Refundable:</span> {item.isRefundable ? "Yes" : "No"}</p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              <span className={getStatusColor(item.currentStatus)}>
                {item.currentStatus || "Pending"}
              </span>
            </p>
            <p><span className="font-semibold">Date Added:</span> {new Date(item.createdAt).toLocaleDateString()}</p>
            <p><span className="font-semibold">Last Updated:</span> {new Date(item.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </motion.div>

      {/* RELEASE FORM */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white shadow rounded-lg p-6 border"
      >
        <h2 className="text-2xl font-bold mb-4">Release Form</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Release Quantity:</label>
            <input
              type="number"
              name="releaseQuantity"
              min="1"
              max={item.quantity}
              value={formData.releaseQuantity}
              onChange={handleChange}
              placeholder="Enter quantity to release"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Released To */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Released To:</label>
            <input
              type="text"
              name="releasedTo"
              value={formData.releasedTo}
              onChange={handleChange}
              placeholder="Enter recipient name or department"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Reason for Release:</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Enter reason for release"
              rows={4}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
          </div>

          {/* Is Returnable */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isReturnable"
              name="isReturnable"
              checked={formData.isReturnable}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <label htmlFor="isReturnable" className="text-gray-700 font-medium">
              Is this item returnable?
            </label>
          </div>

          {/* Expected Return Date */}
          {formData.isReturnable && (
            <div>
              <label className="block text-gray-700 font-medium mb-1">Expected Return By:</label>
              <input
                type="date"
                name="expectedReturnBy"
                value={formData.expectedReturnBy}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
            >
              Submit Release
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ReleaseDetailPage;
