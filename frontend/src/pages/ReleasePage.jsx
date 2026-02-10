import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReleaseForm from "../component/ReleaseForm";
import ReleaseApprovalPanel from "../component/ReleaseApprovalPanel";

const ReleasePage = () => {
  const [activeTab, setActiveTab] = useState("myReleases");
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // ✅ Fetch current user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("No token found. Please log in again.");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data.user);
      } catch (error) {
        console.error("❌ Failed to fetch user:", error);
        toast.error("Failed to fetch user info.");
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, []);

  // ✅ Fetch all releases
  const fetchReleases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/release", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReleases(res.data.data || []);
    } catch (error) {
      console.error("❌ Error fetching releases:", error);
      toast.error("Failed to fetch released items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const isSuperAdmin = user?.role === "superadmin" ;

  // ✅ Loading states
  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg font-semibold">
        Loading user info...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500 font-semibold">
        Unable to load user. Please log in again.
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Release Management
        </h1>
        <p className="text-gray-600">
          Logged in as: <strong>{user.name || "Unknown"}</strong> (
          {user.role || "No role"})
        </p>
      </div>

      {/* ✅ Tabs */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          className={`px-4 py-2 rounded-md font-medium ${
            activeTab === "myReleases"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setActiveTab("myReleases")}
        >
          My Releases
        </button>

        {isSuperAdmin && (
          <button
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === "approvals"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("approvals")}
          >
            Approval Panel
          </button>
        )}
      </div>

      {/* ✅ Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "myReleases" ? (
          <div>
            <ReleaseForm onReleaseAdded={fetchReleases} />

            {loading ? (
              <p className="text-center text-gray-500 mt-6">
                Loading released items...
              </p>
            ) : releases.length > 0 ? (
              <table className="w-full mt-6 bg-white shadow rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3 text-left">Item</th>
                    <th className="p-3 text-left">Quantity</th>
                    <th className="p-3 text-left">Released To</th>
                    <th className="p-3 text-left">Released By</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {releases.map((rel) => (
                    <tr key={rel._id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{rel.item || "Unknown"}</td>
                      <td className="p-3">{rel.qtyReleased}</td>
                      <td className="p-3">{rel.releasedTo}</td>
                      <td className="p-3">{rel.releasedBy?.name || "N/A"}</td>
                      <td className="p-3">
                        {rel.dateReleased
                          ? new Date(rel.dateReleased).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="p-3 font-semibold capitalize">
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-medium ${
                          rel.approvalStatus === "approved"
                            ? "bg-green-100 text-green-700"
                            : rel.approvalStatus === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : rel.approvalStatus === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {rel.approvalStatus || "pending"}
                      </span>
                    </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 mt-6">
                No release records found.
              </p>
            )}
          </div>
        ) : (
          isSuperAdmin && <ReleaseApprovalPanel user={user} onUpdate={fetchReleases} />
        )}
      </motion.div>
    </div>
  );
};

export default ReleasePage;
