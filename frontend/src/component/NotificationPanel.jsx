import { useEffect, useState, useRef } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Bell, CheckCircle2, Loader2, AlertTriangle, Package } from "lucide-react";

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const panelRef = useRef();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
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
      fetchNotifications();
      toast.success("Marked as read");
    } catch (error) {
      console.error("Error updating notification:", error);
      toast.error("Failed to update");
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ✅ Stock color logic + tooltip info
  const getStockStyle = (quantity) => {
    if (quantity === undefined) return { color: "bg-gray-50 border-gray-200", label: "Info" };
    if (quantity > 50) return { color: "bg-green-50 border-green-300", label: "Stock Sufficient" };
    if (quantity > 10) return { color: "bg-yellow-50 border-yellow-300", label: "Moderate Stock" };
    return { color: "bg-red-50 border-red-400", label: "Low Stock – Restock Soon!" };
  };

  return (
    <div className="relative" ref={panelRef}>
      <Toaster position="top-right" />

      {/* 🔔 Notification Bell */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 🧾 Notification Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200 z-50 animate-fade-in">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <span className="text-sm text-gray-500">
              {notifications.length} total
            </span>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center h-32 space-x-2 text-gray-600">
              <Loader2 className="animate-spin w-6 h-6" />
              <span>Loading...</span>
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No notifications yet.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-200">
              {notifications.map((note) => {
                const { color, label } = getStockStyle(note.quantity);
                return (
                  <div
                    key={note._id}
                    className={`flex justify-between items-center p-4 border-l-4 transition-all duration-300 hover:shadow-sm ${note.read ? "bg-gray-50 border-gray-200" : color}`}
                    title={label}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {note.quantity <= 10 ? (
                          <AlertTriangle className="text-red-500 w-4 h-4 animate-pulse" />
                        ) : (
                          <Package className="text-green-600 w-4 h-4" />
                        )}
                        <p className="text-gray-800 font-medium">{note.message}</p>
                      </div>
                      {note.quantity !== undefined && (
                        <p className="text-sm text-gray-500">Qty: {note.quantity}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(note.date).toLocaleString()}
                      </p>
                    </div>

                    {!note.read ? (
                      <button
                        onClick={() => markAsRead(note._id)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark as Read
                      </button>
                    ) : (
                      <span className="text-green-600 flex items-center gap-1 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Read
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
