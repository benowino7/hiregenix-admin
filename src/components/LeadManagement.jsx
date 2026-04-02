import { useState, useEffect } from "react";
import { BASE_URL } from "../BaseUrl";
import {
  FileText,
  Download,
  Search,
  Check,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  X,
} from "lucide-react";

const getTimeStatus = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Helper to get start of week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);

  if (diffHours <= 6) {
    return { label: "New", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" };
  }
  if (diffHours <= 24) {
    return { label: "Today", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" };
  }
  if (date >= startOfWeek) {
    return { label: "This Week", color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" };
  }
  if (date >= startOfLastWeek) {
    return { label: "Last Week", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" };
  }
  if (date >= startOfMonth) {
    return { label: "This Month", color: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400" };
  }
  if (date >= startOfLastMonth) {
    return { label: "Last Month", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" };
  }
  if (date >= startOfYear) {
    return { label: "This Year", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" };
  }
  if (date >= startOfLastYear) {
    return { label: "Last Year", color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" };
  }
  return { label: "Older", color: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500" };
};

const LeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reviewedFilter, setReviewedFilter] = useState(""); // "", "true", "false"
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedLead, setSelectedLead] = useState(null);
  const [notesText, setNotesText] = useState("");

  const token = JSON.parse(sessionStorage.getItem("accessToken"));

  const fetchLeads = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search.trim()) params.set("search", search.trim());
      if (reviewedFilter) params.set("reviewed", reviewedFilter);

      const res = await fetch(`${BASE_URL}/admin/leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.error) {
        setLeads(data.result);
        setPagination({
          page: data.meta.page,
          totalPages: data.meta.totalPages,
          total: data.meta.total,
        });
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [reviewedFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLeads(1);
  };

  const handleDownloadCv = async (lead) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/leads/${lead.id}/cv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = lead.cvFileName || "cv.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download CV");
    }
  };

  const handleToggleReviewed = async (lead) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isReviewed: !lead.isReviewed }),
      });
      const data = await res.json();
      if (!data.error) {
        setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, isReviewed: !l.isReviewed } : l)));
      }
    } catch (err) {
      alert("Failed to update");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    try {
      const res = await fetch(`${BASE_URL}/admin/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: notesText }),
      });
      const data = await res.json();
      if (!data.error) {
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLead.id ? { ...l, notes: notesText } : l))
        );
        setSelectedLead(null);
      }
    } catch (err) {
      alert("Failed to save notes");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    try {
      const res = await fetch(`${BASE_URL}/admin/leads/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.error) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      }
    } catch (err) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lead Captures</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            CV uploads from landing page visitors ({pagination.total} total)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Review Filter */}
          <div className="relative">
            <select
              value={reviewedFilter}
              onChange={(e) => setReviewedFilter(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-teal-500 outline-none appearance-none cursor-pointer"
            >
              <option value="">All</option>
              <option value="false">Unreviewed</option>
              <option value="true">Reviewed</option>
            </select>
            <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads..."
                className="pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-teal-500 outline-none w-48"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm rounded-lg transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-teal-500" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No leads found</p>
          <p className="text-sm mt-1">Leads will appear here when visitors upload their CVs on the landing page.</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Phone</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">CV</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Visa</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Work Permit</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Date</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition"
                    >
                      <td className="px-4 py-3 font-medium">{lead.fullName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{lead.email}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{lead.phone || "—"}</td>
                      <td className="px-4 py-3">
                        {lead.cvFileName ? (
                          <button
                            onClick={() => handleDownloadCv(lead)}
                            className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium text-xs"
                          >
                            <Download size={14} />
                            {lead.cvFileName.length > 20 ? lead.cvFileName.slice(0, 20) + "..." : lead.cvFileName}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">No CV</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {lead.hasVisa ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-bold" title="Has Visa">✓</span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-bold" title="No Visa">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {lead.hasWorkPermit ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-bold" title="Has Work Permit">✓</span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-bold" title="No Work Permit">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const status = getTimeStatus(lead.createdAt);
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(lead.createdAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleReviewed(lead)}
                            title={lead.isReviewed ? "Mark as unreviewed" : "Mark as reviewed"}
                            className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 transition"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setNotesText(lead.notes || "");
                            }}
                            title="View / Add Notes"
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLeads(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => fetchLeads(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Notes Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h3 className="font-bold text-lg">{selectedLead.fullName}</h3>
                <p className="text-sm text-gray-500">{selectedLead.email}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                rows={4}
                placeholder="Add notes about this lead..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-teal-500 outline-none text-sm resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadManagement;
