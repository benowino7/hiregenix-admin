// layouts/DashboardLayout.jsx
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Outlet />
    </div>
  );
};

export default DashboardLayout;
