import { Link } from 'react-router-dom';
import { MapPin, Clock, IndianRupee, Bookmark, BookmarkCheck, Building2, Star, Users } from 'lucide-react';
import { Job } from '../types';
import { JobTypeBadge } from './ui/Badge';
import { jobsApi } from '../api';
import { useToast } from './ui/Toast';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function formatSalary(min?: number, max?: number) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L` : `${(n / 1000).toFixed(0)}K`;
  if (min && max) return `₹${fmt(min)} - ₹${fmt(max)} PA`;
  if (min) return `₹${fmt(min)}+ PA`;
  return `Up to ₹${fmt(max!)} PA`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

interface JobCardProps {
  job: Job;
  onBookmarkChange?: (id: number, bookmarked: boolean) => void;
  showApplyButton?: boolean;
}

export function JobCard({ job, onBookmarkChange, showApplyButton = false }: JobCardProps) {
  const [bookmarked, setBookmarked] = useState(!!job.is_bookmarked);
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    try {
      const res = await jobsApi.bookmark(job.id);
      setBookmarked(res.data.bookmarked);
      toast(res.data.bookmarked ? 'Job saved!' : 'Job removed from saved', res.data.bookmarked ? 'success' : 'info');
      onBookmarkChange?.(job.id, res.data.bookmarked);
    } catch {
      toast('Failed to update bookmark', 'error');
    }
  };

  const salary = formatSalary(job.salary_min, job.salary_max);

  return (
    <Link to={`/jobs/${job.id}`} className="block bg-white rounded-lg border border-gray-200 hover:shadow-md hover:border-orange-200 transition-all duration-200 overflow-hidden group">
      <div className="p-4">
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            {job.company_logo ? (
              <img
                src={job.company_logo}
                alt={job.company_name}
                className="w-11 h-11 rounded object-contain border border-gray-100 shrink-0 bg-gray-50 p-0.5"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-11 h-11 rounded bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-blue-600" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-800 text-sm group-hover:text-orange-600 transition truncate">{job.title}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <span className="font-medium text-gray-700">{job.company_name}</span>
                {job.company_verified && (
                  <span className="text-blue-500" title="Verified Company">✓</span>
                )}
                {job.company_rating && (
                  <span className="flex items-center gap-0.5 text-amber-500">
                    <Star size={10} fill="currentColor" />
                    {job.company_rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={toggleBookmark} className="text-gray-400 hover:text-orange-500 transition shrink-0 mt-0.5">
            {bookmarked ? <BookmarkCheck size={17} className="text-orange-500" /> : <Bookmark size={17} />}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
          {salary && <span className="flex items-center gap-1"><IndianRupee size={12} />{salary}</span>}
          <span className="flex items-center gap-1">
            <Users size={12} />
            {job.experience_min === 0 && job.experience_max === 0 ? 'Fresher' : `${job.experience_min}-${job.experience_max} yrs`}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          <JobTypeBadge type={job.type} />
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">{job.category}</span>
          {job.is_featured ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-50 text-orange-600 border border-orange-200">⭐ Featured</span> : null}
        </div>

        {job.skills_required && job.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {job.skills_required.slice(0, 4).map(s => (
              <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">{s}</span>
            ))}
            {job.skills_required.length > 4 && (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded border border-gray-200">+{job.skills_required.length - 4}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
          <span className="flex items-center gap-1"><Clock size={11} />{timeAgo(job.created_at)}</span>
          {job.openings > 1 && <span>{job.openings} openings</span>}
          {job.deadline && <span>Apply by {new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
        </div>
      </div>
      {showApplyButton && (
        <div className="px-4 pb-3">
          <div className="w-full py-2 bg-orange-500 text-white text-sm font-medium rounded text-center group-hover:bg-orange-600 transition">
            Apply Now
          </div>
        </div>
      )}
    </Link>
  );
}
