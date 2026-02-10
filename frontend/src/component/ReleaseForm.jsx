import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";

const ReleaseForm = ({ onReleaseAdded }) => {
  const [formData, setFormData] = useState({
    item: "",
    qtyReleased: "",
    releasedTo: "",
    isReturnable: false,
    expectedReturnBy: "",
  });

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch available items for dropdown
 useEffect(() => {
  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/item/get", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Check the structure of the backend response
      if (res.data && Array.isArray(res.data.items)) {
        setItems(res.data.items); // ✅ correct field
      } else {
        console.error("Unexpected response:", res.data);
        toast.error("Unexpected response from server.");
      }
    } catch (error) {
      console.error("❌ Error fetching items:", error);
      toast.error("Failed to load items.");
    }
  };

  fetchItems();
}, []);


  // ✅ Automatically select first item if available
  useEffect(() => {
    if (items.length > 0 && !formData.item) {
      setFormData((prev) => ({ ...prev, item: items[0]._id }));
    }
  }, [items]);

  // ✅ Handle form input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ✅ Submit form
 const handleSubmit = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem("token");

  if (!formData.item || !formData.qtyReleased || !formData.releasedTo) {
    toast.error("Please fill in all required fields.");
    return;
  }

  try {
    setLoading(true);

    // ✅ Match backend structure
    const payload = {
      itemId: formData.item, // backend expects itemId
      qtyReleased: formData.qtyReleased,
      releasedTo: formData.releasedTo,
      expectedReturnBy: formData.expectedReturnBy || null,
    };

    await axios.post("http://localhost:5000/api/release", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.success("Item released successfully!");

    // ✅ Reset form after submission
    setFormData({
      item: items.length > 0 ? items[0]._id : "",
      qtyReleased: "",
      releasedTo: "",
      isReturnable: false,
      expectedReturnBy: "",
    });

    onReleaseAdded(); // refresh release list
  } catch (error) {
    console.error("❌ Error releasing item:", error);
    toast.error(error.response?.data?.message || "Failed to release item.");
  } finally {
    setLoading(false);
  }
};


  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Release New Item
      </h2>

      {/* ✅ Item dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Item
        </label>
       <select name="item" value={formData.item} onChange={handleChange} required className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Select Item</option>
            {items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
      </div>

      {/* ✅ Quantity */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quantity Released
        </label>
        <input
          type="number"
          name="qtyReleased"
          value={formData.qtyReleased}
          onChange={handleChange}
          min="1"
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
      </div>

      {/* ✅ Released To */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Released To
        </label>
        <input
          type="text"
          name="releasedTo"
          value={formData.releasedTo}
          onChange={handleChange}
          placeholder="Enter recipient name"
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
      </div>

      {/* ✅ Is Returnable */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          name="isReturnable"
          checked={formData.isReturnable}
          onChange={handleChange}
          className="h-4 w-4"
        />
        <label className="text-sm text-gray-700">Returnable Item</label>
      </div>

      {/* ✅ Expected Return Date */}
      {formData.isReturnable && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Return By
          </label>
          <input
            type="date"
            name="expectedReturnBy"
            value={formData.expectedReturnBy}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Releasing..." : "Release Item"}
        </button>
      </div>
    </motion.form>
  );
};

export default ReleaseForm;
