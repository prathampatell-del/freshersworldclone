import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Bookmark, Bell, ArrowRight, Clock, CheckCircle, XCircle, AlertCircle, Eye, TrendingUp } from 'lucide-react';
import { applicationsApi, usersApi } from '../../api';
import { Application, Job } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../../components/ui/Badge';
import { JobCard } from '../../components/JobCard';
import { jobsApi } from '../../api/jobs';

export function Dashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [bookmarks, setBookmarks] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      applicationsApi.list({ limit: 5 }),
      usersApi.bookmarks({ limit: 3 }),
    ]).then(([appsRes, bkRes]) => {
      setApplications(appsRes.data.applications);
      setBookmarks(bkRes.data.bookmarks);
    }).finally(() => setLoading(false));
  }, []);

  const statusCounts = {
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#003580] to-[#0052cc] rounded-2xl p-6 text-white mb-6">
        <h1 className="text-2xl font-bold mb-1">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
        <p className="text-blue-100 text-sm mb-4">Here's your job search summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Applied', value: applications.length, icon: Briefcase, color: 'bg-white/20' },
            { label: 'Pending', value: statusCounts.pending, icon: Clock, color: 'bg-white/20' },
            { label: 'Shortlisted', value: statusCounts.shortlisted, icon: CheckCircle, color: 'bg-white/20' },
            { label: 'Saved Jobs', value: bookmarks.length, icon: Bookmark, color: 'bg-white/20' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.color} rounded-xl p-3`}>
              <stat.icon size={18} className="mb-1 opacity-70" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs opacity-70">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile completion prompt */}
      {(!user.resume_url || !user.bio || !user.skills?.length) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Complete your profile to stand out!</p>
            <p className="text-xs text-amber-600">Add your skills, bio and resume to get noticed by top recruiters.</p>
          </div>
          <Link to="/profile" className="shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition">
            Complete Profile
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><Briefcase size={18} className="text-orange-500" />Recent Applications</h2>
              <Link to="/dashboard/applications" className="text-orange-500 text-sm font-medium hover:underline flex items-center gap-1">
                View All <ArrowRight size={13} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />)}</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Briefcase size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No applications yet</p>
                <Link to="/jobs" className="text-orange-500 text-sm font-medium hover:underline mt-1 inline-block">Browse Jobs →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map(app => (
                  <div key={app.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <Link to={`/jobs/${app.job_id}`} className="font-semibold text-gray-800 text-sm hover:text-orange-600 truncate block">{app.job_title}</Link>
                      <p className="text-xs text-gray-500">{app.company_name} · {app.job_location}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={app.status} />
                      <p className="text-xs text-gray-400 mt-1">{new Date(app.applied_at).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { to: '/jobs', icon: Briefcase, label: 'Browse Jobs', color: 'text-orange-500' },
                { to: '/dashboard/bookmarks', icon: Bookmark, label: 'Saved Jobs', color: 'text-blue-500' },
                { to: '/dashboard/alerts', icon: Bell, label: 'Job Alerts', color: 'text-purple-500' },
                { to: '/profile', icon: Eye, label: 'Edit Profile', color: 'text-green-500' },
                { to: '/courses', icon: TrendingUp, label: 'Upgrade Skills', color: 'text-indigo-500' },
              ].map(item => (
                <Link key={item.to} to={item.to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700 group">
                  <item.icon size={16} className={item.color} />
                  {item.label}
                  <ArrowRight size={12} className="ml-auto text-gray-300 group-hover:text-gray-500 transition" />
                </Link>
              ))}
            </div>
          </div>

          {/* Saved jobs */}
          {bookmarks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">Saved Jobs</h3>
                <Link to="/dashboard/bookmarks" className="text-xs text-orange-500 hover:underline">View all</Link>
              </div>
              <div className="space-y-2">
                {bookmarks.map((job: any) => (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="block p-2.5 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition">
                    <p className="text-sm font-semibold text-gray-800 truncate">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.company_name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
