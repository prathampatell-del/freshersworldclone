import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { usersApi } from '../../api';
import { Job } from '../../types';
import { JobCard } from '../../components/JobCard';
import { Pagination } from '../../components/ui/Pagination';

export function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    usersApi.bookmarks({ page, limit: 12 })
      .then(res => {
        setBookmarks(res.data.bookmarks);
        setTotal(res.data.total);
        setPages(res.data.pages);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Saved Jobs</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} saved jobs</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bookmark size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">No saved jobs</h3>
          <p className="text-sm text-gray-500 mb-4">Save jobs you're interested in to apply later</p>
          <Link to="/jobs" className="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition">Browse Jobs</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookmarks.map(job => (
              <JobCard
                key={job.id}
                job={{ ...job, is_bookmarked: true }}
                onBookmarkChange={(id, bk) => {
                  if (!bk) setBookmarks(prev => prev.filter(j => j.id !== id));
                }}
              />
            ))}
          </div>
          <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
