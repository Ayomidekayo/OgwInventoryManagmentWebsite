import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ReturnableItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/items/returnable", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(res.data.items);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load returnable items");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [token]);

  if (loading) return <p>Loading returnable items...</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Returnable Items</h1>
      <table className="min-w-full border rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2">Quantity</th>
            <th className="px-4 py-2">Unit</th>
            <th className="px-4 py-2">Added By</th>
            <th className="px-4 py-2">Returnable</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-4">
                No returnable items found.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">{item.category}</td>
                <td className="px-4 py-2">{item.quantity}</td>
                <td className="px-4 py-2">{item.measuringUnit}</td>
                <td className="px-4 py-2">{item.addedBy?.name || "N/A"}</td>
                <td className="px-4 py-2">{item.isRefundable ? "Yes" : "No"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReturnableItemsPage;
