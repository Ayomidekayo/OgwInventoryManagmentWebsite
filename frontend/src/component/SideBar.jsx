import React, { useEffect, useState } from "react";
import {
  Boxes,
  ShoppingCart,
  Truck,
  Users,
  UserCircle,
  LogOut,
  BarChart3,
  Bell,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Realistic skeleton loader
const SkeletonSideBar = ({ itemCount = 8 }) => {
  return (
    <div className="flex flex-col h-screen p-3 bg-black text-white w-16 md:w-64 fixed">
      <div className="flex items-center justify-center h-16 animate-pulse">
        <div className="bg-gray-700 h-6 w-24 md:w-32 rounded"></div>
      </div>
      <ul className="space-y-2 p-2">
        {Array.from({ length: itemCount }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 p-2 rounded-md animate-pulse">
            {/* Icon placeholder */}
            <div className="bg-gray-700 w-5 h-5 rounded-full"></div>
            {/* Text placeholder */}
            <div className="hidden md:block bg-gray-700 h-4 w-24 rounded"></div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SideBar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const adminItems = [
    { name: "Dashboard", path: "", icon: Boxes, isIndex: true },
    { name: "Items", path: "items", icon: ShoppingCart, matchStartsWith: true },
    { name: "Notifications", path: "notifications", icon: Bell },
    { name: "Users", path: "users", icon: Users },
    { name: "Releases", path: "releases", icon: Truck },
    { name: "Reports", path: "reports", icon: BarChart3 },
     { name: "Returns", path: "returns", icon: BarChart3 },
    { name: "Profile", path: "profile", icon: UserCircle },
    { name: "Logout", path: "logout", icon: LogOut },
  ];

  const userItems = [
    { name: "Items", path: "items", icon: ShoppingCart, matchStartsWith: true },
     { name: "Returns", path: "returns", icon: BarChart3 },
    { name: "Profile", path: "profile", icon: UserCircle },
    { name: "Logout", path: "logout", icon: LogOut },
  ];

  const [menuLinks, setMenuLinks] = useState(userItems);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      if (user && (user.role === "admin" || user.role === "superadmin")) {
        setMenuLinks(adminItems);
      } else {
        setMenuLinks(userItems);
      }
      setLoading(false);
    }, 500); // 0.5s delay for demo

    return () => clearTimeout(timer);
  }, [user]);

  const basePath = location.pathname.startsWith("/admin-dashboard")
    ? "/admin-dashboard/"
    : "/user-dashboard/";

  const isActiveLink = (itemPath, matchStartsWith = false) => {
    const fullPath = basePath + itemPath;
    if (matchStartsWith) return location.pathname.startsWith(fullPath);
    return location.pathname === fullPath;
  };

  if (loading) {
    return <SkeletonSideBar itemCount={menuLinks.length} />;
  }

  return (
    <div className="flex flex-col h-screen p-3 bg-black text-white w-16 md:w-64 fixed">
      <div className="flex items-center justify-center h-16">
        <span className="hidden md:block text-xl font-bold">Store MS</span>
        <span className="md:hidden text-xl font-bold text-gray-300">SMS</span>
      </div>

      <ul className="space-y-2 p-2">
        {menuLinks.map((item) => {
          const Icon = item.icon;
          const to = item.isIndex ? basePath : basePath + item.path;
          const active = isActiveLink(item.path, item.matchStartsWith);

          return (
            <li key={item.name}>
              <NavLink
                to={to}
                end={item.isIndex || false}
                className={`flex items-center gap-3 p-2 rounded-md transition duration-200 ${
                  active ? "bg-gray-700 text-white" : "hover:bg-gray-800 text-gray-300"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="ml-4 hidden md:block">{item.name}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SideBar;
