import { useState, useEffect } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { coursesApi } from '../api';
import { Course } from '../types';
import { CourseCard } from '../components/CourseCard';
import { Pagination } from '../components/ui/Pagination';
import { Skeleton } from '../components/ui/Skeleton';

const CATEGORIES = ['IT', 'Analytics', 'Marketing', 'Finance', 'Soft Skills', 'Cloud', 'Design'];

export function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [localQ, setLocalQ] = useState('');
  const [category, setCategory] = useState('');
  const [free, setFree] = useState(false);

  useEffect(() => {
    setLoading(true);
    coursesApi.list({ q: q || undefined, category: category || undefined, free: free || undefined, page, limit: 12 })
      .then(res => {
        setCourses(res.data.courses);
        setTotal(res.data.total);
        setPages(res.data.pages);
      })
      .finally(() => setLoading(false));
  }, [q, category, free, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Courses & Certifications</h1>
        <p className="text-sm text-gray-500 mt-1">Upgrade your skills and boost your career with curated courses</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form onSubmit={e => { e.preventDefault(); setQ(localQ); setPage(1); }} className="flex-1 flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition">
          <Search size={16} className="ml-3 text-gray-400 shrink-0" />
          <input value={localQ} onChange={e => setLocalQ(e.target.value)} placeholder="Search courses..." className="flex-1 px-3 py-2.5 text-sm outline-none" />
          <button type="submit" className="bg-green-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-green-700 transition">Search</button>
        </form>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="w-full sm:w-44 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm whitespace-nowrap">
          <input type="checkbox" checked={free} onChange={e => { setFree(e.target.checked); setPage(1); }} className="accent-green-600" />
          Free Only
        </label>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => { setCategory(''); setPage(1); }} className={`px-3 py-1 rounded-full text-xs font-medium border transition ${!category ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => { setCategory(c); setPage(1); }} className={`px-3 py-1 rounded-full text-xs font-medium border transition ${category === c ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}>{c}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-60" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
          <p>No courses found</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">{total} courses available</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {courses.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
          <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
