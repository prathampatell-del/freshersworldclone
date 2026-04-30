import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, IndianRupee, Briefcase, Building2, Star,
  Globe, CheckCircle, Bookmark, BookmarkCheck, Share2,
  Users, Calendar, Eye, AlertCircle, ChevronRight, X
} from 'lucide-react';
import { jobsApi } from '../api/jobs';
import { Job } from '../types';
import { JobTypeBadge } from '../components/ui/Badge';
import { JobCard } from '../components/JobCard';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

function formatSalary(min?: number, max?: number) {
  if (!min && !max) return 'Not disclosed';
  const fmt = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} LPA` : `${(n / 1000).toFixed(0)}K`;
  if (min && max) return `₹${fmt(min)} - ₹${fmt(max)}`;
  if (min) return `₹${fmt(min)}+`;
  return `Up to ₹${fmt(max!)}`;
}

export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState<{ job: Job; similar: Job[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    setLoading(true);
    jobsApi.get(id!).then(res => {
      setData(res.data);
      setBookmarked(!!res.data.job.is_bookmarked);
      setApplied(!!res.data.job.has_applied);
    }).catch(() => navigate('/jobs')).finally(() => setLoading(false));
  }, [id, navigate]);

  const toggleBookmark = async () => {
    if (!user) { navigate('/login'); return; }
    const res = await jobsApi.bookmark(parseInt(id!));
    setBookmarked(res.data.bookmarked);
    toast(res.data.bookmarked ? 'Job saved!' : 'Removed from saved', 'info');
  };

  const handleApply = async () => {
    if (!user) { navigate('/login'); return; }
    setApplying(true);
    try {
      await jobsApi.apply(parseInt(id!), coverLetter);
      setApplied(true);
      setShowApplyModal(false);
      toast('Application submitted successfully!');
    } catch (e: any) {
      if (e.response?.status === 409) {
        toast('You have already applied for this job', 'error');
        setApplied(true);
        setShowApplyModal(false);
      } else {
        toast('Failed to apply. Please try again.', 'error');
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-60" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { job, similar } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1">
        <Link to="/" className="hover:text-orange-500">Home</Link>
        <ChevronRight size={12} />
        <Link to="/jobs" className="hover:text-orange-500">Jobs</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700 truncate">{job.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Job header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4 mb-4">
              {job.company_logo ? (
                <img src={job.company_logo} alt={job.company_name} className="w-16 h-16 rounded-lg object-contain border border-gray-100 bg-gray-50 p-1 shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Building2 size={30} className="text-blue-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-800 mb-1">{job.title}</h1>
                <Link to={`/companies/${job.company_id}`} className="text-blue-600 hover:underline font-medium flex items-center gap-1 text-sm">
                  {job.company_name}
                  {job.company_verified && <CheckCircle size={14} className="text-blue-500" />}
                  {job.company_rating && (
                    <span className="flex items-center gap-0.5 text-amber-500 font-normal ml-1">
                      <Star size={12} fill="currentColor" /> {job.company_rating.toFixed(1)}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <InfoBox icon={MapPin} label="Location" value={job.location} />
              <InfoBox icon={IndianRupee} label="Salary" value={formatSalary(job.salary_min, job.salary_max)} />
              <InfoBox icon={Briefcase} label="Experience" value={job.experience_min === 0 && job.experience_max === 0 ? 'Fresher' : `${job.experience_min}-${job.experience_max} yrs`} />
              <InfoBox icon={Users} label="Openings" value={`${job.openings} position${job.openings > 1 ? 's' : ''}`} />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <JobTypeBadge type={job.type} />
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">{job.category}</span>
              {job.is_featured && <span className="px-2.5 py-0.5 rounded-full text-xs bg-orange-50 text-orange-600 border border-orange-200">⭐ Featured</span>}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock size={12} />{new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="flex items-center gap-1"><Eye size={12} />{job.views} views</span>
                {job.deadline && <span className="flex items-center gap-1 text-red-500"><Calendar size={12} />Apply by {new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={toggleBookmark} className={`p-2 rounded-lg border transition ${bookmarked ? 'border-orange-200 bg-orange-50 text-orange-500' : 'border-gray-200 text-gray-500 hover:border-orange-200 hover:text-orange-500'}`}>
                  {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>
                <button onClick={() => { navigator.share?.({ title: job.title, url: window.location.href }) || navigator.clipboard.writeText(window.location.href).then(() => toast('Link copied!')); }} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-500 transition">
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Apply / Applied Button */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
            {applied ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={18} />
                <span className="font-medium">Application Submitted</span>
                <span className="text-sm text-gray-500">· Track in your dashboard</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <AlertCircle size={16} className="text-orange-500" />
                {user ? 'Your profile will be shared with the employer' : 'Sign in to apply for this job'}
              </div>
            )}
            {!applied && (
              <button
                onClick={() => user ? setShowApplyModal(true) : navigate('/login')}
                className="bg-orange-500 text-white px-8 py-2.5 rounded-lg font-semibold text-sm hover:bg-orange-600 transition shrink-0"
              >
                Apply Now
              </button>
            )}
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Job Description</h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
              {job.description}
            </div>
          </div>

          {/* Skills */}
          {job.skills_required && job.skills_required.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills_required.map(skill => (
                  <span key={skill} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Qualifications */}
          {job.qualifications && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Qualifications</h2>
              <p className="text-gray-700 text-sm">{job.qualifications}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Company info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-3">About the Company</h3>
            <Link to={`/companies/${job.company_id}`} className="flex items-center gap-3 mb-3 group">
              {job.company_logo ? (
                <img src={job.company_logo} alt={job.company_name} className="w-12 h-12 rounded object-contain border border-gray-100 bg-gray-50 p-0.5" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-12 h-12 rounded bg-blue-50 flex items-center justify-center"><Building2 size={24} className="text-blue-400" /></div>
              )}
              <div>
                <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition text-sm">{job.company_name}</p>
                {job.company_industry && <p className="text-xs text-gray-500">{job.company_industry}</p>}
              </div>
            </Link>
            <div className="space-y-2 text-xs text-gray-600">
              {job.company_location && <div className="flex items-center gap-2"><MapPin size={13} className="text-gray-400" />{job.company_location}</div>}
              {job.company_size && <div className="flex items-center gap-2"><Users size={13} className="text-gray-400" />{job.company_size} employees</div>}
              {job.company_rating && (
                <div className="flex items-center gap-2">
                  <Star size={13} className="text-amber-400" fill="currentColor" />
                  {job.company_rating.toFixed(1)} Company Rating
                </div>
              )}
              {job.company_website && (
                <a href={job.company_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-500 hover:underline">
                  <Globe size={13} />Visit Website
                </a>
              )}
            </div>
            {job.company_description && (
              <p className="text-xs text-gray-500 mt-3 line-clamp-3">{job.company_description}</p>
            )}
            <Link to={`/companies/${job.company_id}`} className="mt-3 block text-center text-sm text-blue-600 hover:underline font-medium">
              View Company Profile →
            </Link>
          </div>

          {/* Job overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-3">Job Overview</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Posted</span>
                <span className="text-gray-700 font-medium">{new Date(job.created_at).toLocaleDateString('en-IN')}</span>
              </div>
              {job.deadline && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Deadline</span>
                  <span className="text-red-600 font-medium">{new Date(job.deadline).toLocaleDateString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Job Type</span>
                <span className="text-gray-700 font-medium capitalize">{job.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="text-gray-700 font-medium">{job.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Openings</span>
                <span className="text-gray-700 font-medium">{job.openings}</span>
              </div>
            </div>
          </div>

          {/* Similar jobs */}
          {similar.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-3 px-1">Similar Jobs</h3>
              <div className="space-y-3">
                {similar.map(j => <JobCard key={j.id} job={j} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Apply for {job.title}</h2>
              <button onClick={() => setShowApplyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Applying to <strong>{job.company_name}</strong>. Your profile will be shared with the recruiter.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Letter <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder="Tell the recruiter why you're a great fit for this role..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowApplyModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition disabled:opacity-60"
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
        <Icon size={12} />
        <span>{label}</span>
      </div>
      <div className="text-sm font-semibold text-gray-800">{value}</div>
    </div>
  );
}
