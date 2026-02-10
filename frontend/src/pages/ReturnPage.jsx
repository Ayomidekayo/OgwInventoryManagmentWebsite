import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { format } from "date-fns";

const ReturnPage = () => {
  const [returns, setReturns] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState("date-desc");
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // Fetch returns from API
  useEffect(() => {
    const fetchReturns = async () => {
      if (!token) {
        console.error("No token found. User not authenticated.");
        setReturns([]);
        setFiltered([]);
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/api/return", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const dataArray = Array.isArray(res.data?.returns)
          ? res.data.returns
          : [];
        setReturns(dataArray);
        setFiltered(dataArray);
      } catch (error) {
        console.error("Error fetching returns:", error);
        setReturns([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, [token]);

  // Filter and sort returns
  useEffect(() => {
    let list = [...returns];

    // Filter by search
    if (search.trim()) {
      list = list.filter(
        (r) =>
          r.item?.name?.toLowerCase().includes(search.toLowerCase()) ||
          r.returnedBy?.toLowerCase().includes(search.toLowerCase()) ||
          r.condition?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort options
    switch (sortOption) {
      case "date-desc":
        list.sort(
          (a, b) => new Date(b.dateReturned) - new Date(a.dateReturned)
        );
        break;
      case "date-asc":
        list.sort(
          (a, b) => new Date(a.dateReturned) - new Date(b.dateReturned)
        );
        break;
      case "quantity-desc":
        list.sort((a, b) => b.quantityReturned - a.quantityReturned);
        break;
      case "quantity-asc":
        list.sort((a, b) => a.quantityReturned - b.quantityReturned);
        break;
      case "condition":
        list.sort((a, b) => a.condition.localeCompare(b.condition));
        break;
      default:
        break;
    }

    setFiltered(list);
  }, [search, sortOption, returns]);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold">Loading Returns...</h2>
        <div className="animate-pulse mt-4 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Returned Items</h1>

      {/* Search + Sort */}
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
            {filtered.length > 0 ? (
              filtered.map((r) => {
                const expectedReturn = r.expectedReturnBy
                  ? new Date(r.expectedReturnBy)
                  : null;
                const isOverdue = expectedReturn ? new Date() > expectedReturn : false;

                return (
                  <motion.tr
                    key={r._id}
                    whileHover={{ scale: 1.01 }}
                    className={`cursor-pointer border-b hover:bg-gray-50 ${
                      isOverdue ? "bg-red-50" : ""
                    }`}
                    onClick={() => setSelectedReturn(r)}
                  >
                    <td className="px-4 py-2">{r.item?.name || "N/A"}</td>
                    <td className="px-4 py-2">{r.returnedBy}</td>
                    <td className="px-4 py-2">{r.quantityReturned}</td>
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
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No return records found.
                </td>
              </tr>
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
              Return Details – {selectedReturn.item?.name}
            </h2>

            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Returned By:</strong> {selectedReturn.returnedBy}
              </p>
              <p>
                <strong>Email:</strong> {selectedReturn.returnedByEmail || "N/A"}
              </p>
              <p>
                <strong>Quantity:</strong> {selectedReturn.quantityReturned}
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
              <p>
                <strong>Expected Return By:</strong>{" "}
                {selectedReturn.expectedReturnBy
                  ? format(new Date(selectedReturn.expectedReturnBy), "PPpp")
                  : "N/A"}
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

export default ReturnPage;
