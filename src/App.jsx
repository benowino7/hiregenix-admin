import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./auth/Login";
import Dashboard from "./pages/Dashboard";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./auth/ProtectedRoute";
import PublicLayout from "./layouts/PublicLayouts";
import ForgotPassword from "./auth/ForgotPassword";
import CookieConsent from "./components/CookieConsent";

function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard/*" element={<Dashboard />} />
          </Route>
        </Route>
      </Routes>
      <ToastContainer />
      <CookieConsent />
    </>
  );
}

export default App;
