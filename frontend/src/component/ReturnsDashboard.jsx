import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import DueReturnsWidget from "./DueReturnsWidget";
import AddReturnForm from "./AddReturnForm";
import ReturnDetailsModal from "./ReturnDetailsModal";

const ReturnsDashboard = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showAddReturn, setShowAddReturn] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("dateReturned");
  const [sortOrder, setSortOrder] = useState("desc");

  const token = localStorage.getItem("token");

  // Fetch all returns
  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/returns", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReturns(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load return records.");
      } finally {
        setLoading(false);
      }
    };
    fetchReturns();
  }, [token]);

  // Filter & sort
  const filteredReturns = returns
    .filter(
      (r) =>
        r.item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.returnedBy?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortField === "quantityReturned") {
        return sortOrder === "asc"
          ? a.quantityReturned - b.quantityReturned
          : b.quantityReturned - a.quantityReturned;
      } else if (sortField === "condition") {
        return sortOrder === "asc"
          ? a.condition.localeCompare(b.condition)
          : b.condition.localeCompare(a.condition);
      } else {
        // dateReturned
        return sortOrder === "asc"
          ? new Date(a.dateReturned) - new Date(b.dateReturned)
          : new Date(b.dateReturned) - new Date(a.dateReturned);
      }
    });

  const isOverdue = (r) =>
    r.expectedReturnBy && new Date(r.expectedReturnBy) < new Date();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Widgets */}
      <div className="flex flex-col md:flex-row gap-6">
        <DueReturnsWidget />
        <motion.button
          onClick={() => setShowAddReturn(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded shadow self-start"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Add New Return
        </motion.button>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Search by item or returned by"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex gap-2 items-center">
          <label>Sort by:</label>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="border rounded px-2 py-1 focus:outline-none"
          >
            <option value="dateReturned">Date Returned</option>
            <option value="quantityReturned">Quantity</option>
            <option value="condition">Condition</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border rounded px-2 py-1 focus:outline-none"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Return List Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-left">Returned By</th>
              <th className="px-4 py-2 text-left">Quantity</th>
              <th className="px-4 py-2 text-left">Condition</th>
              <th className="px-4 py-2 text-left">Returned On</th>
              <th className="px-4 py-2 text-left">Expected Return</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : filteredReturns.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  No returns found.
                </td>
              </tr>
            ) : (
              filteredReturns.map((r) => (
                <tr
                  key={r._id}
                  className={`cursor-pointer hover:bg-gray-50 ${
                    isOverdue(r) ? "bg-red-50 border-l-4 border-red-500" : ""
                  }`}
                  onClick={() => setSelectedReturn(r)}
                >
                  <td className="px-4 py-2">{r.item?.name || "Unknown"}</td>
                  <td className="px-4 py-2">{r.returnedBy}</td>
                  <td className="px-4 py-2">{r.quantityReturned}</td>
                  <td className="px-4 py-2 capitalize">{r.condition}</td>
                  <td className="px-4 py-2">
                    {new Date(r.dateReturned).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {r.expectedReturnBy
                      ? new Date(r.expectedReturnBy).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {selectedReturn && (
        <ReturnDetailsModal
          returnRecord={selectedReturn}
          onClose={() => setSelectedReturn(null)}
        />
      )}
      {showAddReturn && (
        <AddReturnForm onClose={() => setShowAddReturn(false)} />
      )}
    </div>
  );
};

export default ReturnsDashboard;
