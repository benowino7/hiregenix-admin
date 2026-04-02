// auth/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const token = sessionStorage.getItem("accessToken");
  const isAuth = token && token !== "null" && token !== "undefined";
  return isAuth ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
