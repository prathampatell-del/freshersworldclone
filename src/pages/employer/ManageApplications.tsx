import { useState, useEffect } from 'react';
import { Users, MapPin, Briefcase, Phone, Mail, Download, ChevronDown } from 'lucide-react';
import { applicationsApi } from '../../api';
import { Application } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/Toast';

const STATUS_OPTIONS = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];

export function ManageApplications() {
  const toast = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    applicationsApi.list({ page, limit: 10, status: statusFilter || undefined })
      .then(res => {
        setApplications(res.data.applications);
        setTotal(res.data.total);
        setPages(res.data.pages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await applicationsApi.updateStatus(id, status);
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: status as any } : a));
      toast(`Application marked as ${status}`);
    } catch {
      toast('Failed to update status', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total applications</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-orange-400"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}</div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">No applications</h3>
          <p className="text-sm text-gray-500">Post jobs to receive applications from candidates</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {applications.map(app => (
              <div key={app.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold shrink-0">
                      {(app.applicant_name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-800">{app.applicant_name || 'Applicant'}</p>
                          <p className="text-xs text-gray-500">{app.applicant_email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={app.status} />
                          <select
                            value={app.status}
                            onChange={e => updateStatus(app.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white outline-none focus:border-orange-400"
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1 font-medium text-gray-700"><Briefcase size={11} />{app.job_title}</span>
                        {app.applicant_location && <span className="flex items-center gap-1"><MapPin size={11} />{app.applicant_location}</span>}
                        {app.experience_years !== undefined && <span>{app.experience_years === 0 ? 'Fresher' : `${app.experience_years} yr exp`}</span>}
                      </div>
                      {app.applicant_skills && app.applicant_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {app.applicant_skills.slice(0, 5).map(s => (
                            <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <ChevronDown size={16} className={`transition-transform ${expanded === app.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {expanded === app.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                    <div className="flex flex-wrap gap-4 text-sm">
                      {app.applicant_phone && (
                        <a href={`tel:${app.applicant_phone}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                          <Phone size={13} />{app.applicant_phone}
                        </a>
                      )}
                      {app.applicant_email && (
                        <a href={`mailto:${app.applicant_email}`} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                          <Mail size={13} />{app.applicant_email}
                        </a>
                      )}
                      {app.resume_url && (
                        <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-green-600 hover:underline">
                          <Download size={13} />View Resume
                        </a>
                      )}
                    </div>
                    {app.cover_letter && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Cover Letter:</p>
                        <p className="text-xs text-gray-600 bg-white rounded-lg p-3 border border-gray-200">{app.cover_letter}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">Applied {new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
