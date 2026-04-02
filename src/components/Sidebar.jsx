import {
  BookAIcon,
  Briefcase,
  ClipboardList,
  CreditCard,
  LogOut,
  LucideHome,
  MessageCircle,
  MessageSquareQuote,
  User,
  Users,
  Shield,
  XCircle,
  FileText,
  ArrowUpDown,
  UserPlus,
  FileSearch,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: Briefcase },
    { path: "/dashboard/messages", label: "Messages", icon: MessageCircle },
    { path: "/dashboard/users", label: "User Management", icon: Users },
    { path: "/dashboard/create-user", label: "Create User", icon: UserPlus },
    {
      path: "/dashboard/industries",
      label: "Industry Management",
      icon: LucideHome,
    },
    { path: "/dashboard/jobs", label: "Job Management", icon: ClipboardList },
    { path: "/dashboard/skills", label: "Skill Management", icon: BookAIcon },
    { path: "/dashboard/cv-analysis", label: "CV Analysis", icon: FileSearch },
    { path: "/dashboard/payments", label: "Payments", icon: CreditCard },
    { path: "/dashboard/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    { path: "/dashboard/leads", label: "Lead Captures", icon: FileText },
    { path: "/dashboard/subscriptions", label: "Subscriptions", icon: ArrowUpDown },
    { path: "/dashboard/profile", label: "My Profile", icon: User },
    { path: "/dashboard/security", label: "Security", icon: Shield },
  ];

  const handleSignOut = () => {
    sessionStorage.clear();
    window.location.href = "/";
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 lg:hidden z-20"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static top-16 lg:top-0 bottom-0 left-0 z-30 w-[240px] sm:w-[260px] bg-white dark:bg-gray-900 lg:h-[calc(100vh-64px)] overflow-y-auto
          border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between lg:hidden">
            <span className="text-xl font-bold text-teal-500">Menu</span>
            <button onClick={toggleSidebar}>
              <XCircle size={24} />
            </button>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${
                    location.pathname === item.path
                      ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                `}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
