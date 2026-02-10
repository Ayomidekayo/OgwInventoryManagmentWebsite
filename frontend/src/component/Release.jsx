import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Edit, Trash2, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

const Release = () => {
  const { user } = useAuth();
  const [releases, setReleases] = useState([]);
  const [filteredReleases, setFilteredReleases] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRelease, setEditRelease] = useState(null);
  const [formData, setFormData] = useState({ item: "", qtyReleased: "", releasedTo: "" });
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("token");

  const fetchReleases = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/release", { headers: { Authorization: `Bearer ${token}` } });
      const releaseData = Array.isArray(res.data) ? res.data : res.data.releases || [];
      setReleases(releaseData);
      setFilteredReleases(releaseData);
    } catch (error) {
      toast.error("Failed to load release logs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/items/get", { headers: { Authorization: `Bearer ${token}` } });
      setItems(res.data.products || res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchReleases();
    fetchItems();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item || !formData.qtyReleased || !formData.releasedTo) {
      toast.error("All fields are required");
      return;
    }
    try {
      if (editRelease) {
        await axios.put(`http://localhost:5000/api/releases/${editRelease._id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Release updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/releases", formData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Item released successfully");
      }
      setFormData({ item: "", qtyReleased: "", releasedTo: "" });
      setEditRelease(null);
      fetchReleases();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (release) => {
    setEditRelease(release);
    setFormData({
      item: release.item?._id || "",
      qtyReleased: release.qtyReleased,
      releasedTo: release.releasedTo,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this release?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/releases/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Release deleted successfully");
      fetchReleases();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to delete release");
    }
  };

  // **Debounced Live Search**
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredReleases(releases);
        return;
      }
      const lower = searchQuery.toLowerCase();
      const filtered = releases.filter(
        (r) =>
          r.item?.name.toLowerCase().includes(lower) ||
          r.releasedTo.toLowerCase().includes(lower) ||
          r.releasedBy?.name.toLowerCase().includes(lower)
      );
      setFilteredReleases(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, releases]);

  const SkeletonTableRow = () => (
    <tr>
      {Array(user?.role === "superadmin" ? 6 : 5).fill(0).map((_, idx) => (
        <td key={idx} className="border p-2">
          <div className="h-4 w-full rounded bg-gray-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"></div>
          </div>
        </td>
      ))}
    </tr>
  );

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Release Logs</h2>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-4 mb-4">
        <div className="grid md:grid-cols-3 gap-4">
          <select name="item" value={formData.item} onChange={handleChange} required className="border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="">Select Item</option>
            {items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>

          <input type="number" name="qtyReleased" value={formData.qtyReleased} onChange={handleChange} placeholder="Quantity Released" required className="border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />

          <input type="text" name="releasedTo" value={formData.releasedTo} onChange={handleChange} placeholder="Released To" required className="border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>

        <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition">
          <PlusCircle className="w-5 h-5" /> {editRelease ? "Update Release" : "Add Release"}
        </button>
      </form>

      {/* Search Input */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by item, released to, or released by..."
        className="border p-2 rounded-md mb-4 w-full sm:w-1/3"
      />

      {/* Table Section */}
      <div className="bg-white shadow-md rounded-xl p-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="border p-2">Item</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Released To</th>
              <th className="border p-2">Released By</th>
              <th className="border p-2">Date</th>
              {user?.role === "superadmin" && <th className="border p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(5).fill(0).map((_, idx) => <SkeletonTableRow key={idx} />)
              : filteredReleases.map((r, idx) => (
                  <motion.tr key={r._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="text-center hover:bg-gray-50 transition">
                    <td className="border p-2">{r.item?.name || "N/A"}</td>
                    <td className="border p-2">{r.qtyReleased}</td>
                    <td className="border p-2">{r.releasedTo}</td>
                    <td className="border p-2">{r.releasedBy?.name || "N/A"}</td>
                    <td className="border p-2">{new Date(r.dateReleased).toLocaleDateString()}</td>
                    {user?.role === "superadmin" && (
                      <td className="border p-2 flex justify-center gap-2">
                        <button onClick={() => handleEdit(r)} className="text-blue-500 hover:text-blue-700"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(r._id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                      </td>
                    )}
                  </motion.tr>
                ))}
            {!loading && filteredReleases.length === 0 && (
              <tr>
                <td colSpan={user?.role === "superadmin" ? 6 : 5} className="text-center p-4 text-gray-500">No release logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Release;
