import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

const Logout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    logout();           // Clear user state and token
    navigate("/login"); // Redirect to login page
  }, [logout, navigate]);

  return null; // Nothing to render
};

export default Logout;
