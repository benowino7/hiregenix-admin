import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Briefcase,
  Loader2,
  Eye,
  Edit2,
  Trash2,
  Users,
  Bookmark,
  MapPin,
  Building2,
  Filter,
  X,
  ChevronDown,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  FileText,
  TrendingUp,
  AlertCircle,
  UserCheck,
  Send,
  Ban,
  Plus,
  Upload,
} from "lucide-react";
import { BASE_URL } from "../BaseUrl";
import Modal from "./Modal";
import Pagination from "./Pagination";
import ErrorMessage from "../utilities/ErrorMessage";
import successMessage from "../utilities/successMessage";

const ITEMS_PER_PAGE = 20;

const STATUS_CONFIG = {
  PUBLISHED: { label: "Published", color: "green", icon: CheckCircle },
  DRAFT: { label: "Draft", color: "yellow", icon: FileText },
  CLOSED: { label: "Closed", color: "gray", icon: XCircle },
  SUSPENDED: { label: "Suspended", color: "red", icon: PauseCircle },
};

const EMPLOYMENT_TYPES = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  TEMPORARY: "Temporary",
};

function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, closed: 0, suspended: 0, totalApplications: 0 });

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [recruiterFilter, setRecruiterFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter options
  const [industries, setIndustries] = useState([]);
  const [recruiters, setRecruiters] = useState([]);

  // View/Edit modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Delete all closed
  const [showDeleteClosedConfirm, setShowDeleteClosedConfirm] = useState(false);
  const [deleteClosedStep, setDeleteClosedStep] = useState(1);
  const [deleteClosedProcessing, setDeleteClosedProcessing] = useState(false);
  const [deleteClosedConfirmText, setDeleteClosedConfirmText] = useState("");

  // Applications modal
  const [showAppsModal, setShowAppsModal] = useState(false);
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsMeta, setAppsMeta] = useState({ total: 0, totalPages: 0 });
  const [appsPage, setAppsPage] = useState(1);
  const [appsJobTitle, setAppsJobTitle] = useState("");

  // Edit form
  const [editForm, setEditForm] = useState({});

  // Create job
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "", description: "", employmentType: "FULL_TIME", experienceLevel: "",
    locationName: "", isRemote: false, minSalary: "", maxSalary: "", currency: "AED",
    showSalary: false, vacancies: 1, industries: [], skills: [],
  });
  const [createProcessing, setCreateProcessing] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableIndustries, setAvailableIndustries] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [industrySearch, setIndustrySearch] = useState("");

  // AI PDF upload
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfParsing, setPdfParsing] = useState(false);

  const searchTimerRef = useRef(null);

  const getToken = () => {
    try {
      return JSON.parse(sessionStorage.getItem("accessToken"));
    } catch {
      return sessionStorage.getItem("accessToken");
    }
  };

  // Fetch jobs
  const fetchJobs = useCallback(async (pageNum, search, status, industryId, recruiterId) => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams({ page: pageNum, limit: ITEMS_PER_PAGE });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (industryId) params.set("industryId", industryId);
      if (recruiterId) params.set("recruiterId", recruiterId);

      const response = await fetch(`${BASE_URL}/admin/jobs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") {
        setJobs(result.data);
        setMeta(result.meta);
      }
    } catch (err) {
      ErrorMessage("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch(`${BASE_URL}/admin/jobs/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") setStats(result.data);
    } catch {}
  }, []);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const token = getToken();
      const [indRes, recRes] = await Promise.all([
        fetch(`${BASE_URL}/admin/industries?limit=100&page=1`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE_URL}/admin/jobs/recruiters`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const indData = await indRes.json();
      const recData = await recRes.json();
      if (indData?.status === "SUCCESS") setIndustries(indData.data);
      if (recData?.status === "SUCCESS") setRecruiters(recData.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchJobs(page, searchTerm, statusFilter, industryFilter, recruiterFilter);
  }, [page, searchTerm, statusFilter, industryFilter, recruiterFilter, fetchJobs]);

  useEffect(() => {
    fetchStats();
    fetchFilterOptions();
  }, [fetchStats, fetchFilterOptions]);

  // Debounced search
  const handleSearchInput = (value) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchTerm(value);
      setPage(1);
    }, 300);
  };

  // View job details
  const handleView = async (jobId) => {
    try {
      const token = getToken();
      const response = await fetch(`${BASE_URL}/admin/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") {
        setSelectedJob(result.data);
        setShowViewModal(true);
      }
    } catch {
      ErrorMessage("Failed to load job details");
    }
  };

  // Open edit modal
  const handleEdit = async (jobId) => {
    try {
      const token = getToken();
      const response = await fetch(`${BASE_URL}/admin/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") {
        const j = result.data;
        setEditForm({
          id: j.id,
          title: j.title || "",
          description: j.description || "",
          status: j.status || "DRAFT",
          employmentType: j.employmentType || "FULL_TIME",
          locationName: j.locationName || "",
          isRemote: j.isRemote || false,
          minSalary: j.minSalary || "",
          maxSalary: j.maxSalary || "",
          currency: j.currency || "AED",
          vacancies: j.vacancies || 1,
        });
        setShowEditModal(true);
      }
    } catch {
      ErrorMessage("Failed to load job details");
    }
  };

  // Save edit
  const handleSaveEdit = async () => {
    try {
      setProcessing(true);
      const token = getToken();
      const body = {
        title: editForm.title,
        status: editForm.status,
        employmentType: editForm.employmentType,
        locationName: editForm.locationName,
        isRemote: editForm.isRemote,
        vacancies: parseInt(editForm.vacancies) || 1,
      };
      if (editForm.minSalary !== "") body.minSalary = parseInt(editForm.minSalary);
      if (editForm.maxSalary !== "") body.maxSalary = parseInt(editForm.maxSalary);
      if (editForm.currency) body.currency = editForm.currency;

      const response = await fetch(`${BASE_URL}/admin/jobs/${editForm.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") {
        successMessage("Job updated successfully");
        setShowEditModal(false);
        fetchJobs(page, searchTerm, statusFilter, industryFilter, recruiterFilter);
        fetchStats();
      } else {
        ErrorMessage(result?.message || "Update failed");
      }
    } catch {
      ErrorMessage("Failed to update job");
    } finally {
      setProcessing(false);
    }
  };

  // Quick status change
  const handleStatusChange = async (jobId, newStatus) => {
    try {
      const token = getToken();
      const response = await fetch(`${BASE_URL}/admin/jobs/${jobId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") {
        successMessage(`Job ${newStatus.toLowerCase()}`);
        fetchJobs(page, searchTerm, statusFilter, industryFilter, recruiterFilter);
        fetchStats();
      } else {
        ErrorMessage(result?.message || "Status change failed");
      }
    } catch {
      ErrorMessage("Failed to update status");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!jobToDelete) return;
    try {
      setProcessing(true);
      const token = getToken();
      const response = await fetch(`${BASE_URL}/admin/jobs/${jobToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") {
        successMessage("Job deleted");
        setShowDeleteConfirm(false);
        setJobToDelete(null);
        fetchJobs(page, searchTerm, statusFilter, industryFilter, recruiterFilter);
        fetchStats();
      } else {
        ErrorMessage(result?.message || "Delete failed");
      }
    } catch {
      ErrorMessage("Failed to delete job");
    } finally {
      setProcessing(false);
    }
  };

  // View applications
  const handleViewApps = async (jobId, jobTitle, pageNum = 1) => {
    try {
      setAppsLoading(true);
      setAppsJobTitle(jobTitle);
      setAppsPage(pageNum);
      const token = getToken();
      const params = new URLSearchParams({ page: pageNum, limit: 20 });
      const response = await fetch(`${BASE_URL}/admin/jobs/${jobId}/applications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") {
        setApplications(result.data);
        setAppsMeta(result.meta);
        setShowAppsModal(true);
      }
    } catch {
      ErrorMessage("Failed to load applications");
    } finally {
      setAppsLoading(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("");
    setIndustryFilter("");
    setRecruiterFilter("");
    setSearchInput("");
    setSearchTerm("");
    setPage(1);
  };

  // Archive all closed jobs
  const handleDeleteAllClosed = async () => {
    try {
      setDeleteClosedProcessing(true);
      const token = getToken();
      const response = await fetch(`${BASE_URL}/admin/jobs/closed/archive`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") {
        successMessage(result.message || "Closed jobs archived");
        setShowDeleteClosedConfirm(false);
        setDeleteClosedStep(1);
        setDeleteClosedConfirmText("");
        fetchJobs(page, searchTerm, statusFilter, industryFilter, recruiterFilter);
        fetchStats();
      } else {
        ErrorMessage(result?.message || "Failed to archive closed jobs");
      }
    } catch {
      ErrorMessage("Failed to archive closed jobs");
    } finally {
      setDeleteClosedProcessing(false);
    }
  };

  // Fetch skills/industries for create form
  const fetchCreateOptions = async () => {
    try {
      const token = getToken();
      const [skillRes, indRes] = await Promise.all([
        fetch(`${BASE_URL}/admin/skills?limit=200`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE_URL}/admin/industries?limit=200`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const skillData = await skillRes.json();
      const indData = await indRes.json();
      if (skillData?.status === "SUCCESS") setAvailableSkills(skillData.data || []);
      if (indData?.status === "SUCCESS") setAvailableIndustries(indData.data || []);
    } catch {}
  };

  // Create job
  const handleCreateJob = async () => {
    if (!createForm.title || !createForm.description || !createForm.employmentType) {
      ErrorMessage("Title, description, and employment type are required");
      return;
    }
    try {
      setCreateProcessing(true);
      const token = getToken();
      const body = { ...createForm };
      if (body.minSalary) body.minSalary = parseInt(body.minSalary);
      else delete body.minSalary;
      if (body.maxSalary) body.maxSalary = parseInt(body.maxSalary);
      else delete body.maxSalary;
      body.vacancies = parseInt(body.vacancies) || 1;

      const response = await fetch(`${BASE_URL}/admin/jobs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") {
        successMessage("Job created and published under Career Box");
        setShowCreateModal(false);
        setCreateForm({
          title: "", description: "", employmentType: "FULL_TIME", experienceLevel: "",
          locationName: "", isRemote: false, minSalary: "", maxSalary: "", currency: "AED",
          showSalary: false, vacancies: 1, industries: [], skills: [],
        });
        fetchJobs(page, searchTerm, statusFilter, industryFilter, recruiterFilter);
        fetchStats();
      } else {
        ErrorMessage(result?.message || "Failed to create job");
      }
    } catch {
      ErrorMessage("Failed to create job");
    } finally {
      setCreateProcessing(false);
    }
  };

  // AI PDF parse
  const handlePdfUpload = async () => {
    if (!pdfFile) { ErrorMessage("Please select a PDF file"); return; }
    try {
      setPdfParsing(true);
      const token = getToken();
      const formData = new FormData();
      formData.append("file", pdfFile);
      const response = await fetch(`${BASE_URL}/admin/jobs/parse-pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (result?.status === "SUCCESS" && result.data) {
        const d = result.data;
        setCreateForm((prev) => ({
          ...prev,
          title: d.title || prev.title,
          description: d.description || prev.description,
          employmentType: d.employmentType || prev.employmentType,
          experienceLevel: d.experienceLevel || prev.experienceLevel,
          locationName: d.locationName || prev.locationName,
          isRemote: d.isRemote || false,
          minSalary: d.minSalary || "",
          maxSalary: d.maxSalary || "",
          currency: d.currency || "AED",
          vacancies: d.vacancies || 1,
        }));
        setShowPdfModal(false);
        setPdfFile(null);
        setShowCreateModal(true);
        await fetchCreateOptions();
        successMessage("Job details extracted from PDF — review and submit");
      } else {
        ErrorMessage(result?.message || "Failed to parse PDF");
      }
    } catch {
      ErrorMessage("Failed to parse PDF");
    } finally {
      setPdfParsing(false);
    }
  };

  const openCreateModal = async () => {
    setShowCreateModal(true);
    await fetchCreateOptions();
  };

  const filteredAvailableSkills = availableSkills.filter(
    (s) => !createForm.skills.includes(s.id) && s.name.toLowerCase().includes(skillSearch.toLowerCase())
  );
  const filteredAvailableIndustries = availableIndustries.filter(
    (i) => !createForm.industries.includes(i.id) && i.name.toLowerCase().includes(industrySearch.toLowerCase())
  );

  const hasActiveFilters = statusFilter || industryFilter || recruiterFilter || searchTerm;

  const showingFrom = (page - 1) * ITEMS_PER_PAGE + 1;
  const showingTo = Math.min(page * ITEMS_PER_PAGE, meta.total);

  return (
    <div className="max-w-[90rem] mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all recruiter job postings</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            <Upload size={16} />
            AI PDF Upload
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Create Job
          </button>
          {stats.closed > 0 && (
            <button
              onClick={() => { setShowDeleteClosedConfirm(true); setDeleteClosedStep(1); setDeleteClosedConfirmText(""); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium transition-colors"
            >
              <Trash2 size={16} />
              Archive All Closed ({stats.closed})
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Jobs", value: stats.total, icon: Briefcase, color: "blue" },
          { label: "Published", value: stats.published, icon: CheckCircle, color: "green" },
          { label: "Draft", value: stats.draft, icon: FileText, color: "yellow" },
          { label: "Closed", value: stats.closed, icon: XCircle, color: "gray" },
          { label: "Suspended", value: stats.suspended, icon: PauseCircle, color: "red" },
          { label: "Applications", value: stats.totalApplications, icon: Users, color: "purple" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
          >
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

      {/* Search + Filter Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search jobs by title or company..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Status Quick Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 min-w-[140px]"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="CLOSED">Closed</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* Toggle more filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? "border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-900/20"
                : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-teal-500" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            {/* Industry Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Industry</label>
              <select
                value={industryFilter}
                onChange={(e) => { setIndustryFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Industries</option>
                {industries.map((ind) => (
                  <option key={ind.id} value={ind.id}>{ind.name}</option>
                ))}
              </select>
            </div>

            {/* Recruiter Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Recruiter</label>
              <select
                value={recruiterFilter}
                onChange={(e) => { setRecruiterFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Recruiters</option>
                {recruiters.map((rec) => (
                  <option key={rec.id} value={rec.id}>{rec.name} — {rec.company}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-teal-500" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Briefcase size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No jobs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.DRAFT;
            const StatusIcon = statusCfg.icon;
            return (
              <div
                key={job.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                        <Briefcase size={18} className="text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-md">
                            {job.title}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-${statusCfg.color}-100 dark:bg-${statusCfg.color}-900/30 text-${statusCfg.color}-700 dark:text-${statusCfg.color}-400`}>
                            <StatusIcon size={12} />
                            {statusCfg.label}
                          </span>
                          {job.source === "FEED" && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                              Feed
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          {job.company && (
                            <span className="flex items-center gap-1">
                              <Building2 size={12} />
                              {job.company.name}
                            </span>
                          )}
                          {job.locationName && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {job.locationName}
                            </span>
                          )}
                          {job.isRemote && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <Globe size={12} />
                              Remote
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {EMPLOYMENT_TYPES[job.employmentType] || job.employmentType}
                          </span>
                          {job.recruiter && (
                            <span className="flex items-center gap-1">
                              <UserCheck size={12} />
                              {job.recruiter.name}
                            </span>
                          )}
                        </div>
                        {/* Industries */}
                        {job.industries?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {job.industries.map((ind) => (
                              <span key={ind.id} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                {ind.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
                    <button
                      onClick={() => handleViewApps(job.id, job.title)}
                      className="flex items-center gap-1.5 text-sm hover:text-teal-600 transition-colors"
                      title="View applications"
                    >
                      <Users size={16} className="text-blue-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">{job._count?.jobApplications || 0}</span>
                      <span className="text-xs text-gray-400 hidden sm:inline">applicants</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-sm" title="Saves">
                      <Bookmark size={16} className="text-purple-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">{job._count?.saves || 0}</span>
                    </div>
                    <span className="text-xs text-gray-400 hidden md:block whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleView(job.id)}
                      className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="View details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(job.id)}
                      className="p-2 rounded-lg text-gray-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    {/* Quick status actions */}
                    {job.status === "PUBLISHED" && (
                      <button
                        onClick={() => handleStatusChange(job.id, "SUSPENDED")}
                        className="p-2 rounded-lg text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                        title="Suspend"
                      >
                        <PauseCircle size={16} />
                      </button>
                    )}
                    {job.status === "SUSPENDED" && (
                      <button
                        onClick={() => handleStatusChange(job.id, "PUBLISHED")}
                        className="p-2 rounded-lg text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                        title="Republish"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {job.status !== "CLOSED" && (
                      <button
                        onClick={() => handleStatusChange(job.id, "CLOSED")}
                        className="p-2 rounded-lg text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Close job"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => { setJobToDelete(job); setShowDeleteConfirm(true); }}
                      className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Job Details" size="xl">
        {selectedJob && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
            {/* Title + Status */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedJob.title}</h2>
                {(() => {
                  const cfg = STATUS_CONFIG[selectedJob.status] || STATUS_CONFIG.DRAFT;
                  return (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-${cfg.color}-100 dark:bg-${cfg.color}-900/30 text-${cfg.color}-700 dark:text-${cfg.color}-400`}>
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>
              {selectedJob.company && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Building2 size={14} /> {selectedJob.company.name}
                </p>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Type", value: EMPLOYMENT_TYPES[selectedJob.employmentType] || selectedJob.employmentType },
                { label: "Location", value: selectedJob.isRemote ? "Remote" : selectedJob.locationName || "—" },
                { label: "Vacancies", value: selectedJob.vacancies },
                { label: "Max Applicants", value: selectedJob.maxApplicants || "Unlimited" },
                { label: "Source", value: selectedJob.source },
                { label: "Published", value: selectedJob.publishedAt ? new Date(selectedJob.publishedAt).toLocaleDateString() : "—" },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Salary */}
            {(selectedJob.minSalary || selectedJob.maxSalary) && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Salary Range</p>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {selectedJob.currency || "AED"} {selectedJob.minSalary?.toLocaleString() || "—"} – {selectedJob.maxSalary?.toLocaleString() || "—"}
                </p>
              </div>
            )}

            {/* Recruiter */}
            {selectedJob.recruiter && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Recruiter</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedJob.recruiter.name}</p>
                <p className="text-xs text-gray-500">{selectedJob.recruiter.email}</p>
              </div>
            )}

            {/* Application Breakdown */}
            {selectedJob.applicationBreakdown && Object.keys(selectedJob.applicationBreakdown).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Application Breakdown</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedJob.applicationBreakdown).map(([status, count]) => (
                    <span key={status} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {status}: <strong>{count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Industries & Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedJob.industries?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Industries</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.industries.map((ind) => (
                      <span key={ind.id} className="px-2 py-1 rounded-md text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
                        {ind.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedJob.skills?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.skills.map((skill) => (
                      <span key={skill.id} className="px-2 py-1 rounded-md text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {selectedJob.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedJob.description }}
                />
              </div>
            )}

            {/* Total Stats */}
            <div className="flex items-center gap-6 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                <span className="text-sm"><strong>{selectedJob._count?.jobApplications || 0}</strong> applications</span>
              </div>
              <div className="flex items-center gap-2">
                <Bookmark size={16} className="text-purple-500" />
                <span className="text-sm"><strong>{selectedJob._count?.saves || 0}</strong> saves</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Job" size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={editForm.title || ""}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={editForm.status || ""}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="CLOSED">Closed</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employment Type</label>
              <select
                value={editForm.employmentType || ""}
                onChange={(e) => setEditForm({ ...editForm, employmentType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              >
                {Object.entries(EMPLOYMENT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <input
                type="text"
                value={editForm.locationName || ""}
                onChange={(e) => setEditForm({ ...editForm, locationName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isRemote || false}
                  onChange={(e) => setEditForm({ ...editForm, isRemote: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Remote</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Salary</label>
              <input
                type="number"
                value={editForm.minSalary || ""}
                onChange={(e) => setEditForm({ ...editForm, minSalary: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Salary</label>
              <input
                type="number"
                value={editForm.maxSalary || ""}
                onChange={(e) => setEditForm({ ...editForm, maxSalary: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vacancies</label>
              <input
                type="number"
                value={editForm.vacancies || 1}
                onChange={(e) => setEditForm({ ...editForm, vacancies: e.target.value })}
                min={1}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={processing}
              className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
            >
              {processing && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Job" size="sm">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Are you sure you want to delete</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">"{jobToDelete?.title}"?</p>
          <p className="text-xs text-red-500 mb-6">This will permanently delete the job, all applications, and related data.</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={processing}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
            >
              {processing && <Loader2 size={16} className="animate-spin" />}
              Delete Job
            </button>
          </div>
        </div>
      </Modal>

      {/* Applications Modal */}
      <Modal isOpen={showAppsModal} onClose={() => setShowAppsModal(false)} title={`Applications — ${appsJobTitle}`} size="xl">
        <div className="max-h-[70vh] overflow-y-auto">
          {appsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={28} className="animate-spin text-teal-500" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-10">
              <Users size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500">No applications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {applications.map((app) => {
                const statusColors = {
                  SUBMITTED: "blue",
                  REVIEWING: "yellow",
                  SHORTLISTED: "green",
                  REJECTED: "red",
                  WITHDRAWN: "gray",
                  HIRED: "emerald",
                };
                const color = statusColors[app.status] || "gray";
                return (
                  <div key={app.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-bold text-teal-600">
                      {app.applicant?.name?.charAt(0) || "?"}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{app.applicant?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-500 truncate">{app.applicant?.email}</p>
                    </div>
                    {/* Status */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-400`}>
                      {app.status}
                    </span>
                    {/* Date */}
                    <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {appsMeta.totalPages > 1 && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                currentPage={appsMeta.page || appsPage}
                totalPages={appsMeta.totalPages}
                onPageChange={(p) => handleViewApps(applications[0]?.jobId || selectedJob?.id, appsJobTitle, p)}
                totalItems={appsMeta.total}
                itemsPerPage={20}
                showingFrom={(appsPage - 1) * 20 + 1}
                showingTo={Math.min(appsPage * 20, appsMeta.total)}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Archive All Closed Jobs Confirmation */}
      <Modal
        isOpen={showDeleteClosedConfirm}
        onClose={() => { setShowDeleteClosedConfirm(false); setDeleteClosedStep(1); setDeleteClosedConfirmText(""); }}
        title="Archive All Closed Jobs"
        size="sm"
      >
        <div className="py-4">
          {deleteClosedStep === 1 ? (
            <>
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={28} className="text-amber-600" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  You are about to archive
                </p>
                <p className="text-2xl font-bold text-amber-600 mb-2">{stats.closed} closed job{stats.closed !== 1 ? "s" : ""}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                  Archived jobs will be hidden from active listings but preserved for future reference and system self-learning. This action can be reversed.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => { setShowDeleteClosedConfirm(false); setDeleteClosedStep(1); }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setDeleteClosedStep(2)}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
                >
                  I understand, continue
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={28} className="text-amber-600" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Type <strong className="text-amber-600">ARCHIVE</strong> to confirm
                </p>
              </div>
              <input
                type="text"
                value={deleteClosedConfirmText}
                onChange={(e) => setDeleteClosedConfirmText(e.target.value)}
                placeholder="Type ARCHIVE to confirm"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent mb-4"
                autoFocus
              />
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => { setDeleteClosedStep(1); setDeleteClosedConfirmText(""); }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleDeleteAllClosed}
                  disabled={deleteClosedConfirmText !== "ARCHIVE" || deleteClosedProcessing}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                >
                  {deleteClosedProcessing && <Loader2 size={16} className="animate-spin" />}
                  Archive All Closed Jobs
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
      {/* AI PDF Upload Modal */}
      <Modal isOpen={showPdfModal} onClose={() => { setShowPdfModal(false); setPdfFile(null); }} title="AI PDF Job Upload" size="md">
        <div className="py-4 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a PDF with a job description. AI will extract details and pre-fill the create form.
          </p>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <Upload size={32} className="mx-auto text-gray-400 mb-3" />
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-600 hover:file:bg-teal-100 dark:file:bg-teal-900/30 dark:file:text-teal-400"
            />
            {pdfFile && <p className="mt-2 text-sm text-green-600">{pdfFile.name}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowPdfModal(false); setPdfFile(null); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Cancel</button>
            <button
              onClick={handlePdfUpload}
              disabled={!pdfFile || pdfParsing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
            >
              {pdfParsing && <Loader2 size={16} className="animate-spin" />}
              {pdfParsing ? "Extracting..." : "Extract Job Details"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Job Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Job (Career Box)" size="xl">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title *</label>
            <input type="text" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="e.g. Senior Software Engineer" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
            <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Full job description..." />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employment Type *</label>
              <select value={createForm.employmentType} onChange={(e) => setCreateForm({ ...createForm, employmentType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500">
                {Object.entries(EMPLOYMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience Level</label>
              <input type="text" value={createForm.experienceLevel} onChange={(e) => setCreateForm({ ...createForm, experienceLevel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="e.g. Senior" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vacancies</label>
              <input type="number" min={1} value={createForm.vacancies} onChange={(e) => setCreateForm({ ...createForm, vacancies: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <input type="text" value={createForm.locationName} onChange={(e) => setCreateForm({ ...createForm, locationName: e.target.value })}
                disabled={createForm.isRemote}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50" placeholder="e.g. Dubai, UAE" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={createForm.isRemote} onChange={(e) => setCreateForm({ ...createForm, isRemote: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Remote</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Salary</label>
              <input type="number" value={createForm.minSalary} onChange={(e) => setCreateForm({ ...createForm, minSalary: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Salary</label>
              <input type="number" value={createForm.maxSalary} onChange={(e) => setCreateForm({ ...createForm, maxSalary: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
              <select value={createForm.currency} onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500">
                <option value="AED">AED</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="KES">KES</option>
              </select>
            </div>
          </div>

          {/* Industries selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Industries</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {createForm.industries.map((id) => {
                const ind = availableIndustries.find((i) => i.id === id);
                return ind ? (
                  <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
                    {ind.name}
                    <button onClick={() => setCreateForm({ ...createForm, industries: createForm.industries.filter((x) => x !== id) })}><X size={12} /></button>
                  </span>
                ) : null;
              })}
            </div>
            <input type="text" value={industrySearch} onChange={(e) => setIndustrySearch(e.target.value)} placeholder="Search industries..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm mb-1" />
            {industrySearch && (
              <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                {filteredAvailableIndustries.slice(0, 20).map((ind) => (
                  <button key={ind.id} onClick={() => { setCreateForm({ ...createForm, industries: [...createForm.industries, ind.id] }); setIndustrySearch(""); }}
                    className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">{ind.name}</button>
                ))}
              </div>
            )}
          </div>

          {/* Skills selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {createForm.skills.map((id) => {
                const skill = availableSkills.find((s) => s.id === id);
                return skill ? (
                  <span key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                    {skill.name}
                    <button onClick={() => setCreateForm({ ...createForm, skills: createForm.skills.filter((x) => x !== id) })}><X size={12} /></button>
                  </span>
                ) : null;
              })}
            </div>
            <input type="text" value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} placeholder="Search skills..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm mb-1" />
            {skillSearch && (
              <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                {filteredAvailableSkills.slice(0, 20).map((skill) => (
                  <button key={skill.id} onClick={() => { setCreateForm({ ...createForm, skills: [...createForm.skills, skill.id] }); setSkillSearch(""); }}
                    className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">{skill.name}</button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Cancel</button>
            <button onClick={handleCreateJob} disabled={createProcessing}
              className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
              {createProcessing && <Loader2 size={16} className="animate-spin" />}
              Create & Publish
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default JobManagement;
