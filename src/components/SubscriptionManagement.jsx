import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowUpDown, CheckCircle, AlertCircle, Loader2, Crown, Clock, Edit2, Save, X, Users, Briefcase, Package, ChevronLeft, ChevronRight, UserCircle } from 'lucide-react';
import { BASE_URL } from '../BaseUrl';
import { toast } from 'react-toastify';

const SUPER_USER_EMAIL = "admin@hiregenix.ai";

const getToken = () => {
  try { return JSON.parse(sessionStorage.getItem("accessToken")); }
  catch { return sessionStorage.getItem("accessToken"); }
};
const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});
const isSuperUser = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem("user"));
    return user?.email === SUPER_USER_EMAIL;
  } catch { return false; }
};

// ─── Package Management Section ─────────────────────────────────
function PackageManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', amount: '', interval: 'MONTH' });
  const [saving, setSaving] = useState(false);
  const canEdit = isSuperUser();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/admin/subscription-plans`, { headers: authHeaders() });
      const data = await res.json();
      if (data.status === "SUCCESS") setPlans(data.data);
    } catch {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const startEdit = (plan) => {
    setEditingId(plan.id);
    setEditForm({ name: plan.name, amount: (plan.amount / 100).toFixed(2), interval: plan.interval });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', amount: '', interval: 'MONTH' });
  };

  const saveEdit = async (planId) => {
    if (!editForm.name.trim()) { toast.error("Name is required"); return; }
    if (!editForm.amount || Number(editForm.amount) < 0) { toast.error("Enter a valid amount"); return; }
    try {
      setSaving(true);
      const res = await fetch(`${BASE_URL}/admin/subscription-plans/${planId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          name: editForm.name.trim(),
          amount: Math.round(Number(editForm.amount) * 100),
          interval: editForm.interval,
        }),
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        toast.success("Plan updated successfully");
        setEditingId(null);
        fetchPlans();
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

  // Separate job seeker & recruiter plans, exclude Free Trial
  const jobSeekerPlans = plans.filter(p => p.userType === "JOB_SEEKER" && p.name !== "Free Trial" && !p.name.startsWith("Diamond"));
  // Recruiter packages = Diamond plans (match recruiter site pricing)
  const recruiterPlans = plans.filter(p => p.userType === "RECRUITER" && p.name.startsWith("Diamond"));

  const tierColors = {
    Silver: { bg: "bg-gray-50 dark:bg-gray-800/60", border: "border-gray-200 dark:border-gray-700", badge: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300", accent: "text-gray-600 dark:text-gray-400" },
    Gold: { bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800/40", badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", accent: "text-amber-600 dark:text-amber-400" },
    Platinum: { bg: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-200 dark:border-violet-800/40", badge: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400", accent: "text-violet-600 dark:text-violet-400" },
    Diamond: { bg: "bg-gray-50 dark:bg-gray-800/60", border: "border-gray-200 dark:border-gray-700", badge: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300", accent: "text-gray-600 dark:text-gray-400" },
    "Diamond Compact": { bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800/40", badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", accent: "text-amber-600 dark:text-amber-400" },
    "Diamond Compact Plus": { bg: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-200 dark:border-violet-800/40", badge: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400", accent: "text-violet-600 dark:text-violet-400" },
    "Diamond Unlimited": { bg: "bg-cyan-50 dark:bg-cyan-900/20", border: "border-cyan-200 dark:border-cyan-800/40", badge: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400", accent: "text-cyan-600 dark:text-cyan-400" },
  };
  const defaultColor = tierColors.Silver;

  const recruiterSubtitles = {
    Diamond: "Single Job Posting",
    "Diamond Compact": "3 Job Postings",
    "Diamond Compact Plus": "5 Job Postings",
    "Diamond Unlimited": "Unlimited Job Postings",
  };

  const renderPlanCard = (plan) => {
    const isEditing = canEdit && editingId === plan.id;
    const tierName = Object.keys(tierColors).find(t => plan.name?.startsWith(t)) || null;
    const colors = tierColors[tierName] || defaultColor;

    return (
      <div key={plan.id} className={`relative ${colors.bg} rounded-xl border ${colors.border} p-5 transition-all hover:shadow-md`}>
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Plan Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Price (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Billing Interval</label>
              <select
                value={editForm.interval}
                onChange={(e) => setEditForm({ ...editForm, interval: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              >
                <option value="MONTH">Monthly</option>
                <option value="YEAR">Yearly</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => saveEdit(plan.id)}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition-colors"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colors.badge} mb-1`}>
                  {plan.name}
                </span>
                {recruiterSubtitles[plan.name] && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{recruiterSubtitles[plan.name]}</p>
                )}
                <p className={`text-2xl font-bold ${colors.accent}`}>
                  ${(plan.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/{plan.interval === 'YEAR' ? 'yr' : plan.interval === 'HALF_YEAR' ? '6mo' : plan.interval === 'QUARTER' ? '3mo' : 'mo'}</span>
                </p>
              </div>
              {canEdit && (
                <button
                  onClick={() => startEdit(plan)}
                  className="p-2 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                  title="Edit plan"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Users size={12} />
                {plan.activeSubscriptions} subscriber{plan.activeSubscriptions !== 1 ? 's' : ''}
              </span>
              <span>{plan.currency} · {plan.interval}</span>
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={28} className="animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Job Seeker Plans */}
      {jobSeekerPlans.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Briefcase size={14} />
            Job Seeker Plans
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobSeekerPlans.map(renderPlanCard)}
          </div>
        </div>
      )}

      {/* Recruiter Packages (Diamond plans) */}
      {recruiterPlans.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users size={14} />
            Recruiter Packages
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recruiterPlans.map(renderPlanCard)}
          </div>
        </div>
      )}

      {jobSeekerPlans.length === 0 && recruiterPlans.length === 0 && (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          <Package size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p>No editable plans found</p>
          <p className="text-xs mt-1">Silver, Gold, and Platinum plans will appear here</p>
        </div>
      )}
    </div>
  );
}

// ─── User Plan Management Section ───────────────────────────────
function UserPlanManagement() {
  // Contact list state
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactSearch, setContactSearch] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsTotalPages, setContactsTotalPages] = useState(1);
  const [contactsTotal, setContactsTotal] = useState(0);
  const contactSearchTimer = useRef(null);

  // Selected user & plan state
  const [selectedUser, setSelectedUser] = useState(null);
  const [subInfo, setSubInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState(false);
  const [message, setMessage] = useState(null);
  const [durationDays, setDurationDays] = useState('');

  // Fetch users via admin endpoint (shows ALL users with proper pagination)
  const fetchContacts = useCallback(async (page = 1, search = '', role = '') => {
    setContactsLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search.trim()) params.set('search', search.trim());
      if (role) params.set('role', role);
      const res = await fetch(`${BASE_URL}/admin/users?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        setContacts(data.data || []);
        setContactsTotalPages(data.meta?.totalPages || 1);
        setContactsTotal(data.meta?.total || 0);
      }
    } catch {
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts(contactsPage, contactSearch, contactRole);
  }, [contactsPage, contactRole, fetchContacts]);

  // Debounced search
  const handleContactSearch = (val) => {
    setContactSearch(val);
    clearTimeout(contactSearchTimer.current);
    contactSearchTimer.current = setTimeout(() => {
      setContactsPage(1);
      fetchContacts(1, val, contactRole);
    }, 300);
  };

  const handleRoleChange = (role) => {
    setContactRole(role);
    setContactsPage(1);
  };

  // Select a user from contacts
  const selectUser = async (user) => {
    setLoading(true);
    setMessage(null);
    setSubInfo(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/subscription-management/user/${user.id}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.error) {
        setMessage({ type: 'error', text: data.message });
      } else {
        setSelectedUser(data.user);
        setSubInfo(data);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load subscription info' });
    } finally {
      setLoading(false);
    }
  };

  const changePlan = async (planId) => {
    if (!selectedUser) return;
    setChanging(true);
    setMessage(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/subscription-management/change`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId: selectedUser.id, planId, ...(durationDays ? { durationDays: parseInt(durationDays) } : {}) }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage({ type: 'error', text: data.message });
      } else {
        setMessage({ type: 'success', text: data.message });
        // Refresh sub info
        selectUser({ id: selectedUser.id });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to change subscription' });
    } finally {
      setChanging(false);
    }
  };

  const formatAmount = (amount, currency) => `${currency} ${(amount / 100).toFixed(2)}`;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Contact List Panel */}
      <div className="lg:w-[340px] flex-shrink-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
        {/* Search & Filter Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => handleContactSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-1">
            {[
              { key: '', label: 'All' },
              { key: 'JOB_SEEKER', label: 'Job Seekers' },
              { key: 'RECRUITER', label: 'Recruiters' },
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => handleRoleChange(r.key)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  contactRole === r.key
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {contactsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={22} className="animate-spin text-teal-500" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-10">
              <UserCircle size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500">No users found</p>
            </div>
          ) : (
            contacts.map((user) => {
              const isSelected = selectedUser?.id === user.id;
              const isRecruiter = user.roles?.includes("RECRUITER");
              return (
                <button
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className={`w-full text-left px-3 py-3 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 transition-colors ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-900/20 border-l-2 border-l-teal-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.firstName?.[0] || '?'}{user.lastName?.[0] || ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-teal-700 dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    isRecruiter
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}>
                    {isRecruiter ? 'Recruiter' : 'Job Seeker'}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex-shrink-0 px-3 py-2.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {contactsTotal} user{contactsTotal !== 1 ? 's' : ''} · Page {contactsPage} of {contactsTotalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setContactsPage((p) => Math.max(1, p - 1))}
              disabled={contactsPage <= 1}
              className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setContactsPage((p) => Math.min(contactsTotalPages, p + 1))}
              disabled={contactsPage >= contactsTotalPages}
              className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Plan Management Panel */}
      <div className="flex-1 min-w-0">
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-teal-500" />
          </div>
        )}

        {/* No user selected */}
        {!selectedUser && !loading && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center py-20">
            <UserCircle size={56} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Select a user to manage their plan</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Browse the contact list or search by name/email</p>
          </div>
        )}

        {/* Subscription Info */}
        {subInfo && selectedUser && !loading && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                  {selectedUser.name?.split(' ').map(n => n[0]).join('') || '?'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedUser.name}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                selectedUser.userType === 'RECRUITER'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              }`}>
                {selectedUser.userType === 'RECRUITER' ? 'Recruiter' : 'Job Seeker'}
              </span>
            </div>

            {/* Current plan */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Plan</p>
              {subInfo.currentSubscription ? (
                <div>
                  <p className="text-lg font-bold text-teal-500 flex items-center gap-2">
                    <Crown size={18} />
                    {subInfo.currentSubscription.planName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatAmount(subInfo.currentSubscription.amount, subInfo.currentSubscription.currency)} —
                    Status: <span className="font-medium">{subInfo.currentSubscription.status}</span>
                  </p>
                  {subInfo.currentSubscription.expiresAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Expires: {new Date(subInfo.currentSubscription.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No active subscription</p>
              )}
            </div>

            {/* Duration selector */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock size={12} /> Subscription Duration
              </p>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full sm:w-64 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              >
                <option value="">Default (based on plan interval)</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days (1 month)</option>
                <option value="60">60 days (2 months)</option>
                <option value="90">90 days (3 months)</option>
                <option value="180">180 days (6 months)</option>
                <option value="365">365 days (1 year)</option>
              </select>
            </div>

            {/* Available plans */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Change To</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subInfo.availablePlans.map((plan) => {
                  const isCurrent = subInfo.currentSubscription?.planId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => !isCurrent && changePlan(plan.id)}
                      disabled={isCurrent || changing}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        isCurrent
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 cursor-default'
                          : 'border-gray-200 dark:border-gray-700 hover:border-teal-400 cursor-pointer'
                      } ${changing ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-gray-900 dark:text-white">{plan.name}</p>
                        {isCurrent && <span className="text-xs bg-teal-500 text-white px-2 py-0.5 rounded-full">Current</span>}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {formatAmount(plan.amount, plan.currency)} / {plan.interval === 'YEAR' ? 'year' : plan.interval === 'HALF_YEAR' ? '6 months' : plan.interval === 'QUARTER' ? '3 months' : 'month'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────
const SubscriptionManagement = () => {
  const [activeTab, setActiveTab] = useState('packages');

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ArrowUpDown size={24} className="text-teal-500" />
          Subscription Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage subscription packages and user plans
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'packages'
              ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Package size={16} />
          Packages
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Crown size={16} />
          User Plans
        </button>
      </div>

      {activeTab === 'packages' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Subscription Packages</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Update package names and monthly pricing for Silver, Gold, and Platinum tiers
            </p>
          </div>
          <PackageManagement />
        </div>
      )}

      {activeTab === 'users' && <UserPlanManagement />}
    </div>
  );
};

export default SubscriptionManagement;
