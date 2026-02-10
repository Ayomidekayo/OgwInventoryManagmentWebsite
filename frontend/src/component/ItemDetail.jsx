import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import api from "../api/apiClient";
// Axios instance with token interceptor

const ItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [releases, setReleases] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      console.log("📌 Fetching item ID:", id);
      console.log("📌 Token:", localStorage.getItem("token"));

      try {
        const { data } = await api.get(`/item/${id}`);
        console.log("📌 API response:", data);

        setItem(data.item);
        setReleases(data.releases);
        setReturns(data.returns);
      } catch (error) {
        console.error("❌ API error:", error.response?.data || error.message);
        toast.error(error.response?.data?.message || "Error fetching item details");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleEdit = () => {
    navigate(`/admin-dashboard/item-edit/${id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await api.delete(`/item/${id}`);
      toast.success("Item deleted successfully!");
      navigate("/admin-dashboard/items");
    } catch (error) {
      console.error("❌ Delete error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Error deleting the item");
    }
  };

  if (loading) return <p>Loading item details...</p>;
  if (!item) return <p>Item not found.</p>;

  return (
    <div className="p-6 bg-white shadow rounded-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{item.name}</h1>
        {user?.role === "superadmin" && (
          <div className="space-x-2">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Item Info */}
      <div className="mb-6">
        <p><strong>Category:</strong> {item.category}</p>
        <p><strong>Quantity:</strong> {item.quantity} {item.measuringUnit}</p>
        <p><strong>Status:</strong> {item.currentStatus}</p>
        <p><strong>Refundable:</strong> {item.isRefundable ? "Yes" : "No"}</p>
        {item.description && <p><strong>Description:</strong> {item.description}</p>}
        <p><strong>Added By:</strong> {item.addedBy?.name || "Unknown"}</p>
      </div>

      {/* Release History */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Release History</h2>
        {releases.length === 0 ? (
          <p>No release records found.</p>
        ) : (
          <table className="min-w-full bg-gray-100 rounded-md">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Released To</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Released By</th>
                <th className="px-4 py-2">Date Released</th>
                <th className="px-4 py-2">Return Status</th>
              </tr>
            </thead>
            <tbody>
              {releases.map((r, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">{r.releasedTo}</td>
                  <td className="px-4 py-2">{r.qtyReleased}</td>
                  <td className="px-4 py-2">{r.releasedBy?.name || "Unknown"}</td>
                  <td className="px-4 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2">{r.returnStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Return History */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Return History</h2>
        {returns.length === 0 ? (
          <p>No return records found.</p>
        ) : (
          <table className="min-w-full bg-gray-100 rounded-md">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Returned By</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Condition</th>
                <th className="px-4 py-2">Date Returned</th>
                <th className="px-4 py-2">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2">{r.returnedBy?.name || r.returnedByEmail || "Unknown"}</td>
                  <td className="px-4 py-2">{r.quantityReturned}</td>
                  <td className="px-4 py-2">{r.condition}</td>
                  <td className="px-4 py-2">{new Date(r.dateReturned).toLocaleString()}</td>
                  <td className="px-4 py-2">{r.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ItemDetailPage;
