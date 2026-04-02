import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  XCircle,
  CheckCircle,
  Tag,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { BASE_URL } from "../BaseUrl";
import ErrorMessage from "../utilities/ErrorMessage";
import successMessage from "../utilities/successMessage";
import Modal from "./Modal";
import Pagination from "./Pagination";

const ITEMS_PER_PAGE = 20;

function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [stats, setStats] = useState({ total: 0, industries: 0 });

  // Industry filter dropdown data
  const [filterIndustries, setFilterIndustries] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [processing, setProcessing] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState(null);

  // Modal industries state (loaded on demand)
  const [modalIndustries, setModalIndustries] = useState([]);
  const [modalIndustrySearch, setModalIndustrySearch] = useState("");
  const [modalIndustriesLoading, setModalIndustriesLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    industryIds: [],
  });

  const searchTimerRef = useRef(null);

  const getToken = () => {
    try {
      return JSON.parse(sessionStorage.getItem("accessToken"));
    } catch {
      return sessionStorage.getItem("accessToken");
    }
  };

  // Fetch paginated skills
  const fetchSkills = useCallback(async (pageNum, search, industryId) => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams({
        page: pageNum,
        limit: ITEMS_PER_PAGE,
        ...(search && { search }),
        ...(industryId && industryId !== "all" && { industryId }),
      });

      const response = await fetch(`${BASE_URL}/admin/skills?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (result?.status === "SUCCESS") {
        setSkills(result.data);
        setMeta(result.meta || { total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
      ErrorMessage("Error loading skills");
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
          total: result.data.skills,
          industries: result.data.industries,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  // Fetch industries for filter dropdown (taxonomy)
  const fetchFilterIndustries = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/public/industries/taxonomy`);
      const result = await response.json();
      if (!result.error && result.result) {
        const items = [];
        for (const group of result.result) {
          for (const ind of group.industries || []) {
            items.push({ id: ind.id, name: ind.name });
          }
        }
        items.sort((a, b) => a.name.localeCompare(b.name));
        setFilterIndustries(items);
      }
    } catch (error) {
      console.error("Error fetching industries for filter:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSkills(1, "", "all");
    fetchStats();
    fetchFilterIndustries();
  }, []);

  // Re-fetch when page changes
  useEffect(() => {
    fetchSkills(page, searchTerm, selectedIndustry);
  }, [page]);

  // Debounced search
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchTerm(value);
      setPage(1);
      fetchSkills(1, value, selectedIndustry);
    }, 300);
  };

  // Industry filter change
  const handleIndustryFilterChange = (e) => {
    const value = e.target.value;
    setSelectedIndustry(value);
    setPage(1);
    fetchSkills(1, searchTerm, value);
  };

  // All taxonomy industries (loaded once for modal)
  const [allTaxonomyIndustries, setAllTaxonomyIndustries] = useState([]);

  // Fetch industries for modals (taxonomy, loaded once then filtered client-side)
  const fetchModalIndustries = async (search = "") => {
    try {
      setModalIndustriesLoading(true);
      let source = allTaxonomyIndustries;
      if (source.length === 0) {
        const response = await fetch(`${BASE_URL}/public/industries/taxonomy`);
        const result = await response.json();
        if (!result.error && result.result) {
          const items = [];
          for (const group of result.result) {
            for (const ind of group.industries || []) {
              items.push({ id: ind.id, name: ind.name });
            }
          }
          items.sort((a, b) => a.name.localeCompare(b.name));
          setAllTaxonomyIndustries(items);
          source = items;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        setModalIndustries(source.filter(i => i.name.toLowerCase().includes(q)));
      } else {
        setModalIndustries(source);
      }
    } catch (error) {
      console.error("Error fetching industries:", error);
    } finally {
      setModalIndustriesLoading(false);
    }
  };

  // Modal industry search with debounce
  const modalIndustryTimerRef = useRef(null);
  const handleModalIndustrySearch = (e) => {
    const value = e.target.value;
    setModalIndustrySearch(value);
    if (modalIndustryTimerRef.current) clearTimeout(modalIndustryTimerRef.current);
    modalIndustryTimerRef.current = setTimeout(() => {
      fetchModalIndustries(value);
    }, 300);
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Refresh after mutations
  const refreshData = async () => {
    await Promise.all([fetchSkills(page, searchTerm, selectedIndustry), fetchStats()]);
  };

  // Open modal for create
  const openCreateModal = () => {
    setModalMode("create");
    setFormData({ id: "", name: "", industryIds: [] });
    setModalIndustrySearch("");
    fetchModalIndustries("");
    setShowModal(true);
  };

  // Open modal for edit
  const openEditModal = (skill) => {
    setModalMode("edit");
    setFormData({
      id: skill.id,
      name: skill.name,
      industryIds: [],
    });
    // Load skill details to get current industries
    loadSkillIndustries(skill.id);
    setModalIndustrySearch("");
    fetchModalIndustries("");
    setShowModal(true);
  };

  // Load full skill details for editing
  const loadSkillIndustries = async (skillId) => {
    try {
      const token = getToken();
      const response = await fetch(`${BASE_URL}/admin/skills/${skillId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result?.status === "SUCCESS" && result.data?.industries) {
        setFormData((prev) => ({
          ...prev,
          industryIds: result.data.industries.map((ind) => ind.industryId),
        }));
      }
    } catch (error) {
      console.error("Error loading skill details:", error);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setFormData({ id: "", name: "", industryIds: [] });
    setModalIndustrySearch("");
  };

  // Handle form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle industry selection
  const handleIndustryToggle = (industryId) => {
    setFormData((prev) => ({
      ...prev,
      industryIds: prev.industryIds.includes(industryId)
        ? prev.industryIds.filter((id) => id !== industryId)
        : [...prev.industryIds, industryId],
    }));
  };

  // Create or Update skill
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      ErrorMessage("Please enter a skill name");
      return;
    }
    if (formData.industryIds.length === 0) {
      ErrorMessage("Please select at least one industry");
      return;
    }

    try {
      setProcessing(true);
      const url =
        modalMode === "create"
          ? `${BASE_URL}/admin/skills`
          : `${BASE_URL}/admin/skills/${formData.id}`;
      const method = modalMode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: formData.name,
          industryIds: formData.industryIds,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        await refreshData();
        closeModal();
        successMessage(
          data?.message ||
            `Skill ${modalMode === "create" ? "created" : "updated"} successfully!`,
        );
      } else {
        ErrorMessage(data.message || `Failed to ${modalMode} skill`);
      }
    } catch (error) {
      console.error("Error submitting skill:", error);
      ErrorMessage("Error submitting skill");
    } finally {
      setProcessing(false);
    }
  };

  // Delete
  const openDeleteConfirm = (skill) => {
    setSkillToDelete(skill);
    setShowDeleteConfirm(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setSkillToDelete(null);
  };

  const handleDelete = async () => {
    if (!skillToDelete) return;
    try {
      setProcessing(true);
      const response = await fetch(
        `${BASE_URL}/admin/skills/${skillToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      if (response.ok) {
        await refreshData();
        closeDeleteConfirm();
        successMessage("Skill deleted successfully!");
      } else {
        ErrorMessage("Failed to delete skill");
      }
    } catch (error) {
      console.error("Error deleting skill:", error);
      ErrorMessage("Error deleting skill");
    } finally {
      setProcessing(false);
    }
  };

  if (loading && skills.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center flex flex-col items-center">
          <Loader2 className="text-theme_color dark:text-dark-theme_color text-8xl animate-spin" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Loading skills...
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
              Skills Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage skills and their associated industries
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-theme_color text-white rounded-lg hover:bg-teal-600 transition-colors font-medium"
          >
            <Plus size={20} />
            Add Skill
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-dark-sidebar rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Skills
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.total.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Tag className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-sidebar rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Industries
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.industries.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <Briefcase className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-dark-sidebar rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search skills..."
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

            {/* Industry Filter */}
            <div>
              <select
                value={selectedIndustry}
                onChange={handleIndustryFilterChange}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-theme_color focus:border-transparent appearance-none min-w-[200px]"
              >
                <option value="all">All Industries</option>
                {filterIndustries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Skills Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="bg-white dark:bg-dark-sidebar rounded-lg border border-gray-200 dark:border-gray-700 p-6 relative hover:shadow-lg transition-shadow"
            >
              <button
                onClick={() => openEditModal(skill)}
                className="flex-1 absolute top-3 right-2 w-fit inline-flex items-center justify-center gap-2 px-2 py-2 bg-gray-100/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200/90 dark:hover:bg-gray-600/90 transition-colors text-sm font-medium"
              >
                <Edit2 size={16} />
              </button>
              {/* Skill Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-theme_color to-teal-600 p-3 rounded-lg">
                    <Tag className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {skill.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(skill.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Industries Count */}
              <div className="">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Industries
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                    {skill._count?.industries || 0} industries mapped
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {skills.length === 0 && !loading && (
          <div className="bg-white dark:bg-dark-sidebar rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Tag className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 dark:text-gray-400">
              No skills found matching your filters
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
          title={`${modalMode === "create" ? "Add a new Skill set" : "Update Skill set"}`}
          subtitle={`${modalMode === "create" ? "Add skill name and the industries" : "Update skill name and the industries"}`}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Skill Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Skill Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-theme_color focus:border-transparent"
                placeholder="e.g., Python, JavaScript"
                required
              />
            </div>

            {/* Industries Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Industries * (Select at least one)
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search industries..."
                  value={modalIndustrySearch}
                  onChange={handleModalIndustrySearch}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:border-theme_color"
                />
              </div>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto bg-white dark:bg-gray-800">
                {modalIndustriesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  </div>
                ) : modalIndustries.length > 0 ? (
                  modalIndustries.map((industry) => (
                    <label
                      key={industry.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.industryIds.includes(industry.id)}
                        onChange={() => handleIndustryToggle(industry.id)}
                        className="w-4 h-4 text-theme_color focus:ring-theme_color border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {industry.name}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No industries found
                  </p>
                )}
              </div>
              {formData.industryIds.length === 0 ? (
                <p className="text-xs text-red-500 mt-1">
                  Please select at least one industry
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.industryIds.length} industry(ies) selected
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
                disabled={processing || formData.industryIds.length === 0}
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
                    {modalMode === "create" ? "Create Skill" : "Update Skill"}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && skillToDelete && (
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
                Delete Skill
              </h2>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete the skill{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {skillToDelete.name}
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
                    Delete Skill
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

export default Skills;
