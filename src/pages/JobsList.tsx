import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { jobsApi, JobFilters } from '../api/jobs';
import { Job } from '../types';
import { JobCard } from '../components/JobCard';
import { Pagination } from '../components/ui/Pagination';
import { JobCardSkeleton } from '../components/ui/Skeleton';

const CATEGORIES = ['IT', 'Analytics', 'Finance', 'Marketing', 'HR', 'Operations', 'BPO', 'Banking', 'Teaching', 'Healthcare'];
const LOCATIONS = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Noida', 'Kolkata'];
const SALARY_RANGES = [
  { label: 'Any', min: undefined, max: undefined },
  { label: 'Under ₹3L', min: undefined, max: 300000 },
  { label: '₹3L - ₹5L', min: 300000, max: 500000 },
  { label: '₹5L - ₹8L', min: 500000, max: 800000 },
  { label: '₹8L+', min: 800000, max: undefined },
];

interface FilterState {
  q: string;
  location: string;
  type: string;
  category: string;
  salaryIdx: number;
  experience: string;
}

interface JobsListProps {
  presetType?: string;
  title?: string;
}

export function JobsList({ presetType, title }: JobsListProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    q: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    type: presetType || searchParams.get('type') || '',
    category: searchParams.get('category') || '',
    salaryIdx: 0,
    experience: '',
  });
  const [page, setPage] = useState(1);
  const [localQ, setLocalQ] = useState(filters.q);

  const fetchJobs = useCallback(async (f: FilterState, p: number) => {
    setLoading(true);
    try {
      const salaryRange = SALARY_RANGES[f.salaryIdx];
      const params: JobFilters = {
        q: f.q || undefined,
        location: f.location || undefined,
        type: f.type || undefined,
        category: f.category || undefined,
        salary_min: salaryRange.min,
        salary_max: salaryRange.max,
        experience: f.experience ? parseInt(f.experience) : undefined,
        page: p,
        limit: 12,
      };
      const res = await jobsApi.list(params);
      setJobs(res.data.jobs);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(filters, page);
  }, [filters, page, fetchJobs]);

  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    const locParam = searchParams.get('location') || '';
    const catParam = searchParams.get('category') || '';
    setFilters(f => ({ ...f, q: qParam, location: locParam, category: catParam }));
    setLocalQ(qParam);
    setPage(1);
  }, [searchParams]);

  const setFilter = (key: keyof FilterState, value: any) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilter = (key: keyof FilterState) => setFilter(key, key === 'salaryIdx' ? 0 : '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter('q', localQ);
  };

  const activeFilterCount = [filters.location, filters.type, filters.category, filters.experience, filters.salaryIdx > 0 ? '1' : ''].filter(Boolean).length;

  const pageTitle = title || (presetType === 'internship' ? 'Internships' : presetType === 'walkin' ? 'Walk-in Jobs' : presetType === 'govt' ? 'Government Jobs' : 'All Jobs');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
        {!loading && <p className="text-sm text-gray-500 mt-1">{total.toLocaleString()} jobs found</p>}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center border border-gray-300 rounded-lg bg-white hover:border-orange-400 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition overflow-hidden">
          <Search size={16} className="ml-3 text-gray-400 shrink-0" />
          <input
            value={localQ}
            onChange={e => setLocalQ(e.target.value)}
            placeholder="Search by job title, skill, or keyword..."
            className="flex-1 px-3 py-2.5 text-sm outline-none"
          />
          {localQ && (
            <button type="button" onClick={() => { setLocalQ(''); setFilter('q', ''); }} className="mr-2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <button type="submit" className="bg-orange-500 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-orange-600 transition">Search</button>
        <button
          type="button"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm font-medium relative"
        >
          <Filter size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </form>

      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.type && !presetType && (
            <FilterTag label={filters.type} onRemove={() => clearFilter('type')} />
          )}
          {filters.category && <FilterTag label={filters.category} onRemove={() => clearFilter('category')} />}
          {filters.location && <FilterTag label={filters.location} onRemove={() => clearFilter('location')} />}
          {filters.experience && <FilterTag label={`${filters.experience} yrs exp`} onRemove={() => clearFilter('experience')} />}
          {filters.salaryIdx > 0 && <FilterTag label={SALARY_RANGES[filters.salaryIdx].label} onRemove={() => clearFilter('salaryIdx')} />}
          <button
            onClick={() => { setFilters(f => ({ ...f, location: '', type: presetType || '', category: '', salaryIdx: 0, experience: '' })); setPage(1); }}
            className="text-xs text-red-500 hover:underline px-2 py-1"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={`w-60 shrink-0 space-y-4 ${showMobileFilters ? 'block' : 'hidden'} lg:block`}>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-orange-500" />
              Filters
            </h3>

            {/* Job Type */}
            {!presetType && (
              <FilterSection title="Job Type">
                {['fulltime', 'internship', 'walkin', 'govt'].map(t => (
                  <FilterCheckbox
                    key={t}
                    label={t === 'fulltime' ? 'Full Time' : t === 'walkin' ? 'Walk-in' : t === 'govt' ? 'Government' : 'Internship'}
                    checked={filters.type === t}
                    onChange={() => setFilter('type', filters.type === t ? '' : t)}
                  />
                ))}
              </FilterSection>
            )}

            {/* Category */}
            <FilterSection title="Category">
              {CATEGORIES.map(c => (
                <FilterCheckbox
                  key={c}
                  label={c}
                  checked={filters.category === c}
                  onChange={() => setFilter('category', filters.category === c ? '' : c)}
                />
              ))}
            </FilterSection>

            {/* Location */}
            <FilterSection title="Location">
              {LOCATIONS.map(l => (
                <FilterCheckbox
                  key={l}
                  label={l}
                  checked={filters.location === l}
                  onChange={() => setFilter('location', filters.location === l ? '' : l)}
                />
              ))}
            </FilterSection>

            {/* Experience */}
            <FilterSection title="Experience">
              {['0', '1', '2', '3'].map(e => (
                <FilterCheckbox
                  key={e}
                  label={e === '0' ? 'Fresher (0 yrs)' : `${e} year${e !== '1' ? 's' : ''}`}
                  checked={filters.experience === e}
                  onChange={() => setFilter('experience', filters.experience === e ? '' : e)}
                />
              ))}
            </FilterSection>

            {/* Salary */}
            <FilterSection title="Salary Range">
              {SALARY_RANGES.map((s, i) => (
                i > 0 && (
                  <FilterCheckbox
                    key={i}
                    label={s.label}
                    checked={filters.salaryIdx === i}
                    onChange={() => setFilter('salaryIdx', filters.salaryIdx === i ? 0 : i)}
                  />
                )
              ))}
            </FilterSection>
          </div>
        </aside>

        {/* Job listings */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Search size={40} className="text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700 mb-1">No jobs found</h3>
              <p className="text-sm text-gray-500 mb-4">Try adjusting your search or filters</p>
              <button
                onClick={() => { setFilters({ q: '', location: '', type: presetType || '', category: '', salaryIdx: 0, experience: '' }); setLocalQ(''); }}
                className="text-orange-500 text-sm font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map(job => <JobCard key={job.id} job={job} />)}
              </div>
              <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-200">
      {label}
      <button onClick={onRemove} className="hover:text-orange-900"><X size={11} /></button>
    </span>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-sm font-semibold text-gray-700 mb-2">
        {title}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-1">{children}</div>}
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer hover:text-orange-600 transition text-sm text-gray-600 py-0.5">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-orange-500" />
      {label}
    </label>
  );
}
