import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ✅ Components
import Navbar from "./component/Navbar";
import Root from "./component/Root";
import ProtectedRoutes from "./utilis/ProtectedRoutes";

// ✅ Public Pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// ✅ Shared Dashboard Layout
import Dashboard from "./pages/Dashboard";

// ✅ Admin Pages
import AdminDashboard from "./component/AdminDashboard";
import ItemsPage from "./pages/Itemspage";
import AddItemPage from "./pages/AddItemPage";
import Notification from "./component/Notification";
import ReleasePage from "./pages/ReleasePage";
import Report from "./component/Report";
import User from "./component/User";
import Profile from "./component/Profile";
import Logout from "./component/Logout";


// ✅ User Pages
import Item from "./component/Item";
import ItemDetailPage from "./pages/ItemDetailPage";
import ItemEditPage from "./pages/ItemEditPage";
import ReleaseDetailPage from "./pages/ReleaseDetailPage";
import ReturnPage from "./pages/ReturnPage";


export default function App() {
  return (
    <>
      {/* 🔹 Global Navbar */}
      <Navbar />

      {/* 🔹 Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* 🔹 Main Content Wrapper */}
      <main className="pt-20 px-4 md:px-8 bg-gray-50 min-h-screen transition-all duration-500">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Root />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Dashboard (Protected) */}
          <Route
            path="/admin-dashboard/*"
            element={
              <ProtectedRoutes requireRole={["admin", "superadmin"]}>
                <Dashboard />
              </ProtectedRoutes>
            }
          >
            <Route index element={<AdminDashboard />} />
          <Route path="items" element={<ItemsPage />} />
          <Route path="item/details/:id" element={<ItemDetailPage />} />
          <Route path="item-edit/:id" element={<ItemEditPage />} />
          <Route path="releases/:id" element={<ReleaseDetailPage />} />
          <Route path="add-item" element={<AddItemPage />} />
           <Route path="returns" element={<ReturnPage />} />
            <Route path="notifications" element={<Notification />} />
            <Route path="releases" element={<ReleasePage />} />
            <Route path="reports" element={<Report />} />
            <Route path="users" element={<User />} />
            <Route path="profile" element={<Profile />} />
            <Route path="logout" element={<Logout />} />
          </Route>

         {/* User Dashboard (Protected) */}
        <Route
          path="/user-dashboard/*"
          element={
            <ProtectedRoutes requireRole={["user"]}>
              <Dashboard />
            </ProtectedRoutes>
          }
        >
          {/* Default page when user-dashboard is visited */}
          <Route index element={<Item />} />

          {/* Nested routes */}
          <Route path="items" element={<ItemsPage />} />
          <Route  path="item/details/:id"  element={<ItemDetailPage />} />
          <Route path="releases/:id" element={<ReleaseDetailPage />} />
          <Route path="notifications" element={<Notification />} />
          <Route path="releases" element={<ReleasePage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="logout" element={<Logout />} />
        </Route>

          {/* Unauthorized Page */}
          <Route path="/unauthorized" element={<h1>Unauthorized Access</h1>} />
        </Routes>
      </main>
    </>
  );
}
