import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);
const [showModal, setShowModal] = useState(false);

const openReleaseModal = (item) => {
  setSelectedItem(item);
  setShowModal(true);
};

const handleReleaseSubmit = async (releaseData) => {
  try {
    await axios.post("http://localhost:5000/api/releases", releaseData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Release request submitted for approval");
    setShowModal(false);
  } catch (err) {
    toast.error("Failed to release item");
  }
};

  const { user } = useAuth();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      toast.error("Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [profileRes, itemsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/item/get", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setUserRole(profileRes.data.role);

        const itemsArray = Array.isArray(itemsRes.data)
          ? itemsRes.data
          : itemsRes.data.items || [];
        setItems(itemsArray);
      } catch (err) {
        console.error("Data fetch error:", err);
        toast.error("Failed to load items.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/item/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) => prev.filter((item) => item._id !== id));
      toast.success("Item deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item");
    }
  };

  const handleDetails = (id) => {
    const role = user?.role || userRole;
    navigate(
      role === "superadmin" || role === "admin"
        ? `/admin-dashboard/item/details/${id}`
        : `/user-dashboard/item/details/${id}`
    );
  };

  const handleRelease = (id) => {
    const role = user?.role || userRole;
    navigate(
      role === "superadmin" || role === "admin"
        ? `/admin-dashboard/releases/${id}`
        : `/user-dashboard/releases/${id}`
    );
  };

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

  // shimmer class for loading skeleton
  const shimmerClass =
    "bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-shimmer";

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold mb-4">Items Inventory</h1>
        <p className="text-gray-600 font-medium mt-2">Loading items...</p>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Items Inventory</h1>
        <Link
          to={
            userRole === "user"
              ? "/user-dashboard/item-add"
              : "/admin-dashboard/add-item"
          }
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          + Add Item
        </Link>
      </div>

      {/* Desktop Table */}
      <div className="overflow-x-auto hidden md:block">
        <table className="min-w-full bg-white border shadow rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Category</th>
              <th className="px-4 py-2 border">Unit</th>
              <th className="px-4 py-2 border">Quantity</th>
              <th className="px-4 py-2 border">Refundable</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item) => (
                <motion.tr
                  key={item._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <td className="px-4 py-2 border">{item.name}</td>
                  <td className="px-4 py-2 border">{item.category}</td>
                  <td className="px-4 py-2 border">{item.measuringUnit}</td>
                  <td className="px-4 py-2 border">{item.quantity}</td>
                  <td className="px-4 py-2 border">
                    {item.isRefundable ? "Yes" : "No"}
                  </td>
                  <td className={`px-4 py-2 border ${getStatusColor(item.currentStatus)}`}>
                    {item.currentStatus || "Pending"}
                  </td>
                  <td className="px-4 py-2 border flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => handleRelease(item._id)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                    >
                      Release
                    </button>
                    <button
                      onClick={() => handleDetails(item._id)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                    >
                      View
                    </button>
                    {userRole === "superadmin" && (
                      <>
                        <Link
                          to={`/items/edit/${item._id}`}
                          className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 transition"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col gap-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item._id}
              className="bg-white shadow rounded p-4 flex flex-col gap-2"
            >
              <div className="flex justify-between">
                <span className="font-semibold">Name:</span>
                <span>{item.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Category:</span>
                <span>{item.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Unit:</span>
                <span>{item.measuringUnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Quantity:</span>
                <span>{item.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Refundable:</span>
                <span>{item.isRefundable ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Status:</span>
                <span className={getStatusColor(item.currentStatus)}>
                  {item.currentStatus || "Pending"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                <button
  onClick={() => openReleaseModal(item)}
  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
>
  Release
</button>
                <button
                  onClick={() => handleDetails(item._id)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                >
                  View
                </button>
                {userRole === "superadmin" && (
                  <>
                    <Link
                      to={`/items/edit/${item._id}`}
                      className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-4">No items found</p>
        )}
      </div>
      {showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
    <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Release Item</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleReleaseSubmit({
            item: selectedItem._id,
            qtyReleased: e.target.qtyReleased.value,
            releasedTo: e.target.releasedTo.value,
            isReturnable: e.target.isReturnable.checked,
            expectedReturnBy: e.target.expectedReturnBy.value,
          });
        }}
      >
        <label className="block mb-2">
          Quantity:
          <input
            type="number"
            name="qtyReleased"
            min="1"
            max={selectedItem.quantity}
            className="border p-2 w-full rounded"
            required
          />
        </label>

        <label className="block mb-2">
          Released To:
          <input
            type="text"
            name="releasedTo"
            className="border p-2 w-full rounded"
            required
          />
        </label>

        <label className="block mb-2 flex items-center gap-2">
          <input type="checkbox" name="isReturnable" />
          Returnable?
        </label>

        <label className="block mb-4">
          Expected Return Date:
          <input type="date" name="expectedReturnBy" className="border p-2 w-full rounded" />
        </label>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Confirm Release
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
};

export default ItemsPage;
