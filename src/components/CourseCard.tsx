import { Star, Clock, Users, BookOpen } from 'lucide-react';
import { Course } from '../types';

export function CourseCard({ course }: { course: Course }) {
  return (
    <a href={course.url || '#'} target="_blank" rel="noopener noreferrer" className="bg-white rounded-lg border border-gray-200 hover:shadow-md hover:border-green-200 transition-all overflow-hidden group block">
      <div className="h-36 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
        {course.thumbnail_url && course.thumbnail_url.startsWith('http') ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={40} className="text-blue-400" />
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-800 text-sm group-hover:text-green-700 transition line-clamp-2">{course.title}</h3>
          {course.is_featured ? <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded shrink-0">Featured</span> : null}
        </div>
        {course.provider && <p className="text-xs text-blue-600 font-medium mb-2">{course.provider}</p>}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
          {course.rating > 0 && (
            <span className="flex items-center gap-1 text-amber-500">
              <Star size={11} fill="currentColor" />
              {course.rating.toFixed(1)}
            </span>
          )}
          {course.duration && <span className="flex items-center gap-1"><Clock size={11} />{course.duration}</span>}
          {course.enrollments > 0 && (
            <span className="flex items-center gap-1"><Users size={11} />{course.enrollments >= 1000 ? `${(course.enrollments / 1000).toFixed(0)}K` : course.enrollments}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold ${course.price === 0 ? 'text-green-600' : 'text-gray-800'}`}>
            {course.price === 0 ? 'FREE' : `₹${course.price.toLocaleString()}`}
          </span>
          {course.category && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{course.category}</span>
          )}
        </div>
      </div>
    </a>
  );
}
