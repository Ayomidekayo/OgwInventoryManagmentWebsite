import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { format } from "date-fns";

const ReturnManagementPage = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("date-desc");
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/items/returnable-with-returns",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setItems(res.data.items);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load returnable items with returns");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [token]);

  // Filter & flatten return records
  const filteredReturns = items
    .flatMap((item) =>
      item.returns.map((r) => ({ ...r, itemName: item.name, itemUnit: item.measuringUnit }))
    )
    .filter((r) => {
      if (!search.trim()) return true;
      return (
        r.itemName.toLowerCase().includes(search.toLowerCase()) ||
        r.returnedBy.toLowerCase().includes(search.toLowerCase()) ||
        r.condition.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "date-desc":
          return new Date(b.dateReturned) - new Date(a.dateReturned);
        case "date-asc":
          return new Date(a.dateReturned) - new Date(b.dateReturned);
        case "quantity-desc":
          return b.quantityReturned - a.quantityReturned;
        case "quantity-asc":
          return a.quantityReturned - b.quantityReturned;
        case "condition":
          return a.condition.localeCompare(b.condition);
        default:
          return 0;
      }
    });

  if (loading) return <p className="p-6">Loading returnable items...</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Returnable Items & Returns</h1>

      {/* Search & Sort */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-3">
        <input
          type="text"
          placeholder="Search by item, user, or condition..."
          className="border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 w-full md:w-1/2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="border px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="date-desc">Sort by Date (Newest)</option>
          <option value="date-asc">Sort by Date (Oldest)</option>
          <option value="quantity-desc">Quantity (High → Low)</option>
          <option value="quantity-asc">Quantity (Low → High)</option>
          <option value="condition">Condition (A–Z)</option>
        </select>
      </div>

      {/* Returns Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Returned By</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Condition</th>
              <th className="px-4 py-2">Date Returned</th>
              <th className="px-4 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No return records found.
                </td>
              </tr>
            ) : (
              filteredReturns.map((r) => {
                const isOverdue = r.expectedReturnBy && new Date(r.expectedReturnBy) < new Date();
                return (
                  <motion.tr
                    key={r._id}
                    whileHover={{ scale: 1.01 }}
                    className={`cursor-pointer border-b hover:bg-gray-50 ${
                      isOverdue ? "bg-red-50" : ""
                    }`}
                    onClick={() => setSelectedReturn(r)}
                  >
                    <td className="px-4 py-2">{r.itemName}</td>
                    <td className="px-4 py-2">{r.returnedBy}</td>
                    <td className="px-4 py-2">
                      {r.quantityReturned} {r.itemUnit}
                    </td>
                    <td className="px-4 py-2 capitalize">{r.condition}</td>
                    <td className="px-4 py-2">
                      {format(new Date(r.dateReturned), "MMM d, yyyy")}
                    </td>
                    <td
                      className={`px-4 py-2 text-center font-semibold ${
                        isOverdue ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isOverdue ? "Overdue" : "Returned"}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedReturn && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 relative"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedReturn(null)}
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">
              Return Details – {selectedReturn.itemName}
            </h2>

            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Returned By:</strong> {selectedReturn.returnedBy}
              </p>
              <p>
                <strong>Email:</strong> {selectedReturn.returnedByEmail || "N/A"}
              </p>
              <p>
                <strong>Quantity:</strong> {selectedReturn.quantityReturned} {selectedReturn.itemUnit}
              </p>
              <p>
                <strong>Condition:</strong> {selectedReturn.condition}
              </p>
              <p>
                <strong>Date Returned:</strong>{" "}
                {format(new Date(selectedReturn.dateReturned), "PPpp")}
              </p>
              <p>
                <strong>Remarks:</strong> {selectedReturn.remarks || "No remarks"}
              </p>
              <p>
                <strong>Processed By:</strong>{" "}
                {selectedReturn.processedBy?.name || "N/A"}
              </p>
            </div>

            <div className="mt-6 text-right">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => setSelectedReturn(null)}
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ReturnManagementPage;
