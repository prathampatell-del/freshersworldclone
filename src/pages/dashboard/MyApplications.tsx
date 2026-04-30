import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock } from 'lucide-react';
import { applicationsApi } from '../../api';
import { Application } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';

const STATUS_OPTIONS = ['', 'pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];

export function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    applicationsApi.list({ page, limit: 10, status: statusFilter || undefined })
      .then(res => {
        setApplications(res.data.applications);
        setTotal(res.data.total);
        setPages(res.data.pages);
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total applications</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-orange-400"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Status'}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}</div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Briefcase size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">No applications found</h3>
          <p className="text-sm text-gray-500 mb-4">Start applying to jobs to see them here</p>
          <Link to="/jobs" className="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition">Browse Jobs</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {applications.map(app => (
              <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link to={`/jobs/${app.job_id}`} className="font-semibold text-gray-800 hover:text-orange-600 text-sm">{app.job_title}</Link>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{app.company_name}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    {app.job_location && <span className="flex items-center gap-1"><MapPin size={11} />{app.job_location}</span>}
                    <span className="flex items-center gap-1"><Clock size={11} />Applied {new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {app.cover_letter && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-500 cursor-pointer hover:text-blue-700">View cover letter</summary>
                      <p className="mt-1 text-xs text-gray-600 bg-gray-50 rounded p-2 line-clamp-3">{app.cover_letter}</p>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
