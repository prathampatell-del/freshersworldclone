import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Eye, Plus, ArrowRight, Building2, BarChart3 } from 'lucide-react';
import { jobsApi } from '../../api/jobs';
import { applicationsApi, companiesApi } from '../../api';
import { Job, Application, Company } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../../components/ui/Badge';

export function EmployerDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      jobsApi.list({ limit: 5 }),
      applicationsApi.list({ limit: 5 }),
    ]).then(([jRes, aRes]) => {
      setJobs(jRes.data.jobs.filter((j: any) => j.company_id));
      setApplications(aRes.data.applications);
    }).finally(() => setLoading(false));

    // Try to load company
    companiesApi.list({ limit: 1 }).then(res => {
      if (res.data.companies[0]) setCompany(res.data.companies[0]);
    });
  }, []);

  const totalViews = jobs.reduce((sum, j) => sum + (j.views || 0), 0);
  const pendingApps = applications.filter(a => a.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employer Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
        </div>
        <Link to="/employer/post-job" className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition">
          <Plus size={16} /> Post a Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Jobs', value: jobs.length, icon: Briefcase, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Applications', value: applications.length, icon: Users, color: 'text-green-600 bg-green-50' },
          { label: 'Pending Review', value: pendingApps, icon: BarChart3, color: 'text-orange-600 bg-orange-50' },
          { label: 'Total Views', value: totalViews, icon: Eye, color: 'text-purple-600 bg-purple-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon size={18} />
            </div>
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Company profile alert */}
      {!company && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <Building2 size={20} className="text-blue-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">Set up your company profile</p>
            <p className="text-xs text-blue-600">A complete company profile attracts more qualified applicants.</p>
          </div>
          <Link to="/employer/company" className="shrink-0 text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition">Set Up</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent applications */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><Users size={18} className="text-green-500" />Recent Applications</h2>
            <Link to="/employer/applications" className="text-orange-500 text-sm font-medium hover:underline flex items-center gap-1">View All <ArrowRight size={13} /></Link>
          </div>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-lg" />)}</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              <Users size={28} className="mx-auto mb-2 text-gray-200" />
              <p>No applications yet</p>
              <Link to="/employer/post-job" className="text-orange-500 font-medium hover:underline mt-1 inline-block">Post a job to receive applications →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {applications.map(app => (
                <div key={app.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold text-xs shrink-0">
                    {(app.applicant_name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{app.applicant_name || 'Applicant'}</p>
                    <p className="text-xs text-gray-500 truncate">{app.job_title}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active jobs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><Briefcase size={18} className="text-blue-500" />Active Jobs</h2>
            <Link to="/employer/post-job" className="text-orange-500 text-sm font-medium hover:underline flex items-center gap-1">Post New <Plus size={13} /></Link>
          </div>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-lg" />)}</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              <Briefcase size={28} className="mx-auto mb-2 text-gray-200" />
              <p>No active jobs posted yet</p>
              <Link to="/employer/post-job" className="text-orange-500 font-medium hover:underline mt-1 inline-block">Post your first job →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.slice(0, 5).map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <Link to={`/jobs/${job.id}`} className="text-sm font-semibold text-gray-800 hover:text-orange-600 truncate block">{job.title}</Link>
                    <p className="text-xs text-gray-500">{job.location} · {job.views} views</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 ${job.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {job.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
