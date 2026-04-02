import { useState, useEffect, useRef } from "react";
import { BASE_URL } from "../BaseUrl";
import {
  CreditCard,
  Smartphone,
  DollarSign,
  Copy,
  Search,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Link2,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

const getToken = () => {
  try { return JSON.parse(sessionStorage.getItem("accessToken")); }
  catch { return sessionStorage.getItem("accessToken"); }
};
const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

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

// ─── Payment Stats Banner ────────────────────────────────────────
function PaymentStatsBanner() {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/admin/payment-stats`, { headers: authHeaders() });
        const data = await res.json();
        if (data.status === "SUCCESS") setStats(data.data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 size={24} className="animate-spin text-teal-500" />
    </div>
  );
  if (!stats) return null;

  const current = stats[period] || { amount: 0, count: 0 };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-green-500" />
          Revenue Overview
        </h2>
        <div className="flex flex-wrap gap-1">
          {PAYMENT_PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                period === p.key
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800/40">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            ${(current.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/40">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Successful Payments</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{current.count.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/40">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Avg per Transaction</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            ${current.count > 0 ? ((current.amount / current.count) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentManagement() {
  const [activeTab, setActiveTab] = useState("transactions");

  const tabBtn = (key, label, Icon) => (
    <button
      onClick={() => setActiveTab(key)}
      className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
        activeTab === key
          ? "bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
      }`}
    >
      <Icon className="w-4 h-4 inline mr-2" />
      {label}
    </button>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Payment Management
      </h1>

      {/* Revenue Stats */}
      <PaymentStatsBanner />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit flex-wrap">
        {tabBtn("transactions", "Transactions", CreditCard)}
        {tabBtn("generate", "Generate Link", Link2)}
      </div>

      {activeTab === "transactions" && <TransactionsTab />}
      {activeTab === "generate" && <GenerateLinkTab />}
    </div>
  );
}

// ─── Transactions Tab ───────────────────────────────────────────
function TransactionsTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState("");

  const fetchPayments = async (p = 1, status = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (status) params.append("status", status);
      const res = await fetch(`${BASE_URL}/admin/payment-transactions?${params}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!data.error) {
        setPayments(data.result || []);
        setMeta(data.meta || { total: 0, totalPages: 0 });
      }
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(page, statusFilter);
  }, [page, statusFilter]);

  const statusBadge = (status) => {
    const styles = {
      SUCCESS: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      FAILED: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
      PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    };
    const icons = {
      SUCCESS: <CheckCircle className="w-3 h-3" />,
      FAILED: <XCircle className="w-3 h-3" />,
      PENDING: <Clock className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || ""}`}>
        {icons[status]} {status}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Payment Transactions
        </h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">User</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Plan</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Type</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Amount</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">Loading...</td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">No transactions found</td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900 dark:text-white font-medium">
                      {p.subscription?.user?.firstName} {p.subscription?.user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{p.subscription?.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {p.subscription?.plan?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
                      {p.gateway === "GPAY_APAY" ? <Smartphone className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                      {p.gateway === "GPAY_APAY" ? "GPay/APay" : p.gateway || "CARD"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    {p.currency} {(p.amount / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">{statusBadge(p.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {meta.totalPages} ({meta.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Generate Link Tab ──────────────────────────────────────────
function GenerateLinkTab() {
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [description, setDescription] = useState("Diamond Plan Payment");
  const [billingAddress, setBillingAddress] = useState({
    address1: "",
    locality: "",
    administrative_area: "",
    country: "",
    postal_code: "",
  });
  const [generating, setGenerating] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const dropdownRef = useRef(null);
  const searchTimeout = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchUsers = async (query) => {
    if (!query.trim()) { setUsers([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/payment-users?search=${encodeURIComponent(query)}&limit=15`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setUsers(data.result || []);
      setShowDropdown(true);
    } catch {
      setUsers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setUserSearch(val);
    setSelectedUser(null);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchUsers(val), 300);
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setUserSearch(`${user.firstName} ${user.lastName} (${user.email})`);
    setShowDropdown(false);

    // Auto-fill address from user's company data if available
    if (user.recruiterProfile?.company?.country) {
      setBillingAddress((prev) => ({
        ...prev,
        country: user.recruiterProfile.company.country || prev.country,
      }));
    }
  };

  const handleGenerate = async () => {
    if (!selectedUser) { toast.error("Please select a user"); return; }
    if (!amount || Number(amount) <= 0) { toast.error("Enter a valid amount"); return; }

    setGenerating(true);
    setPaymentLink("");
    try {
      const res = await fetch(`${BASE_URL}/admin/payment-links`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: Number(amount),
          currency,
          paymentMethod,
          description,
          billingAddress: paymentMethod === "GPAY_APAY" ? billingAddress : undefined,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.message || "Failed to generate link");
      } else {
        const link = data.result?.paymentLink || data.result?.gatewayResponse?.checkoutUrl || data.result?.gatewayResponse?.paymentLink || "";
        setPaymentLink(link);
        toast.success("Payment link generated!");
      }
    } catch {
      toast.error("Failed to generate payment link");
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    toast.success("Link copied to clipboard!");
  };

  const needsAddress = paymentMethod === "GPAY_APAY";

  return (
    <div className="max-w-2xl">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Generate Payment Link
        </h2>

        {/* User Search */}
        <div ref={dropdownRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Select User
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={userSearch}
              onChange={handleSearchChange}
              onFocus={() => users.length > 0 && setShowDropdown(true)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          {showDropdown && (
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchLoading ? (
                <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
              ) : users.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No users found</div>
              ) : (
                users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => selectUser(u)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.roles?.some((r) => r.role === "RECRUITER")
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    }`}>
                      {u.roles?.some((r) => r.role === "RECRUITER") ? "Recruiter" : "Job Seeker"}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Amount + Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="99.00"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="USD">USD</option>
              <option value="AED">AED</option>
            </select>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod("CARD")}
              className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                paymentMethod === "CARD"
                  ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <CreditCard className={`w-6 h-6 ${paymentMethod === "CARD" ? "text-teal-600" : "text-gray-400"}`} />
              <div className="text-left">
                <div className={`text-sm font-semibold ${paymentMethod === "CARD" ? "text-teal-700 dark:text-teal-400" : "text-gray-700 dark:text-gray-300"}`}>
                  Direct Card
                </div>
                <div className="text-xs text-gray-500">Visa, Mastercard</div>
              </div>
            </button>
            <button
              onClick={() => setPaymentMethod("GPAY_APAY")}
              className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                paymentMethod === "GPAY_APAY"
                  ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <Smartphone className={`w-6 h-6 ${paymentMethod === "GPAY_APAY" ? "text-teal-600" : "text-gray-400"}`} />
              <div className="text-left">
                <div className={`text-sm font-semibold ${paymentMethod === "GPAY_APAY" ? "text-teal-700 dark:text-teal-400" : "text-gray-700 dark:text-gray-300"}`}>
                  Google / Apple Pay
                </div>
                <div className="text-xs text-gray-500">Mobile wallet</div>
              </div>
            </button>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Billing Address (for GPAY_APAY) */}
        {needsAddress && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Billing Address
            </h3>
            <input
              type="text"
              placeholder="Address Line 1"
              value={billingAddress.address1}
              onChange={(e) => setBillingAddress({ ...billingAddress, address1: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="City"
                value={billingAddress.locality}
                onChange={(e) => setBillingAddress({ ...billingAddress, locality: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="State / Province"
                value={billingAddress.administrative_area}
                onChange={(e) => setBillingAddress({ ...billingAddress, administrative_area: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Country (e.g. AE)"
                value={billingAddress.country}
                onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={billingAddress.postal_code}
                onChange={(e) => setBillingAddress({ ...billingAddress, postal_code: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !selectedUser || !amount}
          className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-teal-500 to-amber-500 hover:from-teal-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generating ? (
            "Generating..."
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              Generate Payment Link
            </>
          )}
        </button>

        {/* Payment Link Result */}
        {paymentLink && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
              Payment Link Generated
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={paymentLink}
                className="flex-1 px-3 py-2 rounded-lg border border-green-300 dark:border-green-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1.5 text-sm font-semibold"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentManagement;
