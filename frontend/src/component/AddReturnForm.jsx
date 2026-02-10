import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { motion } from "framer-motion";

const AddReturnForm = ({ onClose }) => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    itemId: "",
    returnedBy: "",
    returnedByEmail: "",
    quantityReturned: "",
    condition: "good",
    remarks: "",
  });

  const token = localStorage.getItem("token");

  // Fetch items for dropdown
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/item", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load items.");
      }
    };
    fetchItems();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemId || !formData.returnedBy || !formData.quantityReturned) {
      toast.warn("Please fill all required fields.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/returns/add",
        {
          ...formData,
          quantityReturned: Number(formData.quantityReturned),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Return recorded successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to record return.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg"
      >
        <h2 className="text-xl font-bold mb-4">Add Return</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Selector */}
          <div>
            <label className="block font-medium mb-1">Item</label>
            <select
              name="itemId"
              value={formData.itemId}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="">Select an item</option>
              {items.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} (Available: {item.quantity})
                </option>
              ))}
            </select>
          </div>

          {/* Returned By */}
          <div>
            <label className="block font-medium mb-1">Returned By</label>
            <input
              type="text"
              name="returnedBy"
              value={formData.returnedBy}
              onChange={handleChange}
              placeholder="Name or department"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-medium mb-1">Email (optional)</label>
            <input
              type="email"
              name="returnedByEmail"
              value={formData.returnedByEmail}
              onChange={handleChange}
              placeholder="Email for notification"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block font-medium mb-1">Quantity Returned</label>
            <input
              type="number"
              name="quantityReturned"
              value={formData.quantityReturned}
              onChange={handleChange}
              min="1"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block font-medium mb-1">Condition</label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="good">Good</option>
              <option value="damaged">Damaged</option>
              <option value="expired">Expired</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-medium mb-1">Remarks (optional)</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Return
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddReturnForm;
