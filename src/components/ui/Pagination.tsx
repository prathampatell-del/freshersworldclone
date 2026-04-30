import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pages, total, onPageChange }: PaginationProps) {
  if (pages <= 1) return null;

  const getPages = () => {
    const p: (number | '...')[] = [];
    if (pages <= 7) {
      for (let i = 1; i <= pages; i++) p.push(i);
    } else {
      p.push(1);
      if (page > 3) p.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) p.push(i);
      if (page < pages - 2) p.push('...');
      p.push(pages);
    }
    return p;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition"
      >
        <ChevronLeft size={16} />
      </button>
      {getPages().map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 py-1 text-gray-400">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`min-w-[36px] px-3 py-1.5 rounded border text-sm font-medium transition ${
              p === page
                ? 'bg-orange-500 text-white border-orange-500'
                : 'border-gray-300 hover:bg-gray-100 text-gray-700'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="p-2 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition"
      >
        <ChevronRight size={16} />
      </button>
      <span className="ml-2 text-xs text-gray-500">{total} results</span>
    </div>
  );
}
