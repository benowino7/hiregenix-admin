import { useState, useEffect } from 'react';
import { Star, MessageSquareQuote, Loader, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { BASE_URL } from '../BaseUrl';

const TestimonialManagement = () => {
  const token = JSON.parse(sessionStorage.getItem('accessToken') || '""');
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filterType, setFilterType] = useState('');
  const [filterApproved, setFilterApproved] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchTestimonials = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', '15');
      if (filterType) params.set('type', filterType);
      if (filterApproved) params.set('approved', filterApproved);

      const res = await fetch(`${BASE_URL}/admin/testimonials?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        setTestimonials(data.data || []);
        setPagination({
          page: data.meta.page,
          totalPages: data.meta.totalPages,
          total: data.meta.total,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials(1);
  }, [filterType, filterApproved]);

  const handleApprove = async (id, approve) => {
    setActionLoading(id);
    try {
      await fetch(`${BASE_URL}/admin/testimonials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isApproved: approve }),
      });
      fetchTestimonials(pagination.page);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this testimonial?')) return;
    setActionLoading(id);
    try {
      await fetch(`${BASE_URL}/admin/testimonials/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTestimonials(pagination.page);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquareQuote size={28} className="text-theme_color" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Testimonials</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">({pagination.total})</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-theme_color">
          <option value="">All Types</option>
          <option value="JOB_SEEKER">Job Seekers</option>
          <option value="RECRUITER">Recruiters</option>
        </select>

        <select value={filterApproved} onChange={(e) => setFilterApproved(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-theme_color">
          <option value="">All Status</option>
          <option value="true">Approved</option>
          <option value="false">Pending</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="animate-spin text-theme_color" size={32} />
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquareQuote size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No testimonials found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((t) => (
            <div key={t.id} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-theme_color/10 flex items-center justify-center text-theme_color font-bold text-sm">
                      {t.user?.firstName?.[0]}{t.user?.lastName?.[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {t.user?.firstName} {t.user?.lastName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t.user?.email} &bull; {t.userType === 'JOB_SEEKER' ? 'Job Seeker' : 'Recruiter'}
                      </p>
                    </div>
                    <div className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${
                      t.isApproved
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    }`}>
                      {t.isApproved ? 'Approved' : 'Pending'}
                    </div>
                  </div>

                  {(t.role || t.company) && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {t.role}{t.role && t.company ? ' at ' : ''}{t.company}
                    </p>
                  )}

                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className={i < t.rating ? 'fill-theme_color text-theme_color' : 'text-gray-300 dark:text-gray-600'} />
                    ))}
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-sm italic">"{t.text}"</p>

                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(t.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {t.isApproved ? (
                    <button
                      onClick={() => handleApprove(t.id, false)}
                      disabled={actionLoading === t.id}
                      className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition"
                      title="Unapprove"
                    >
                      <EyeOff size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(t.id, true)}
                      disabled={actionLoading === t.id}
                      className="p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                      title="Approve"
                    >
                      <Eye size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={actionLoading === t.id}
                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => fetchTestimonials(pagination.page - 1)} disabled={pagination.page <= 1}
            className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button onClick={() => fetchTestimonials(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
            className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TestimonialManagement;
