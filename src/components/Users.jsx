import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Filter,
  UserCheck,
  Mail,
  Phone,
  Building2,
  Globe,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  CheckSquare,
  Loader2,
  UserX,
  ShieldOff,
  ShieldCheck,
  Users as UsersIcon,
  Briefcase,
  X,
  FileText,
  PauseCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { BASE_URL } from "../BaseUrl";
import Modal from "./Modal";
import Pagination from "./Pagination";
import successMessage from "../utilities/successMessage";
import ErrorMessage from "../utilities/ErrorMessage";

const ITEMS_PER_PAGE = 20;

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState({ total: 0, jobSeekers: 0, recruiters: 0, pendingRecruiters: 0, activeRecruiters: 0, suspended: 0 });

  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToApprove, setUserToApprove] = useState(null);
  const [userToReject, setUserToReject] = useState(null);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "" });
  const [approvalReason, setApprovalReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Recruiter jobs state
  const [recruiterJobs, setRecruiterJobs] = useState([]);
  const [recruiterJobsLoading, setRecruiterJobsLoading] = useState(false);
  const [recruiterJobsMeta, setRecruiterJobsMeta] = useState({ total: 0, totalPages: 0 });
  const [recruiterJobsPage, setRecruiterJobsPage] = useState(1);
  const [recruiterJobsStatusFilter, setRecruiterJobsStatusFilter] = useState("");
  const [viewingRecruiterJob, setViewingRecruiterJob] = useState(null);
  const [editingRecruiterJob, setEditingRecruiterJob] = useState(null);
  const [recruiterJobEditForm, setRecruiterJobEditForm] = useState({});
  const [deletingRecruiterJob, setDeletingRecruiterJob] = useState(null);

  const searchTimerRef = useRef(null);

  const JOB_STATUS_CONFIG = {
    PUBLISHED: { label: "Published", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
    DRAFT: { label: "Draft", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" },
    CLOSED: { label: "Closed", color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400" },
    SUSPENDED: { label: "Suspended", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  };

  const EMPLOYMENT_TYPES = {
    FULL_TIME: "Full Time", PART_TIME: "Part Time", CONTRACT: "Contract", INTERNSHIP: "Internship", TEMPORARY: "Temporary",
  };

  const getToken = () => {
    try {
      return JSON.parse(sessionStorage.getItem("accessToken"));
    } catch {
      return sessionStorage.getItem("accessToken");
    }
  };

  // Fetch users with server-side pagination + filters
  const fetchUsers = useCallback(async (pageNum, search, role, status) => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams({ page: pageNum, limit: ITEMS_PER_PAGE });
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      if (status) params.set("status", status);

      const response = await fetch(`${BASE_URL}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") {
        setUsers(result.data);
        setMeta(result.meta);
      }
    } catch {
      ErrorMessage("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch(`${BASE_URL}/admin/users/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") setStats(result.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUsers(page, searchTerm, roleFilter, statusFilter);
  }, [page, searchTerm, roleFilter, statusFilter, fetchUsers]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Debounced search
  const handleSearchInput = (value) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchTerm(value);
      setPage(1);
    }, 300);
  };

  const refresh = () => {
    fetchUsers(page, searchTerm, roleFilter, statusFilter);
    fetchStats();
  };

  // Edit user
  const openEditModal = (user) => {
    setUserToEdit(user);
    setEditForm({ firstName: user.firstName || "", lastName: user.lastName || "", email: user.email || "" });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!userToEdit) return;
    try {
      setProcessing(true);
      const token = getToken();
      const response = await fetch(`${BASE_URL}/admin/users/${userToEdit.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") {
        successMessage("User updated successfully");
        setShowEditModal(false);
        setUserToEdit(null);
        refresh();
      } else {
        ErrorMessage(result?.message || "Update failed");
      }
    } catch {
      ErrorMessage("Failed to update user");
    } finally {
      setProcessing(false);
    }
  };

  // Delete user
  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      setProcessing(true);
      const token = getToken();
      const response = await fetch(`${BASE_URL}/admin/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") {
        successMessage("User deleted");
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        setSelectedUser(null);
        refresh();
      } else {
        ErrorMessage(result?.message || "Delete failed");
      }
    } catch {
      ErrorMessage("Failed to delete user");
    } finally {
      setProcessing(false);
    }
  };

  // Approve recruiter
  const approveRecruiter = async () => {
    if (!userToApprove) return;
    try {
      setProcessing(true);
      const response = await fetch(`${BASE_URL}/admin/recruiter/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ recruiterId: userToApprove.recruiterProfile.id, reason: approvalReason }),
      });
      const data = await response.json();
      if (response.ok) {
        successMessage(data?.message || "Recruiter approved");
        setShowApprovalConfirm(false);
        setUserToApprove(null);
        setApprovalReason("");
        setSelectedUser(null);
        refresh();
      } else {
        ErrorMessage(data?.message || "Failed to approve");
      }
    } catch {
      ErrorMessage("Error approving recruiter");
    } finally {
      setProcessing(false);
    }
  };

  // Reject recruiter
  const rejectRecruiter = async () => {
    if (!userToReject) return;
    try {
      setProcessing(true);
      const response = await fetch(`${BASE_URL}/admin/recruiter/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ recruiterId: userToReject.recruiterProfile.id, reason: rejectionReason }),
      });
      const data = await response.json();
      if (response.ok) {
        successMessage(data?.message || "Recruiter rejected");
        setShowRejectConfirm(false);
        setUserToReject(null);
        setRejectionReason("");
        setSelectedUser(null);
        refresh();
      } else {
        ErrorMessage(data?.message || "Failed to reject");
      }
    } catch {
      ErrorMessage("Error rejecting recruiter");
    } finally {
      setProcessing(false);
    }
  };

  // Toggle active status
  const toggleUserActive = async () => {
    if (!userToDeactivate) return;
    const newActive = userToDeactivate.isActive === false;
    try {
      setProcessing(true);
      const response = await fetch(`${BASE_URL}/admin/users/${userToDeactivate.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ isActive: newActive }),
      });
      const data = await response.json();
      if (response.ok) {
        successMessage(data?.message || `User ${newActive ? "activated" : "suspended"}`);
        setShowDeactivateConfirm(false);
        setUserToDeactivate(null);
        setSelectedUser(null);
        refresh();
      } else {
        ErrorMessage(data?.message || "Failed");
      }
    } catch {
      ErrorMessage("Error updating user status");
    } finally {
      setProcessing(false);
    }
  };

  // ── Recruiter Jobs Functions ──
  const fetchRecruiterJobs = async (recruiterProfileId, pageNum = 1, status = "") => {
    setRecruiterJobsLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({ page: pageNum, limit: 10, recruiterId: recruiterProfileId });
      if (status) params.set("status", status);
      const res = await fetch(`${BASE_URL}/admin/jobs?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setRecruiterJobs(data.data || []);
        setRecruiterJobsMeta(data.meta || { total: 0, totalPages: 0 });
      }
    } catch {
      setRecruiterJobs([]);
    } finally {
      setRecruiterJobsLoading(false);
    }
  };

  const handleRecruiterJobStatusChange = async (jobId, newStatus) => {
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/admin/jobs/${jobId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        successMessage(`Job ${newStatus.toLowerCase()}`);
        if (selectedUser?.recruiterProfile?.id) fetchRecruiterJobs(selectedUser.recruiterProfile.id, recruiterJobsPage, recruiterJobsStatusFilter);
      } else {
        ErrorMessage(data.message || "Failed to update job");
      }
    } catch {
      ErrorMessage("Failed to update job status");
    }
  };

  const handleViewRecruiterJob = async (jobId) => {
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/admin/jobs/${jobId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === "SUCCESS") setViewingRecruiterJob(data.data);
    } catch {
      ErrorMessage("Failed to load job details");
    }
  };

  const handleEditRecruiterJob = async (jobId) => {
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/admin/jobs/${jobId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        const j = data.data;
        setRecruiterJobEditForm({
          id: j.id, title: j.title || "", status: j.status || "DRAFT",
          employmentType: j.employmentType || "FULL_TIME", locationName: j.locationName || "",
          isRemote: j.isRemote || false, minSalary: j.minSalary || "", maxSalary: j.maxSalary || "",
          currency: j.currency || "AED", vacancies: j.vacancies || 1,
        });
        setEditingRecruiterJob(j);
      }
    } catch {
      ErrorMessage("Failed to load job details");
    }
  };

  const handleSaveRecruiterJobEdit = async () => {
    try {
      setProcessing(true);
      const token = getToken();
      const body = {
        title: recruiterJobEditForm.title, status: recruiterJobEditForm.status,
        employmentType: recruiterJobEditForm.employmentType, locationName: recruiterJobEditForm.locationName,
        isRemote: recruiterJobEditForm.isRemote, vacancies: parseInt(recruiterJobEditForm.vacancies) || 1,
      };
      if (recruiterJobEditForm.minSalary !== "") body.minSalary = parseInt(recruiterJobEditForm.minSalary);
      if (recruiterJobEditForm.maxSalary !== "") body.maxSalary = parseInt(recruiterJobEditForm.maxSalary);
      if (recruiterJobEditForm.currency) body.currency = recruiterJobEditForm.currency;

      const res = await fetch(`${BASE_URL}/admin/jobs/${recruiterJobEditForm.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        successMessage("Job updated");
        setEditingRecruiterJob(null);
        if (selectedUser?.recruiterProfile?.id) fetchRecruiterJobs(selectedUser.recruiterProfile.id, recruiterJobsPage, recruiterJobsStatusFilter);
      } else {
        ErrorMessage(data.message || "Update failed");
      }
    } catch {
      ErrorMessage("Failed to update job");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteRecruiterJob = async () => {
    if (!deletingRecruiterJob) return;
    try {
      setProcessing(true);
      const token = getToken();
      const res = await fetch(`${BASE_URL}/admin/jobs/${deletingRecruiterJob.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        successMessage("Job deleted");
        setDeletingRecruiterJob(null);
        if (selectedUser?.recruiterProfile?.id) fetchRecruiterJobs(selectedUser.recruiterProfile.id, recruiterJobsPage, recruiterJobsStatusFilter);
      } else {
        ErrorMessage(data.message || "Delete failed");
      }
    } catch {
      ErrorMessage("Failed to delete job");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", icon: CheckCircle },
      PENDING: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", icon: AlertCircle },
      DEACTIVATED: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: XCircle },
      SUSPENDED: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: XCircle },
    };
    const badge = badges[status] || badges.DEACTIVATED;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={12} /> {status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const colors = {
      RECRUITER: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      ADMIN: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
      JOB_SEEKER: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400"}`}>
        {role === "JOB_SEEKER" ? "Job Seeker" : role === "RECRUITER" ? "Recruiter" : role}
      </span>
    );
  };

  const hasActiveFilters = roleFilter || statusFilter || searchTerm;
  const showingFrom = meta.total > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0;
  const showingTo = Math.min(page * ITEMS_PER_PAGE, meta.total);

  return (
    <div className="max-w-[90rem] mx-auto py-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage users, approve recruiters, and control access</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Users", value: stats.total, icon: UsersIcon, color: "blue" },
          { label: "Job Seekers", value: stats.jobSeekers, icon: UserCheck, color: "emerald" },
          { label: "Recruiters", value: stats.recruiters, icon: Building2, color: "purple" },
          { label: "Pending", value: stats.pendingRecruiters, icon: AlertCircle, color: "yellow" },
          { label: "Active Recruiters", value: stats.activeRecruiters, icon: CheckCircle, color: "green" },
          { label: "Suspended", value: stats.suspended, icon: ShieldOff, color: "red" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                <stat.icon size={18} className={`text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 min-w-[140px]"
          >
            <option value="">All Roles</option>
            <option value="JOB_SEEKER">Job Seekers</option>
            <option value="RECRUITER">Recruiters</option>
            <option value="ADMIN">Admins</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 min-w-[140px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending Recruiters</option>
          </select>
          {hasActiveFilters && (
            <button
              onClick={() => { setRoleFilter(""); setStatusFilter(""); setSearchInput(""); setSearchTerm(""); setPage(1); }}
              className="flex items-center gap-1 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-teal-500" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <UsersIcon size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className={`bg-white dark:bg-gray-900 rounded-xl border p-4 hover:shadow-md transition-all ${
                user.isActive === false ? "border-red-200 dark:border-red-800/50 opacity-80" : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Avatar + Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {user.firstName} {user.lastName}
                      </h3>
                      {user.roles.map((role, i) => (
                        <span key={i}>{getRoleBadge(role)}</span>
                      ))}
                      {user.isActive === false && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Suspended</span>
                      )}
                      {user.recruiterProfile?.status === "PENDING" && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Pending Approval</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><Mail size={12} />{user.email}</span>
                      {user.phoneNumber && (
                        <span className="flex items-center gap-1"><Phone size={12} />{user.countryCode} {user.phoneNumber}</span>
                      )}
                      {user.recruiterProfile?.company && (
                        <span className="flex items-center gap-1"><Building2 size={12} />{user.recruiterProfile.company.name}</span>
                      )}
                      <span className="flex items-center gap-1"><Clock size={12} />{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => {
                    setSelectedUser(user);
                    if (user.roles.includes("RECRUITER") && user.recruiterProfile?.id) {
                      setRecruiterJobsPage(1);
                      setRecruiterJobsStatusFilter("");
                      fetchRecruiterJobs(user.recruiterProfile.id, 1, "");
                    }
                  }} className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View details">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => openEditModal(user)} className="p-2 rounded-lg text-gray-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors" title="Edit">
                    <Edit2 size={16} />
                  </button>
                  {/* Recruiter approve/reject */}
                  {user.recruiterProfile?.status === "PENDING" && (
                    <>
                      <button onClick={() => { setUserToApprove(user); setShowApprovalConfirm(true); }} className="p-2 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Approve">
                        <CheckCircle size={16} />
                      </button>
                      <button onClick={() => { setUserToReject(user); setShowRejectConfirm(true); }} className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Reject">
                        <XCircle size={16} />
                      </button>
                    </>
                  )}
                  {/* Suspend / Activate */}
                  {!user.roles.includes("ADMIN") && (
                    <button
                      onClick={() => { setUserToDeactivate(user); setShowDeactivateConfirm(true); }}
                      className={`p-2 rounded-lg transition-colors ${
                        user.isActive === false
                          ? "text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          : "text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                      }`}
                      title={user.isActive === false ? "Activate" : "Suspend"}
                    >
                      {user.isActive === false ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
                    </button>
                  )}
                  {/* Delete */}
                  {!user.roles.includes("ADMIN") && (
                    <button onClick={() => { setUserToDelete(user); setShowDeleteConfirm(true); }} className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            totalItems={meta.total}
            itemsPerPage={ITEMS_PER_PAGE}
            showingFrom={showingFrom}
            showingTo={showingTo}
          />
        </div>
      )}

      {/* View Detail Modal */}
      <Modal isOpen={selectedUser !== null} onClose={() => { setSelectedUser(null); setRecruiterJobs([]); setRecruiterJobsMeta({ total: 0, totalPages: 0 }); setRecruiterJobsPage(1); setRecruiterJobsStatusFilter(""); }} title="User Details" size="xl">
        {selectedUser && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Full Name", value: `${selectedUser.firstName} ${selectedUser.lastName}` },
                { label: "Email", value: selectedUser.email },
                { label: "Phone", value: `${selectedUser.countryCode || ""} ${selectedUser.phoneNumber || "—"}` },
                { label: "Created", value: new Date(selectedUser.createdAt).toLocaleDateString() },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Roles + Status */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedUser.roles.map((role, i) => <span key={i}>{getRoleBadge(role)}</span>)}
              {selectedUser.isActive === false ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Suspended</span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Active</span>
              )}
              {selectedUser.recruiterProfile?.status && getStatusBadge(selectedUser.recruiterProfile.status)}
            </div>

            {/* Company Info */}
            {selectedUser.recruiterProfile?.company && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Company</h4>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2"><Building2 size={14} className="text-gray-400" />{selectedUser.recruiterProfile.company.name}</p>
                  {selectedUser.recruiterProfile.company.website && (
                    <p className="flex items-center gap-2"><Globe size={14} className="text-gray-400" />
                      <a href={selectedUser.recruiterProfile.company.website} target="_blank" rel="noopener noreferrer" className="text-teal-500 hover:underline">{selectedUser.recruiterProfile.company.website}</a>
                    </p>
                  )}
                  {selectedUser.recruiterProfile.company.address && (
                    <p className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" />{selectedUser.recruiterProfile.company.address}</p>
                  )}
                  {selectedUser.recruiterProfile.company.country && (
                    <p className="flex items-center gap-2"><Globe size={14} className="text-gray-400" />{selectedUser.recruiterProfile.company.country}</p>
                  )}
                </div>
              </div>
            )}

            {/* Status History */}
            {selectedUser.recruiterProfile?.statusLogs?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Status History</h4>
                <div className="space-y-2">
                  {selectedUser.recruiterProfile.statusLogs.map((log, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-900 dark:text-white">
                          <span className="font-medium">{log.oldStatus}</span> → <span className="font-medium">{log.newStatus}</span>
                        </p>
                        {log.reason && <p className="text-xs text-gray-500">{log.reason}</p>}
                        <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recruiter Jobs */}
            {selectedUser.roles.includes("RECRUITER") && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase size={14} /> Posted Jobs
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({recruiterJobsMeta.total} total)</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    {["", "PUBLISHED", "DRAFT", "SUSPENDED", "CLOSED"].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setRecruiterJobsStatusFilter(s);
                          setRecruiterJobsPage(1);
                          fetchRecruiterJobs(selectedUser.recruiterProfile.id, 1, s);
                        }}
                        className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                          recruiterJobsStatusFilter === s
                            ? "bg-teal-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {s || "All"}
                      </button>
                    ))}
                  </div>
                </div>

                {recruiterJobsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-teal-500" /></div>
                ) : recruiterJobs.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Briefcase size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No jobs found</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {recruiterJobs.map((job) => {
                        const statusConf = JOB_STATUS_CONFIG[job.status] || { label: job.status, color: "bg-gray-100 text-gray-600" };
                        return (
                          <div key={job.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{job.title}</p>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConf.color}`}>{statusConf.label}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                  {job.company?.name && (
                                    <span className="flex items-center gap-1"><Building2 size={11} />{job.company.name}</span>
                                  )}
                                  <span className="flex items-center gap-1"><FileText size={11} />{job._count?.jobApplications || 0} applicants</span>
                                  <span className="flex items-center gap-1"><Bookmark size={11} />{job._count?.saves || 0} saves</span>
                                  {job.locationName && (
                                    <span className="flex items-center gap-1"><MapPin size={11} />{job.locationName}</span>
                                  )}
                                  <span className="flex items-center gap-1"><Clock size={11} />{new Date(job.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => handleViewRecruiterJob(job.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View details">
                                  <Eye size={14} />
                                </button>
                                <button onClick={() => handleEditRecruiterJob(job.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors" title="Edit">
                                  <Edit2 size={14} />
                                </button>
                                {job.status !== "PUBLISHED" && (
                                  <button onClick={() => handleRecruiterJobStatusChange(job.id, "PUBLISHED")} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Publish">
                                    <CheckCircle size={14} />
                                  </button>
                                )}
                                {job.status === "PUBLISHED" && (
                                  <button onClick={() => handleRecruiterJobStatusChange(job.id, "SUSPENDED")} className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors" title="Suspend">
                                    <PauseCircle size={14} />
                                  </button>
                                )}
                                {job.status !== "CLOSED" && (
                                  <button onClick={() => handleRecruiterJobStatusChange(job.id, "CLOSED")} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Close">
                                    <XCircle size={14} />
                                  </button>
                                )}
                                <button onClick={() => setDeletingRecruiterJob(job)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Recruiter Jobs Pagination */}
                    {recruiterJobsMeta.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Page {recruiterJobsPage} of {recruiterJobsMeta.totalPages} ({recruiterJobsMeta.total} jobs)
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { const p = recruiterJobsPage - 1; setRecruiterJobsPage(p); fetchRecruiterJobs(selectedUser.recruiterProfile.id, p, recruiterJobsStatusFilter); }}
                            disabled={recruiterJobsPage <= 1}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            onClick={() => { const p = recruiterJobsPage + 1; setRecruiterJobsPage(p); fetchRecruiterJobs(selectedUser.recruiterProfile.id, p, recruiterJobsStatusFilter); }}
                            disabled={recruiterJobsPage >= recruiterJobsMeta.totalPages}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => { openEditModal(selectedUser); setSelectedUser(null); }} className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 text-sm font-medium flex items-center gap-2">
                <Edit2 size={14} /> Edit User
              </button>
              {selectedUser.recruiterProfile?.status === "PENDING" && (
                <>
                  <button onClick={() => { setUserToApprove(selectedUser); setShowApprovalConfirm(true); setSelectedUser(null); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2">
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button onClick={() => { setUserToReject(selectedUser); setShowRejectConfirm(true); setSelectedUser(null); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2">
                    <XCircle size={14} /> Reject
                  </button>
                </>
              )}
              {!selectedUser.roles.includes("ADMIN") && (
                <>
                  <button onClick={() => { setUserToDeactivate(selectedUser); setShowDeactivateConfirm(true); setSelectedUser(null); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                      selectedUser.isActive === false ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300"
                    }`}>
                    {selectedUser.isActive === false ? <><ShieldCheck size={14} /> Activate</> : <><ShieldOff size={14} /> Suspend</>}
                  </button>
                  <button onClick={() => { setUserToDelete(selectedUser); setShowDeleteConfirm(true); setSelectedUser(null); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2">
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
              <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
              <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">Cancel</button>
            <button onClick={handleSaveEdit} disabled={processing} className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
              {processing && <Loader2 size={16} className="animate-spin" />} Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete User" size="sm">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Are you sure you want to delete</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">"{userToDelete?.firstName} {userToDelete?.lastName}"?</p>
          <p className="text-xs text-red-500 mb-6">This will permanently delete the user, their profile, applications, and all related data.</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Cancel</button>
            <button onClick={handleDelete} disabled={processing} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
              {processing && <Loader2 size={16} className="animate-spin" />} Delete User
            </button>
          </div>
        </div>
      </Modal>

      {/* Approval Confirmation */}
      <Modal isOpen={showApprovalConfirm} onClose={() => { setShowApprovalConfirm(false); setUserToApprove(null); setApprovalReason(""); }} title="Approve Recruiter" size="md">
        {userToApprove && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Approve <span className="font-semibold text-gray-900 dark:text-white">{userToApprove.firstName} {userToApprove.lastName}</span> as a recruiter?
            </p>
            {userToApprove.recruiterProfile?.company && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500">Company</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{userToApprove.recruiterProfile.company.name}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Approval Reason</label>
              <input type="text" value={approvalReason} onChange={(e) => setApprovalReason(e.target.value)} placeholder="e.g., Verified credentials"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowApprovalConfirm(false); setUserToApprove(null); }} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={approveRecruiter} disabled={processing || !approvalReason.trim()} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2">
                {processing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Approve
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Confirmation */}
      <Modal isOpen={showRejectConfirm} onClose={() => { setShowRejectConfirm(false); setUserToReject(null); setRejectionReason(""); }} title="Reject Recruiter" size="md">
        {userToReject && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Reject <span className="font-semibold text-gray-900 dark:text-white">{userToReject.firstName} {userToReject.lastName}</span>'s recruiter application?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rejection Reason *</label>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} placeholder="e.g., Incomplete profile"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowRejectConfirm(false); setUserToReject(null); }} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={rejectRecruiter} disabled={processing || !rejectionReason.trim()} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2">
                {processing ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Reject
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deactivate/Activate Confirmation */}
      <Modal isOpen={showDeactivateConfirm} onClose={() => { setShowDeactivateConfirm(false); setUserToDeactivate(null); }} title={userToDeactivate?.isActive === false ? "Reactivate User" : "Suspend User"} size="sm">
        {userToDeactivate && (
          <div className="text-center py-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
              userToDeactivate.isActive === false ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
            }`}>
              {userToDeactivate.isActive === false ? <ShieldCheck size={24} className="text-green-600" /> : <UserX size={24} className="text-red-600" />}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {userToDeactivate.isActive === false ? "Reactivate" : "Suspend"}{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{userToDeactivate.firstName} {userToDeactivate.lastName}</span>?
            </p>
            {userToDeactivate.isActive !== false && (
              <p className="text-xs text-red-500 mb-4">The user will lose access to the platform until reactivated.</p>
            )}
            <div className="flex justify-center gap-3">
              <button onClick={() => { setShowDeactivateConfirm(false); setUserToDeactivate(null); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={toggleUserActive} disabled={processing}
                className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 text-sm font-medium flex items-center gap-2 ${
                  userToDeactivate.isActive === false ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}>
                {processing && <Loader2 size={16} className="animate-spin" />}
                {userToDeactivate.isActive === false ? "Reactivate" : "Suspend"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Recruiter Job Modal */}
      <Modal isOpen={viewingRecruiterJob !== null} onClose={() => setViewingRecruiterJob(null)} title="Job Details" size="lg">
        {viewingRecruiterJob && (() => {
          const job = viewingRecruiterJob;
          const statusConf = JOB_STATUS_CONFIG[job.status] || { label: job.status, color: "bg-gray-100 text-gray-600" };
          return (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Title + Status */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{job.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusConf.color}`}>{statusConf.label}</span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "Employment", value: EMPLOYMENT_TYPES[job.employmentType] || job.employmentType },
                  { label: "Location", value: job.locationName || "—" },
                  { label: "Remote", value: job.isRemote ? "Yes" : "No" },
                  { label: "Vacancies", value: job.vacancies || "—" },
                  { label: "Posted", value: new Date(job.createdAt).toLocaleDateString() },
                  { label: "Updated", value: new Date(job.updatedAt).toLocaleDateString() },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Salary */}
              {(job.minSalary || job.maxSalary) && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Salary Range</p>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {job.currency || "AED"} {job.minSalary?.toLocaleString() || "—"} – {job.maxSalary?.toLocaleString() || "—"}
                  </p>
                </div>
              )}

              {/* Application Breakdown */}
              {job.applicationBreakdown && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Applications</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(job.applicationBreakdown).map(([status, count]) => (
                      <span key={status} className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {status}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Industries & Skills */}
              {job.industries?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Industries</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.industries.map((ind) => (
                      <span key={ind.id || ind.name} className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{ind.name}</span>
                    ))}
                  </div>
                </div>
              )}
              {job.skills?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill) => (
                      <span key={skill.id || skill.name} className="px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">{skill.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {job.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Description</p>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: job.description }} />
                </div>
              )}

              {/* Close */}
              <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setViewingRecruiterJob(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Close</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Edit Recruiter Job Modal */}
      <Modal isOpen={editingRecruiterJob !== null} onClose={() => setEditingRecruiterJob(null)} title="Edit Job" size="md">
        {editingRecruiterJob && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input type="text" value={recruiterJobEditForm.title || ""} onChange={(e) => setRecruiterJobEditForm({ ...recruiterJobEditForm, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select value={recruiterJobEditForm.status || ""} onChange={(e) => setRecruiterJobEditForm({ ...recruiterJobEditForm, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employment Type</label>
                <select value={recruiterJobEditForm.employmentType || ""} onChange={(e) => setRecruiterJobEditForm({ ...recruiterJobEditForm, employmentType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500">
                  {Object.entries(EMPLOYMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input type="text" value={recruiterJobEditForm.locationName || ""} onChange={(e) => setRecruiterJobEditForm({ ...recruiterJobEditForm, locationName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={recruiterJobEditForm.isRemote || false} onChange={(e) => setRecruiterJobEditForm({ ...recruiterJobEditForm, isRemote: e.target.checked })}
                    className="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500" />
                  Remote Position
                </label>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Salary</label>
                <input type="number" value={recruiterJobEditForm.minSalary || ""} onChange={(e) => setRecruiterJobEditForm({ ...recruiterJobEditForm, minSalary: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Salary</label>
                <input type="number" value={recruiterJobEditForm.maxSalary || ""} onChange={(e) => setRecruiterJobEditForm({ ...recruiterJobEditForm, maxSalary: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vacancies</label>
                <input type="number" value={recruiterJobEditForm.vacancies || ""} onChange={(e) => setRecruiterJobEditForm({ ...recruiterJobEditForm, vacancies: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setEditingRecruiterJob(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">Cancel</button>
              <button onClick={handleSaveRecruiterJobEdit} disabled={processing} className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
                {processing && <Loader2 size={16} className="animate-spin" />} Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Recruiter Job Confirmation */}
      <Modal isOpen={deletingRecruiterJob !== null} onClose={() => setDeletingRecruiterJob(null)} title="Delete Job" size="sm">
        {deletingRecruiterJob && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Are you sure you want to delete</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">"{deletingRecruiterJob.title}"?</p>
            <p className="text-xs text-red-500 mb-6">This will permanently delete the job, all applications, saves, and related data.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeletingRecruiterJob(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={handleDeleteRecruiterJob} disabled={processing} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
                {processing && <Loader2 size={16} className="animate-spin" />} Delete Job
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Users;
