import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import OGw from '../assests/ogw.png'

const Navbar = ({ deletedCount }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 
        ${isScrolled ? "backdrop-blur-md bg-blue-600/80 shadow-lg" : "bg-blue-600"} text-white`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3">
          <img
            src={OGw}
            alt="OGW"
            className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 object-contain rounded-full"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 hover:text-blue-200 transition-colors">
              OGW
            </span>
            <span className="text-sm sm:text-base md:text-lg text-gray-100">
              Store Management
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-6 text-sm md:text-base">
          <NavLinks
            location={location}
            deletedCount={deletedCount}
            userRole={user?.role}
          />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden focus:outline-none hover:scale-110 transition-transform"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-700/95 backdrop-blur-md border-t border-blue-500">
          <div className="flex flex-col items-start px-6 py-4 space-y-3">
            <NavLinks
              location={location}
              deletedCount={deletedCount}
              userRole={user?.role}
              closeMenu={() => setMenuOpen(false)}
            />
          </div>
        </div>
      )}
    </nav>
  );
};

// NavLinks component remains the same
const NavLinks = ({ location, deletedCount, userRole, closeMenu }) => {
  const isAdmin = userRole === "admin" || userRole === "superadmin";

  if (!userRole) return null;

  return (
    <>
      {isAdmin ? (
        <>
          <Link
            to="/admin-dashboard/items"
            className={`relative hover:text-gray-200 transition ${
              location.pathname.includes("items") ? "font-semibold underline" : ""
            }`}
            onClick={closeMenu}
          >
            Items
            {deletedCount > 0 && (
              <span className="absolute -top-2 -right-3 px-2 py-0.5 bg-red-600 rounded-full text-xs animate-pulse">
                {deletedCount}
              </span>
            )}
          </Link>

          <Link
            to="/admin-dashboard/notifications"
            className={`hover:text-gray-200 transition ${
              location.pathname.includes("notifications")
                ? "font-semibold underline"
                : ""
            }`}
            onClick={closeMenu}
          >
            <Bell className="inline w-4 h-4 mr-1" />
            Notifications
          </Link>

          <Link
            to="/admin-dashboard/logout"
            className="hover:text-gray-200 transition font-medium"
            onClick={closeMenu}
          >
            Logout
          </Link>
        </>
      ) : (
        <>
          <Link
            to="/user-dashboard/items"
            className={`hover:text-gray-200 transition ${
              location.pathname.includes("items") ? "font-semibold underline" : ""
            }`}
            onClick={closeMenu}
          >
            Items
          </Link>

          <Link
            to="/user-dashboard/notifications"
            className={`hover:text-gray-200 transition ${
              location.pathname.includes("notifications")
                ? "font-semibold underline"
                : ""
            }`}
            onClick={closeMenu}
          >
            <Bell className="inline w-4 h-4 mr-1" />
            Notifications
          </Link>

          <Link
            to="/user-dashboard/logout"
            className="hover:text-gray-200 transition font-medium"
            onClick={closeMenu}
          >
            Logout
          </Link>
        </>
      )}
    </>
  );
};

export default Navbar;
