import { useState, useEffect } from "react";
import {
  Users,
  Briefcase,
  UserCheck,
  AlertCircle,
  Loader2,
  Mail,
  Clock,
  Shield,
  Tag,
  Link as LinkIcon,
  Building2,
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BASE_URL } from "../BaseUrl";

const PAYMENT_PERIODS = [
  { key: "daily", label: "Today" },
  { key: "weekly", label: "This Week" },
  { key: "monthly", label: "This Month" },
  { key: "quarterly", label: "This Quarter" },
  { key: "semiAnnual", label: "Semi-Annual" },
  { key: "annual", label: "Annual" },
  { key: "ytd", label: "Year to Date" },
  { key: "allTime", label: "All Time" },
];

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [paymentPeriod, setPaymentPeriod] = useState("monthly");

  const getToken = () => {
    try {
      return JSON.parse(sessionStorage.getItem("accessToken"));
    } catch {
      return sessionStorage.getItem("accessToken");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [statsResponse, paymentResponse] = await Promise.all([
        fetch(`${BASE_URL}/admin/stats`, { headers }),
        fetch(`${BASE_URL}/admin/payment-stats`, { headers }),
      ]);
      const statsResult = await statsResponse.json();
      const paymentResult = await paymentResponse.json();

      if (statsResult.status === "SUCCESS") {
        setStats(statsResult.data);
      } else {
        setError(statsResult.message || "Failed to fetch stats");
      }
      if (paymentResult.status === "SUCCESS") {
        setPaymentStats(paymentResult.data);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats
    ? [
        {
          label: "Total Users",
          value: stats.users,
          icon: Users,
          bgGradient:
            "from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-600/10",
          iconBg: "bg-blue-100 dark:bg-blue-500/20",
          iconColor: "text-blue-600 dark:text-blue-400",
        },
        {
          label: "Job Seekers",
          value: stats.jobSeekers,
          icon: Briefcase,
          bgGradient:
            "from-green-50 to-green-100/50 dark:from-green-500/10 dark:to-green-600/10",
          iconBg: "bg-green-100 dark:bg-green-500/20",
          iconColor: "text-green-600 dark:text-green-400",
        },
        {
          label: "Recruiters",
          value: stats.recruiters,
          icon: UserCheck,
          bgGradient:
            "from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-600/10",
          iconBg: "bg-purple-100 dark:bg-purple-500/20",
          iconColor: "text-purple-600 dark:text-purple-400",
        },
        {
          label: "Pending Approvals",
          value: stats.pendingApprovals,
          icon: AlertCircle,
          bgGradient:
            "from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-600/10",
          iconBg: "bg-amber-100 dark:bg-amber-500/20",
          iconColor: "text-amber-600 dark:text-amber-400",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center flex flex-col items-center">
          <Loader2 className="text-theme_color dark:text-dark-theme_color text-8xl animate-spin" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={64} />
          <h3 className="text-2xl font-bold mb-2 dark:text-white">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-theme_color text-white rounded-xl hover:bg-teal-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
              <Shield size={16} />
              Platform Overview
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard/users"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-lg transition-all"
            >
              <Users size={18} /> Manage Users
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`relative bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all group overflow-hidden`}
          >
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.iconBg} p-3 rounded-xl`}>
                  <card.icon size={24} className={card.iconColor} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {card.value}
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            {
              label: "Industries",
              value: stats.industries,
              icon: Building2,
              bgGradient: "from-indigo-50 to-indigo-100/50 dark:from-indigo-500/10 dark:to-indigo-600/10",
              iconBg: "bg-indigo-100 dark:bg-indigo-500/20",
              iconColor: "text-indigo-600 dark:text-indigo-400",
            },
            {
              label: "Skills",
              value: stats.skills,
              icon: Tag,
              bgGradient: "from-cyan-50 to-cyan-100/50 dark:from-cyan-500/10 dark:to-cyan-600/10",
              iconBg: "bg-cyan-100 dark:bg-cyan-500/20",
              iconColor: "text-cyan-600 dark:text-cyan-400",
            },
            {
              label: "Total Jobs",
              value: stats.jobs,
              subtitle: `${stats.publishedJobs?.toLocaleString() || 0} published · ${stats.feedJobs?.toLocaleString() || 0} from feed`,
              icon: Briefcase,
              bgGradient: "from-teal-50 to-teal-100/50 dark:from-teal-500/10 dark:to-teal-600/10",
              iconBg: "bg-teal-100 dark:bg-teal-500/20",
              iconColor: "text-teal-600 dark:text-teal-400",
            },
            {
              label: "Skill Mappings",
              value: stats.mappings,
              icon: LinkIcon,
              bgGradient: "from-rose-50 to-rose-100/50 dark:from-rose-500/10 dark:to-rose-600/10",
              iconBg: "bg-rose-100 dark:bg-rose-500/20",
              iconColor: "text-rose-600 dark:text-rose-400",
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`relative bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all group overflow-hidden`}
            >
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${card.iconBg} p-3 rounded-xl`}>
                    <card.icon size={24} className={card.iconColor} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {card.value?.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {card.label}
                </div>
                {card.subtitle && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {card.subtitle}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Revenue Stats */}
      {paymentStats && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign size={22} className="text-green-500" />
              Payment Revenue
            </h2>
            <div className="flex flex-wrap gap-1">
              {PAYMENT_PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPaymentPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    paymentPeriod === p.key
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800/40">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-800/40 rounded-lg">
                  <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              </div>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                ${((paymentStats[paymentPeriod]?.amount || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800/40">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-800/40 rounded-lg">
                  <CreditCard size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions</p>
              </div>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                {(paymentStats[paymentPeriod]?.count || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-5 border border-purple-100 dark:border-purple-800/40">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-800/40 rounded-lg">
                  <Calendar size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg per Transaction</p>
              </div>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                ${paymentStats[paymentPeriod]?.count > 0
                  ? ((paymentStats[paymentPeriod].amount / paymentStats[paymentPeriod].count) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : "0.00"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UserCheck size={22} className="text-green-500" />
            Recruiter Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Recruiters
              </span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {stats?.activeRecruiters || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pending Approval
              </span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {stats?.pendingApprovals || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Recruiters
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {stats?.recruiters || 0}
              </span>
            </div>
          </div>
          {(stats?.pendingApprovals || 0) > 0 && (
            <Link
              to="/dashboard/users"
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-theme_color text-white rounded-xl hover:bg-teal-600 transition-colors font-medium text-sm"
            >
              <AlertCircle size={16} />
              Review Pending Approvals ({stats.pendingApprovals})
            </Link>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase size={22} className="text-blue-500" />
            User Breakdown
          </h2>
          <div className="space-y-4">
            {[
              {
                label: "Job Seekers",
                count: stats?.jobSeekers || 0,
                color: "bg-green-500",
              },
              {
                label: "Recruiters",
                count: stats?.recruiters || 0,
                color: "bg-purple-500",
              },
              {
                label: "Admins",
                count: stats?.admins || 0,
                color: "bg-teal-500",
              },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {item.count}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{
                      width:
                        (stats?.users || 0) > 0
                          ? `${(item.count / stats.users) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock size={22} className="text-cyan-500" />
            Recent User Registrations
          </h2>
          <Link
            to="/dashboard/users"
            className="text-sm text-theme_color hover:underline font-medium"
          >
            View All
          </Link>
        </div>

        {!stats?.recentUsers?.length ? (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 dark:text-gray-400">
              No users registered yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                  {user.firstName?.[0] || "?"}
                  {user.lastName?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white truncate">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 truncate">
                    <Mail size={12} className="flex-shrink-0" />
                    {user.email}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex flex-wrap gap-1 justify-end">
                    {user.roles?.map((role, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          role === "RECRUITER"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                            : role === "ADMIN"
                              ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
                              : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        }`}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
