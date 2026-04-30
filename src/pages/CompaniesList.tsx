import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { companiesApi } from '../api';
import { Company } from '../types';
import { CompanyCard } from '../components/CompanyCard';
import { Pagination } from '../components/ui/Pagination';
import { Skeleton } from '../components/ui/Skeleton';

const INDUSTRIES = ['IT Services', 'E-Commerce', 'Banking', 'Manufacturing', 'Healthcare', 'Education', 'Media', 'Telecom'];

export function CompaniesList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [localQ, setLocalQ] = useState('');
  const [industry, setIndustry] = useState('');

  useEffect(() => {
    setLoading(true);
    companiesApi.list({ q: q || undefined, industry: industry || undefined, page, limit: 12 })
      .then(res => {
        setCompanies(res.data.companies);
        setTotal(res.data.total);
        setPages(res.data.pages);
      })
      .finally(() => setLoading(false));
  }, [q, industry, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Top Companies</h1>
        <p className="text-sm text-gray-500 mt-1">Explore {total} companies hiring freshers</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={e => { e.preventDefault(); setQ(localQ); setPage(1); }} className="flex-1 flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
          <Search size={16} className="ml-3 text-gray-400 shrink-0" />
          <input
            value={localQ}
            onChange={e => setLocalQ(e.target.value)}
            placeholder="Search companies..."
            className="flex-1 px-3 py-2.5 text-sm outline-none"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition">Search</button>
        </form>
        <select
          value={industry}
          onChange={e => { setIndustry(e.target.value); setPage(1); }}
          className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-blue-500"
        >
          <option value="">All Industries</option>
          {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Search size={40} className="mx-auto mb-3 text-gray-300" />
          <p>No companies found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {companies.map(c => <CompanyCard key={c.id} company={c} />)}
          </div>
          <Pagination page={page} pages={pages} total={total} onPageChange={p => { setPage(p); window.scrollTo(0, 0); }} />
        </>
      )}
    </div>
  );
}
