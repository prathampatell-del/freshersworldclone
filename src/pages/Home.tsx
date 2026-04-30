import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, MapPin, TrendingUp, Briefcase, BookOpen,
  Building2, ChevronRight, Bell, CheckCircle, ArrowRight,
  Code, DollarSign, Megaphone, Users, HeartPulse, Calculator, GraduationCap, BarChart3
} from 'lucide-react';
import { jobsApi } from '../api/jobs';
import { companiesApi, coursesApi } from '../api';
import { Job, Company, Course } from '../types';
import { JobCard } from '../components/JobCard';
import { CompanyCard } from '../components/CompanyCard';
import { CourseCard } from '../components/CourseCard';

const JOB_CATEGORIES = [
  { name: 'IT & Software', icon: Code, color: 'bg-blue-50 text-blue-600 border-blue-100', query: 'IT' },
  { name: 'Finance', icon: DollarSign, color: 'bg-green-50 text-green-600 border-green-100', query: 'Finance' },
  { name: 'Marketing', icon: Megaphone, color: 'bg-purple-50 text-purple-600 border-purple-100', query: 'Marketing' },
  { name: 'HR', icon: Users, color: 'bg-orange-50 text-orange-600 border-orange-100', query: 'HR' },
  { name: 'Healthcare', icon: HeartPulse, color: 'bg-red-50 text-red-600 border-red-100', query: 'Healthcare' },
  { name: 'Accounts', icon: Calculator, color: 'bg-yellow-50 text-yellow-600 border-yellow-100', query: 'Accounts' },
  { name: 'Teaching', icon: GraduationCap, color: 'bg-teal-50 text-teal-600 border-teal-100', query: 'Teaching' },
  { name: 'Analytics', icon: BarChart3, color: 'bg-indigo-50 text-indigo-600 border-indigo-100', query: 'Analytics' },
];

const POPULAR_SEARCHES = ['Software Engineer', 'Data Analyst', 'HR Fresher', 'MBA Finance', 'Java Developer', 'Python', 'Digital Marketing', 'IBPS PO'];

export function Home() {
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    jobsApi.list({ featured: true, limit: 6 }).then(r => setFeaturedJobs(r.data.jobs));
    jobsApi.list({ limit: 8 }).then(r => setLatestJobs(r.data.jobs));
    companiesApi.list({ limit: 8 }).then(r => setCompanies(r.data.companies));
    coursesApi.list({ featured: true, limit: 4 }).then(r => setCourses(r.data.courses));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (location) params.set('location', location);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#003580] via-[#004ba0] to-[#0052cc] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-sm px-4 py-1.5 rounded-full mb-6 border border-white/20">
              <TrendingUp size={14} />
              <span>Over 50,000+ Active Job Listings</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Find Your Dream <span className="text-[#ff6600]">Job</span> Today
            </h1>
            <p className="text-blue-100 text-lg mb-8">
              India's #1 platform for freshers, students, and early-career professionals. Discover jobs, internships, and government opportunities.
            </p>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="bg-white rounded-xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl">
              <div className="flex items-center flex-1 min-w-0 bg-gray-50 rounded-lg px-3 gap-2">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Job title, skills, or keywords"
                  className="flex-1 py-2.5 text-gray-800 bg-transparent outline-none text-sm"
                />
              </div>
              <div className="flex items-center w-full sm:w-44 bg-gray-50 rounded-lg px-3 gap-2">
                <MapPin size={16} className="text-gray-400 shrink-0" />
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="City or state"
                  className="flex-1 py-2.5 text-gray-800 bg-transparent outline-none text-sm"
                />
              </div>
              <button type="submit" className="bg-[#ff6600] text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-[#e05500] transition shrink-0 text-sm">
                Search Jobs
              </button>
            </form>

            {/* Popular searches */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-blue-200">Popular:</span>
              {POPULAR_SEARCHES.map(s => (
                <button
                  key={s}
                  onClick={() => navigate(`/jobs?q=${encodeURIComponent(s)}`)}
                  className="text-white/80 hover:text-white hover:underline transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white/5 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Active Jobs', value: '50,000+' },
              { label: 'Companies', value: '5,000+' },
              { label: 'Registered Users', value: '10M+' },
              { label: 'Hired Last Month', value: '25,000+' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-blue-200 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Type Quick Links */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Fresh Grad Jobs', sub: 'Entry level roles', href: '/jobs', icon: Briefcase, color: 'border-blue-200 bg-blue-50 hover:border-blue-400' },
            { label: 'Internships', sub: '3-6 month programs', href: '/internships', icon: BookOpen, color: 'border-green-200 bg-green-50 hover:border-green-400' },
            { label: 'Walk-in Jobs', sub: 'Direct hiring drives', href: '/walkin', icon: Users, color: 'border-orange-200 bg-orange-50 hover:border-orange-400' },
            { label: 'Govt Jobs', sub: 'PSU & central/state', href: '/govt-jobs', icon: Building2, color: 'border-purple-200 bg-purple-50 hover:border-purple-400' },
          ].map(item => (
            <Link
              key={item.label}
              to={item.href}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${item.color} group`}
            >
              <item.icon size={24} className="text-current opacity-70 shrink-0" />
              <div>
                <div className="font-semibold text-gray-800 text-sm">{item.label}</div>
                <div className="text-xs text-gray-500">{item.sub}</div>
              </div>
              <ChevronRight size={14} className="ml-auto text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      </section>

      {/* Browse by Category */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Browse by Category</h2>
          <Link to="/jobs" className="text-orange-500 text-sm font-medium hover:underline flex items-center gap-1">
            All Categories <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {JOB_CATEGORIES.map(cat => (
            <Link
              key={cat.name}
              to={`/jobs?category=${cat.query}`}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${cat.color} hover:shadow-md transition-all text-center group`}
            >
              <cat.icon size={24} />
              <span className="text-xs font-medium text-gray-700 group-hover:text-current">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Featured Jobs</h2>
          <Link to="/jobs?featured=true" className="text-orange-500 text-sm font-medium hover:underline flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredJobs.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      </section>

      {/* Alert CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-gradient-to-r from-[#ff6600] to-[#ff8533] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={20} />
              <h2 className="text-xl font-bold">Get Free Job Alerts</h2>
            </div>
            <p className="text-orange-100 text-sm">Get matching job alerts delivered to your inbox daily. Never miss an opportunity!</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); navigate('/register'); }} className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 md:w-64 px-4 py-2.5 rounded-lg text-gray-800 text-sm outline-none"
            />
            <button type="submit" className="bg-[#003580] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#002a6a] transition whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Latest Jobs</h2>
          <Link to="/jobs" className="text-orange-500 text-sm font-medium hover:underline flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {latestJobs.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      </section>

      {/* Top Companies */}
      <section className="bg-white border-y border-gray-200 py-8 my-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Top Hiring Companies</h2>
            <Link to="/companies" className="text-orange-500 text-sm font-medium hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {companies.slice(0, 8).map(c => <CompanyCard key={c.id} company={c} />)}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Upgrade Your Skills</h2>
            <p className="text-sm text-gray-500">Curated courses to boost your career</p>
          </div>
          <Link to="/courses" className="text-orange-500 text-sm font-medium hover:underline flex items-center gap-1">
            All Courses <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {courses.map(c => <CourseCard key={c.id} course={c} />)}
        </div>
      </section>

      {/* Why FreshersWorld */}
      <section className="bg-gradient-to-br from-gray-900 to-[#003580] text-white py-12 my-4">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Why FreshersWorld?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: CheckCircle, title: 'Verified Companies', desc: 'All companies are verified for authenticity and legitimacy' },
              { icon: Bell, title: 'Real-time Alerts', desc: 'Get instant notifications for matching job openings' },
              { icon: TrendingUp, title: 'Career Growth', desc: 'Resources and courses to accelerate your career' },
              { icon: Users, title: 'Large Community', desc: 'Join 10M+ freshers who found their first job with us' },
            ].map(f => (
              <div key={f.title} className="text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-gray-300">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
