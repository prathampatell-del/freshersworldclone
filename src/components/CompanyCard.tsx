import { Link } from 'react-router-dom';
import { MapPin, Star, Users, Building2, CheckCircle } from 'lucide-react';
import { Company } from '../types';

export function CompanyCard({ company }: { company: Company }) {
  return (
    <Link to={`/companies/${company.id}`} className="bg-white rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all p-4 flex flex-col items-center text-center group">
      {company.logo_url ? (
        <img
          src={company.logo_url}
          alt={company.name}
          className="w-16 h-16 object-contain mb-3 rounded"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-3">
          <Building2 size={28} className="text-blue-600" />
        </div>
      )}
      <div className="flex items-center gap-1 mb-1">
        <h3 className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition">{company.name}</h3>
        {company.is_verified && <CheckCircle size={13} className="text-blue-500 shrink-0" />}
      </div>
      {company.industry && <p className="text-xs text-gray-500 mb-2">{company.industry}</p>}
      <div className="flex items-center justify-center gap-3 text-xs text-gray-500 mb-3">
        {company.location && <span className="flex items-center gap-1"><MapPin size={11} />{company.location.split(',')[0]}</span>}
        {company.size && <span className="flex items-center gap-1"><Users size={11} />{company.size}</span>}
      </div>
      <div className="flex items-center justify-center gap-3 text-xs">
        {company.rating > 0 && (
          <span className="flex items-center gap-1 text-amber-500">
            <Star size={12} fill="currentColor" />
            {company.rating.toFixed(1)}
            <span className="text-gray-400">({company.review_count?.toLocaleString()})</span>
          </span>
        )}
        {company.open_jobs !== undefined && (
          <span className="text-orange-600 font-medium">{company.open_jobs} open jobs</span>
        )}
      </div>
    </Link>
  );
}
