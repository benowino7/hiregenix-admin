import { Route, Routes } from "react-router-dom";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import DashboardOverview from "../components/DashboardOverview";
import Profile from "../components/Profile";
import Users from "../components/Users";
import Skills from "../components/Skills";
import Industries from "../components/Industries";
import Messaging from "../components/Messaging";
import PaymentManagement from "../components/PaymentManagement";
import SecuritySettings from "../components/SecuritySettings";
import TestimonialManagement from "../components/TestimonialManagement";
import LeadManagement from "../components/LeadManagement";
import SubscriptionManagement from "../components/SubscriptionManagement";
import JobManagement from "../components/JobManagement";
import AdminCreateUser from "../components/AdminCreateUser";
import AdminCvAnalysis from "../components/AdminCvAnalysis";

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <NavBar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <div className="flex">
          <Sidebar
            isOpen={sidebarOpen}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="flex-1 overflow-x-hidden h-[calc(100vh-64px)] overflow-y-auto bg-gray-50 dark:bg-gray-950 px-4 py-2">
            <Routes>
              <Route path="/" element={<DashboardOverview />} />
              <Route path="/messages" element={<Messaging />} />
              <Route path="/users" element={<Users />} />
              <Route path="/create-user" element={<AdminCreateUser />} />
              <Route path="/cv-analysis" element={<AdminCvAnalysis />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/industries" element={<Industries />} />
              <Route path="/jobs" element={<JobManagement />} />
              <Route path="/payments" element={<PaymentManagement />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/security" element={<SecuritySettings />} />
              <Route path="/testimonials" element={<TestimonialManagement />} />
              <Route path="/leads" element={<LeadManagement />} />
              <Route path="/subscriptions" element={<SubscriptionManagement />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
