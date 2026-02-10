import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Bell, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/notifications/${id}`,
        { read: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Marked as read");
      fetchNotifications();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update");
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Shimmer skeleton row
  const SkeletonRow = () => (
    <div className="relative overflow-hidden rounded-xl shadow-sm bg-gray-100 h-20 w-full">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer"></div>
    </div>
  );

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-semibold text-gray-800">Notifications</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(5)
            .fill(0)
            .map((_, idx) => (
              <SkeletonRow key={idx} />
            ))}
        </div>
      ) : notifications.length === 0 ? (
        <p className="text-gray-500 text-center py-6">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((note, idx) => (
            <motion.div
              key={note._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex justify-between items-center p-4 rounded-xl shadow-sm transition ${
                note.read ? "bg-gray-50" : "bg-blue-50 border border-blue-200"
              }`}
            >
              <div>
                <p className="text-gray-800 font-medium">{note.message}</p>
                <p className="text-sm text-gray-500">
                  {new Date(note.date).toLocaleString()}
                </p>
              </div>

              {!note.read ? (
                <button
                  onClick={() => markAsRead(note._id)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <CheckCircle2 className="w-5 h-5" /> Mark as Read
                </button>
              ) : (
                <span className="text-green-600 flex items-center gap-1 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Read
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notification;
