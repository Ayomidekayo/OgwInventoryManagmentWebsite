import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { motion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";

const Profile = () => {
  const [user, setUser] = useState({ _id: "", name: "", email: "" });
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    if (!token) {
      toast.error("Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("http://localhost:5000/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Backend might return res.data.user or res.data directly
      const userData = res.data.user || res.data;
      console.log("Profile response:", userData);

      setUser(userData);
      setFormData({ name: userData.name, email: userData.email, password: "" });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error(error.response?.data?.message || "Unable to fetch profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.name === user.name && formData.email === user.email && formData.password === "") {
      toast.info("No changes detected.");
      return;
    }

    try {
      const res = await axios.put(
        "http://localhost:5000/api/user/profile/update",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = res.data.user || res.data;
      setUser(updatedUser);
      setFormData({ ...formData, password: "" });
      setEditMode(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile.");
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.map((n) => n[0]?.toUpperCase()).join("").slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-semibold">Loading profile...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen p-6 flex justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <ToastContainer position="top-right" autoClose={2500} />
      <motion.form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-100"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
            {getInitials(user.name)}
          </div>
          <h2 className="text-xl font-semibold mt-3 text-gray-800">{user.name}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!editMode}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none transition-all ${
                editMode ? "border-blue-500 focus:ring-2 focus:ring-blue-300" : "border-gray-300 bg-gray-100"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!editMode}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none transition-all ${
                editMode ? "border-blue-500 focus:ring-2 focus:ring-blue-300" : "border-gray-300 bg-gray-100"
              }`}
            />
          </div>

          {editMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Change Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
                className="w-full px-4 py-2 border rounded-lg border-blue-500 focus:ring-2 focus:ring-blue-300"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          {editMode ? (
            <>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setFormData({ name: user.name, email: user.email, password: "" });
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Edit Profile
            </button>
          )}
        </div>
      </motion.form>
    </motion.div>
  );
};

export default Profile;
