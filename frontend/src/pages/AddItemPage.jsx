import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const MEASURING_UNITS = [
  "piece", "pack", "bundle", "carton", "crate", "roll", "litre",
  "kilogram", "gram", "meter", "box", "container", "bag", "set",
  "pair", "sheet", "tube", "unit", "pallet"
];

const AddItemPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    category: "",
    measuringUnit: "piece",
    quantity: "",
    description: "",
    isRefundable: false
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        toast.error("Session expired. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserRole(res.data.role);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.category || !form.quantity) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/item/add", form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Item added successfully!");

      // Navigate based on role
      if (userRole === "user") {
        navigate("/user-dashboard/items");
      } else if (userRole === "admin" || userRole === "superadmin") {
        navigate("/admin-dashboard/items");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add item.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-xl mx-auto p-6 bg-white shadow rounded mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold mb-4">Add New Item</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            type="text"
            placeholder="Item Name"
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Category</label>
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            type="text"
            placeholder="Category"
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Measuring Unit</label>
          <select
            name="measuringUnit"
            value={form.measuringUnit}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            {MEASURING_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Quantity</label>
          <input
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            type="number"
            min="0"
            placeholder="Quantity"
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Optional description"
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isRefundable"
            checked={form.isRefundable}
            onChange={handleChange}
            id="isRefundable"
          />
          <label htmlFor="isRefundable" className="font-medium">
            Is Refundable
          </label>
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition w-full"
        >
          Add Item
        </button>
      </form>
    </motion.div>
  );
};

export default AddItemPage;
