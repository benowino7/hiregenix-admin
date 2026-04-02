import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  XCircle,
  CheckCircle,
  Briefcase,
  Tag,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";
import { BASE_URL } from "../BaseUrl";
import Modal from "./Modal";
import ErrorMessage from "../utilities/ErrorMessage";
import successMessage from "../utilities/successMessage";
import Pagination from "./Pagination";

const ITEMS_PER_PAGE = 20;

function Industries() {
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [stats, setStats] = useState({ total: 0, skills: 0, mappings: 0 });

  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [processing, setProcessing] = useState(false);
  const [industryToDelete, setIndustryToDelete] = useState(null);
  const [selectedIndustryForSkills, setSelectedIndustryForSkills] = useState(null);

  // Modal skills state (loaded on demand)
  const [modalSkills, setModalSkills] = useState([]);
  const [modalSkillSearch, setModalSkillSearch] = useState("");
  const [modalSkillsLoading, setModalSkillsLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    slug: "",
    skillIds: [],
  });

  const [skillFormData, setSkillFormData] = useState({
    skillIds: [],
  });

  const searchTimerRef = useRef(null);

  const getToken = () => {
    try {
      return JSON.parse(sessionStorage.getItem("accessToken"));
    } catch {
      return sessionStorage.getItem("accessToken");
    }
  };

  // Fetch paginated industries
  const fetchIndustries = useCallback(async (pageNum, search) => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams({
        page: pageNum,
        limit: ITEMS_PER_PAGE,
        ...(search && { search }),
      });

      const response = await fetch(`${BASE_URL}/admin/industries?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (result?.status === "SUCCESS") {
        setIndustries(result.data);
        setMeta(result.meta || { total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error("Error fetching industries:", error);
      ErrorMessage("Error loading industries");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") {
        setStats({
          total: result.data.industries,
          skills: result.data.skills,
          mappings: result.data.mappings,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchIndustries(1, "");
    fetchStats();
  }, []);

  // Re-fetch when page changes
  useEffect(() => {
    fetchIndustries(page, searchTerm);
  }, [page]);

  // Debounced search
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchTerm(value);
      setPage(1);
      fetchIndustries(1, value);
    }, 300);
  };

  // Fetch skills for modals (on demand with search)
  const fetchModalSkills = async (search = "") => {
    try {
      setModalSkillsLoading(true);
      const token = getToken();
      const params = new URLSearchParams({
        limit: 50,
        ...(search && { search }),
      });

      const response = await fetch(`${BASE_URL}/admin/skills?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS") {
        setModalSkills(result.data);
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
    } finally {
      setModalSkillsLoading(false);
    }
  };

  // Modal skill search with debounce
  const modalSkillTimerRef = useRef(null);
  const handleModalSkillSearch = (e) => {
    const value = e.target.value;
    setModalSkillSearch(value);
    if (modalSkillTimerRef.current) clearTimeout(modalSkillTimerRef.current);
    modalSkillTimerRef.current = setTimeout(() => {
      fetchModalSkills(value);
    }, 300);
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Refresh after mutations
  const refreshData = async () => {
    await Promise.all([fetchIndustries(page, searchTerm), fetchStats()]);
  };

  // Open modal for create
  const openCreateModal = () => {
    setModalMode("create");
    setFormData({ id: "", name: "", slug: "", skillIds: [] });
    setModalSkillSearch("");
    fetchModalSkills("");
    setShowModal(true);
  };

  // Open modal for edit
  const openEditModal = (industry) => {
    setModalMode("edit");
    setFormData({
      id: industry.id,
      name: industry.name,
      slug: industry.slug,
      skillIds: [],
    });
    // Load industry details to get current skills
    loadIndustrySkills(industry.id);
    setModalSkillSearch("");
    fetchModalSkills("");
    setShowModal(true);
  };

  // Load full industry details for editing
  const loadIndustrySkills = async (industryId) => {
    try {
      const token = getToken();
      const response = await fetch(`${BASE_URL}/admin/industries/${industryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS" && result.data?.skills) {
        setFormData((prev) => ({
          ...prev,
          skillIds: result.data.skills.map((s) => s.skillId),
        }));
      }
    } catch (error) {
      console.error("Error loading industry details:", error);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setFormData({ id: "", name: "", slug: "", skillIds: [] });
    setModalSkillSearch("");
  };

  // Open skill assignment modal
  const openSkillModal = (industry) => {
    setSelectedIndustryForSkills(industry);
    setModalSkillSearch("");
    fetchModalSkills("");
    // Load current skills for this industry
    loadSkillAssignment(industry.id);
    setShowSkillModal(true);
  };

  const loadSkillAssignment = async (industryId) => {
    try {
      const token = getToken();
      const response = await fetch(`${BASE_URL}/admin/industries/${industryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS" && result.data?.skills) {
        setSkillFormData({
          skillIds: result.data.skills.map((s) => s.skillId),
        });
      }
    } catch (error) {
      console.error("Error loading industry skills:", error);
    }
  };

  // Close skill assignment modal
  const closeSkillModal = () => {
    setShowSkillModal(false);
    setSelectedIndustryForSkills(null);
    setSkillFormData({ skillIds: [] });
    setModalSkillSearch("");
  };

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Auto-generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "_")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({ ...prev, name, slug: generateSlug(name) }));
  };

  // Handle skill toggle in create/edit modal
  const handleSkillToggle = (skillId) => {
    setFormData((prev) => ({
      ...prev,
      skillIds: prev.skillIds.includes(skillId)
        ? prev.skillIds.filter((id) => id !== skillId)
        : [...prev.skillIds, skillId],
    }));
  };

  // Handle skill toggle in skill assignment modal
  const handleSkillAssignmentToggle = (skillId) => {
    setSkillFormData((prev) => ({
      ...prev,
      skillIds: prev.skillIds.includes(skillId)
        ? prev.skillIds.filter((id) => id !== skillId)
        : [...prev.skillIds, skillId],
    }));
  };

  // Create or Update industry
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      ErrorMessage("Please enter an industry name");
      return;
    }
    if (!formData.slug.trim()) {
      ErrorMessage("Please enter a slug");
      return;
    }

    try {
      setProcessing(true);
      const url =
        modalMode === "create"
          ? `${BASE_URL}/admin/industries`
          : `${BASE_URL}/admin/industries/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          skillIds: formData.skillIds,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        await refreshData();
        closeModal();
        successMessage(
          data?.message ||
            `Industry ${modalMode === "create" ? "created" : "updated"} successfully!`,
        );
      } else {
        ErrorMessage(data.message || `Failed to ${modalMode} industry`);
      }
    } catch (error) {
      console.error("Error submitting industry:", error);
      ErrorMessage("Error submitting industry");
    } finally {
      setProcessing(false);
    }
  };

  // Assign skills to industry
  const handleSkillAssignment = async () => {
    if (!selectedIndustryForSkills) return;
    try {
      setProcessing(true);
      const response = await fetch(
        `${BASE_URL}/admin/industries/${selectedIndustryForSkills.id}/skills`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ skillIds: skillFormData.skillIds }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        await refreshData();
        closeSkillModal();
        successMessage(data?.message || "Skills assigned successfully!");
      } else {
        ErrorMessage(data.message || "Failed to assign skills");
      }
    } catch (error) {
      console.error("Error assigning skills:", error);
      ErrorMessage("Error assigning skills");
    } finally {
      setProcessing(false);
    }
  };

  // Delete
  const openDeleteConfirm = (industry) => {
    setIndustryToDelete(industry);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setIndustryToDelete(null);
  };

  const handleDelete = async () => {
    if (!industryToDelete) return;
    try {
      setProcessing(true);
      const response = await fetch(
        `${BASE_URL}/admin/industries/${industryToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      if (response.ok) {
        await refreshData();
        closeDeleteConfirm();
        successMessage("Industry deleted successfully!");
      } else {
        ErrorMessage("Failed to delete industry");
      }
    } catch (error) {
      console.error("Error deleting industry:", error);
      ErrorMessage("Error deleting industry");
    } finally {
      setProcessing(false);
    }
  };

  if (loading && industries.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center flex flex-col items-center">
          <Loader2 className="text-theme_color dark:text-dark-theme_color text-8xl animate-spin" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Loading industries...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="w-full">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Industries Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage industries and their associated skills
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-theme_color text-white rounded-lg hover:bg-teal-600 transition-colors font-medium"
          >
            <Plus size={20} />
            Add Industry
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-dark-sidebar rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Industries
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.total.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Briefcase className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-sidebar rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Skills
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.skills.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <Tag className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-sidebar rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Skill Mappings
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.mappings.toLocaleString()}
                </p>
              </div>
              <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-lg">
                <LinkIcon className="text-teal-600 dark:text-teal-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-dark-sidebar rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search industries..."
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-theme_color dark:focus:border-dark-theme_color"
            />
            {loading && (
              <Loader2
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin"
                size={18}
              />
            )}
          </div>
        </div>

        {/* Industries Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {industries.map((industry) => (
            <div
              key={industry.id}
              className="bg-white relative dark:bg-dark-sidebar rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="absolute bottom-3 right-2 flex items-center gap-1">
                <button
                  onClick={() => openEditModal(industry)}
                  className="inline-flex items-center justify-center p-2 bg-gray-100/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200/90 dark:hover:bg-gray-600/90 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => openDeleteConfirm(industry)}
                  className="inline-flex items-center justify-center p-2 bg-gray-100/50 dark:bg-gray-700/50 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-100/90 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {/* Industry Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-theme_color to-teal-600 p-3 rounded-lg">
                    <Briefcase className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {industry.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {industry.slug}
                    </p>
                  </div>
                </div>
                {industry.isActive && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    <CheckCircle size={12} />
                    Active
                  </span>
                )}
              </div>

              {/* Counts */}
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  {industry._count?.jobIndustries || 0} jobs
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                  {industry._count?.skills || 0} skills
                </span>
                <button
                  onClick={() => openSkillModal(industry)}
                  className="ml-auto text-xs text-theme_color hover:underline"
                >
                  Manage Skills
                </button>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Created:{" "}
                {new Date(industry.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {industries.length === 0 && !loading && (
          <div className="bg-white dark:bg-dark-sidebar rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Briefcase className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 dark:text-gray-400">
              No industries found matching your search
            </p>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={meta.totalPages}
            onPageChange={handlePageChange}
            totalItems={meta.total}
            itemsPerPage={ITEMS_PER_PAGE}
            showingFrom={(page - 1) * ITEMS_PER_PAGE + 1}
            showingTo={Math.min(page * ITEMS_PER_PAGE, meta.total)}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={`${modalMode === "create" ? "Add New Industry" : "Edit an Industry"}`}
          subtitle={`${
            modalMode === "create"
              ? "Add New Industry and skills under it"
              : "Edit an Industry, the skills under it or both"
          }`}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Industry Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Industry Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-theme_color focus:border-transparent"
                placeholder="e.g., Software Engineering"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-theme_color focus:border-transparent"
                placeholder="e.g., software-engineering"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                URL-friendly identifier (auto-generated from name)
              </p>
            </div>

            {/* Skills Selection (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Skills (Optional)
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={modalSkillSearch}
                  onChange={handleModalSkillSearch}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:border-theme_color"
                />
              </div>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto bg-white dark:bg-gray-800">
                {modalSkillsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  </div>
                ) : modalSkills.length > 0 ? (
                  modalSkills.map((skill) => (
                    <label
                      key={skill.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.skillIds.includes(skill.id)}
                        onChange={() => handleSkillToggle(skill.id)}
                        className="w-4 h-4 text-theme_color focus:ring-theme_color border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {skill.name}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No skills found
                  </p>
                )}
              </div>
              {formData.skillIds.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.skillIds.length} skill(s) selected
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="flex-1 bg-theme_color text-white py-2 rounded-lg font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {modalMode === "create" ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    {modalMode === "create" ? "Create Industry" : "Update Industry"}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Skill Assignment Modal */}
      {showSkillModal && selectedIndustryForSkills && (
        <Modal
          isOpen={showSkillModal && selectedIndustryForSkills}
          onClose={closeSkillModal}
          title={"Manage Skills"}
          subtitle={"Add or remove Skills from the Industry"}
          size="lg"
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Skills
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={modalSkillSearch}
                  onChange={handleModalSkillSearch}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:border-theme_color"
                />
              </div>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-96 overflow-y-auto bg-white dark:bg-gray-800">
                {modalSkillsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  </div>
                ) : modalSkills.length > 0 ? (
                  modalSkills.map((skill) => (
                    <label
                      key={skill.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={skillFormData.skillIds.includes(skill.id)}
                        onChange={() => handleSkillAssignmentToggle(skill.id)}
                        className="w-4 h-4 text-theme_color focus:ring-theme_color border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {skill.name}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No skills found
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Selected: {skillFormData.skillIds.length} skill(s)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={closeSkillModal}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSkillAssignment}
                disabled={processing}
                className="flex-1 bg-theme_color text-white py-2 rounded-lg font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Save Skills
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && industryToDelete && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={closeDeleteConfirm}
        >
          <div
            className="bg-white dark:bg-dark-sidebar rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
                <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Delete Industry
              </h2>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {industryToDelete.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeDeleteConfirm}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={processing}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Industry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Industries;
