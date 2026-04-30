import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Globe, Users, Star, CheckCircle, Briefcase,
  ThumbsUp, ThumbsDown, Building2, ChevronRight, X
} from 'lucide-react';
import { companiesApi } from '../api';
import { Company, Job, CompanyReview } from '../types';
import { JobTypeBadge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Skeleton } from '../components/ui/Skeleton';

export function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState<{ company: Company; jobs: Job[]; reviews: CompanyReview[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'reviews'>('overview');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 0, title: '', review: '', pros: '', cons: '' });

  useEffect(() => {
    companiesApi.get(id!)
      .then(res => setData(res.data))
      .catch(() => navigate('/companies'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const submitReview = async () => {
    if (!user) { navigate('/login'); return; }
    if (!reviewData.rating) { toast('Please select a rating', 'error'); return; }
    try {
      await companiesApi.addReview(parseInt(id!), reviewData);
      toast('Review submitted!');
      setShowReviewModal(false);
      const res = await companiesApi.get(id!);
      setData(res.data);
    } catch (e: any) {
      if (e.response?.status === 409) toast('You have already reviewed this company', 'error');
      else toast('Failed to submit review', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return null;
  const { company, jobs, reviews } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1">
        <Link to="/" className="hover:text-orange-500">Home</Link>
        <ChevronRight size={12} />
        <Link to="/companies" className="hover:text-orange-500">Companies</Link>
        <ChevronRight size={12} />
        <span className="text-gray-700">{company.name}</span>
      </nav>

      {/* Company header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-24 md:h-32" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-4">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-20 h-20 rounded-xl border-4 border-white bg-white object-contain shadow-md p-1" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="w-20 h-20 rounded-xl border-4 border-white bg-blue-50 flex items-center justify-center shadow-md">
                <Building2 size={36} className="text-blue-400" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-800">{company.name}</h1>
                {company.is_verified && <CheckCircle size={18} className="text-blue-500" />}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                {company.industry && <span>{company.industry}</span>}
                {company.location && <span className="flex items-center gap-1"><MapPin size={13} />{company.location}</span>}
                {company.size && <span className="flex items-center gap-1"><Users size={13} />{company.size} employees</span>}
                {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline"><Globe size={13} />Website</a>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {user?.role === 'jobseeker' && (
                <button onClick={() => setShowReviewModal(true)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                  Write Review
                </button>
              )}
              {jobs.length > 0 && (
                <button onClick={() => setActiveTab('jobs')} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition">
                  View {company.open_jobs} Jobs
                </button>
              )}
            </div>
          </div>

          {company.rating > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600">{company.rating.toFixed(1)}</div>
                <div className="flex">
                  {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= Math.round(company.rating) ? 'text-amber-400' : 'text-gray-300'} fill="currentColor" />)}
                </div>
                <div className="text-xs text-gray-500">{company.review_count?.toLocaleString()} reviews</div>
              </div>
              <div className="flex-1 space-y-1">
                {[5,4,3,2,1].map(s => (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-gray-500">{s}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${Math.max(5, 100 - Math.abs(s - company.rating) * 20)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-100">
          {(['overview', 'jobs', 'reviews'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition ${activeTab === tab ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab === 'jobs' ? `Jobs (${jobs.length})` : tab === 'reviews' ? `Reviews (${reviews.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">About {company.name}</h2>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{company.description || 'No description available.'}</p>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Open Positions</h2>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No open positions right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job: any) => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-200 hover:bg-orange-50 transition group">
                  <div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-orange-600 text-sm">{job.title}</h3>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                      <JobTypeBadge type={job.type} />
                    </div>
                  </div>
                  <span className="text-orange-500 text-sm font-medium group-hover:translate-x-1 transition-transform">Apply →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              <Star size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No reviews yet. Be the first to review!</p>
              {user?.role === 'jobseeker' && (
                <button onClick={() => setShowReviewModal(true)} className="mt-3 text-orange-500 font-medium hover:underline">Write a Review</button>
              )}
            </div>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{r.user_name || 'Anonymous'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= r.rating ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />)}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                {r.title && <h4 className="font-semibold text-gray-700 mb-2 text-sm">{r.title}</h4>}
                {r.review && <p className="text-gray-600 text-sm mb-3">{r.review}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {r.pros && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-1"><ThumbsUp size={11} />Pros</p>
                      <p className="text-xs text-green-800">{r.pros}</p>
                    </div>
                  )}
                  {r.cons && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-1"><ThumbsDown size={11} />Cons</p>
                      <p className="text-xs text-red-800">{r.cons}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Review modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Review {company.name}</h2>
              <button onClick={() => setShowReviewModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setReviewData(d => ({ ...d, rating: s }))} className="transition hover:scale-110">
                      <Star size={28} className={s <= reviewData.rating ? 'text-amber-400' : 'text-gray-300'} fill={s <= reviewData.rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <FormField label="Review Title" value={reviewData.title} onChange={v => setReviewData(d => ({ ...d, title: v }))} placeholder="Sum up your experience" />
              <FormField label="Review" value={reviewData.review} onChange={v => setReviewData(d => ({ ...d, review: v }))} placeholder="Describe your experience at this company..." textarea />
              <FormField label="Pros" value={reviewData.pros} onChange={v => setReviewData(d => ({ ...d, pros: v }))} placeholder="What do you like?" textarea />
              <FormField label="Cons" value={reviewData.cons} onChange={v => setReviewData(d => ({ ...d, cons: v }))} placeholder="What could be improved?" textarea />
              <div className="flex gap-3">
                <button onClick={() => setShowReviewModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={submitReview} className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition">Submit Review</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, textarea }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400";
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${cls} resize-none`} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}
