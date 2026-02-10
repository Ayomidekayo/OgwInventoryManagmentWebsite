import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import api from "../api/apiClient";
import { motion } from "framer-motion";

const ItemEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    measuringUnit: "piece",
    quantity: 0,
    description: "",
    isRefundable: false,
  });
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.role !== "superadmin") {
      navigate("/unauthorized");
      return;
    }

    const fetchItem = async () => {
      try {
        const res = await api.get(`/item/${id}`);
        setFormData(res.data.item);
        setOriginalData(res.data.item);
      } catch (err) {
        toast.error("Error loading item details.",err);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, navigate, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const hasChanges = () => {
    return Object.keys(formData).some(
      (key) => formData[key] !== originalData[key]
    );
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!hasChanges()) {
    toast.info("No changes performed.");
    return;
  }

  try {
    setUpdating(true);
    await api.put(`/item/${id}`, formData);
    toast.success("Item updated successfully!");

    // Redirect to the correct detail page
    if (user?.role === "superadmin" || user?.role === "admin") {
      navigate(`/admin-dashboard/item/details/${id}`);
    } else {
      navigate(`/user-dashboard/item/details/${id}`);
    }

  } catch (err) {
    toast.error(err.response?.data?.message || "Error updating item.");
  } finally {
    setUpdating(false);
  }
};

const handleCancel = () => {
  if (user?.role === "superadmin" || user?.role === "admin") {
    navigate(`/admin-dashboard/item/details/${id}`);
  } else {
    navigate(`/user-dashboard/item/details/${id}`);
  }
};


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          className="text-lg font-semibold text-gray-600"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          Loading item details...
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-lg mx-auto bg-white shadow-lg p-6 rounded-lg mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-semibold mb-4">Edit Item</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="name"
          placeholder="Item Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="border rounded p-2 w-full"
        />

        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          required
          className="border rounded p-2 w-full"
        />

        <select
          name="measuringUnit"
          value={formData.measuringUnit}
          onChange={handleChange}
          className="border rounded p-2 w-full"
        >
          <option value="piece">Piece</option>
          <option value="kg">Kilogram</option>
          <option value="litre">Litre</option>
          <option value="pack">Pack</option>
        </select>

        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={handleChange}
          min="0"
          required
          className="border rounded p-2 w-full"
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="border rounded p-2 w-full"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isRefundable"
            checked={formData.isRefundable}
            onChange={handleChange}
          />
          Refundable Item
        </label>

        <div className="flex gap-2 mt-4">
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            className={`bg-blue-500 text-white w-full py-2 rounded hover:bg-blue-600 transition ${
              updating ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={updating}
          >
            {updating ? "Updating..." : "Update Item"}
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleCancel}
            className="bg-gray-400 text-white w-full py-2 rounded hover:bg-gray-500 transition"
          >
            Cancel
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default ItemEditPage;
