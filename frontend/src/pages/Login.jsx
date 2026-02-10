import React, { useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
      };

      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.user && res.data?.token) {
        login(res.data.user, res.data.token);
        toast.success("Login successful!");

        navigate(
          ["admin", "superadmin"].includes(res.data.user.role)
            ? "/admin-dashboard"
            : "/user-dashboard/items"
        );
      } else {
        toast.error("Login failed. Invalid server response.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6">
      <Toaster />
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md md:max-w-lg"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-700 text-center mb-6">
          Welcome Back
        </h1>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-gray-600 mb-2 text-sm sm:text-base">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:ring focus:ring-blue-200 text-sm sm:text-base"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-gray-600 mb-2 text-sm sm:text-base">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 focus:ring focus:ring-blue-200 text-sm sm:text-base"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base md:text-lg ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        {/* Register Link */}
        <p className="text-center mt-4 text-gray-500 text-sm sm:text-base">
          Don’t have an account?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Register
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
