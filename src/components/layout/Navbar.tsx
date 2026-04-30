import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Bell, Bookmark, User, LogOut, Briefcase, Menu, X, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/jobs?q=${encodeURIComponent(q.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    toast('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      {/* Top bar */}
      <div className="bg-[#003580] text-white text-xs py-1">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span>India's No.1 Fresher Job Portal</span>
          <div className="flex gap-4">
            <Link to="/govt-jobs" className="hover:text-orange-300">Govt Jobs</Link>
            <Link to="/internships" className="hover:text-orange-300">Internships</Link>
            <Link to="/walkin" className="hover:text-orange-300">Walk-in</Link>
            <Link to="/courses" className="hover:text-orange-300">Courses</Link>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="bg-[#ff6600] text-white font-bold text-xl px-3 py-1 rounded">FW</div>
          <span className="font-bold text-[#003580] text-lg hidden sm:block">FreshersWorld</span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex items-center border border-gray-300 rounded-lg overflow-hidden hover:border-orange-400 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition">
          <Search size={16} className="ml-3 text-gray-400 shrink-0" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search jobs, companies, skills..."
            className="flex-1 px-3 py-2 text-sm outline-none"
          />
          <button type="submit" className="bg-[#ff6600] text-white px-4 py-2 text-sm font-medium hover:bg-[#e05500] transition shrink-0">
            Search
          </button>
        </form>

        {/* Nav links */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-gray-700">
          <div className="relative group">
            <button className="flex items-center gap-1 px-3 py-2 rounded hover:bg-gray-100 hover:text-orange-600 transition">
              Jobs <ChevronDown size={14} />
            </button>
            <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg border border-gray-100 w-44 py-1 hidden group-hover:block z-50">
              <Link to="/jobs" className="block px-4 py-2 hover:bg-gray-50 text-gray-700">All Jobs</Link>
              <Link to="/jobs?type=fulltime" className="block px-4 py-2 hover:bg-gray-50 text-gray-700">Full Time</Link>
              <Link to="/internships" className="block px-4 py-2 hover:bg-gray-50 text-gray-700">Internships</Link>
              <Link to="/walkin" className="block px-4 py-2 hover:bg-gray-50 text-gray-700">Walk-in</Link>
              <Link to="/govt-jobs" className="block px-4 py-2 hover:bg-gray-50 text-gray-700">Govt Jobs</Link>
            </div>
          </div>
          <Link to="/companies" className="px-3 py-2 rounded hover:bg-gray-100 hover:text-orange-600 transition">Companies</Link>
          <Link to="/courses" className="px-3 py-2 rounded hover:bg-gray-100 hover:text-orange-600 transition">Courses</Link>
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <>
              <Link to="/dashboard/bookmarks" className="p-2 text-gray-600 hover:text-orange-600 transition hidden sm:block" title="Saved Jobs">
                <Bookmark size={18} />
              </Link>
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-gray-200 hover:border-orange-300 transition text-sm"
                >
                  <div className="w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold text-xs">
                    {user.name[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-gray-700 font-medium max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={12} className="text-gray-500" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl w-52 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    {user.role === 'employer' ? (
                      <>
                        <Link to="/employer/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"><Briefcase size={14} /> Dashboard</Link>
                        <Link to="/employer/post-job" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"><Building2 size={14} /> Post a Job</Link>
                      </>
                    ) : (
                      <>
                        <Link to="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"><Briefcase size={14} /> Dashboard</Link>
                        <Link to="/dashboard/applications" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"><Bell size={14} /> Applications</Link>
                        <Link to="/dashboard/bookmarks" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"><Bookmark size={14} /> Saved Jobs</Link>
                      </>
                    )}
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"><User size={14} /> My Profile</Link>
                    <div className="border-t border-gray-100 mt-1">
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-1.5 text-sm font-medium text-[#003580] border border-[#003580] rounded hover:bg-blue-50 transition">Login</Link>
              <Link to="/register" className="px-4 py-1.5 text-sm font-medium text-white bg-[#ff6600] rounded hover:bg-[#e05500] transition">Register</Link>
            </div>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-gray-600">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <form onSubmit={handleSearch} className="flex items-center gap-2 p-4 border-b border-gray-100">
            <Search size={16} className="text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search jobs..." className="flex-1 outline-none text-sm" />
            <button type="submit" className="text-orange-600 font-medium text-sm">Go</button>
          </form>
          <nav className="p-2 space-y-1 text-sm">
            <Link to="/jobs" onClick={() => setMobileOpen(false)} className="block px-4 py-2 hover:bg-gray-50 rounded text-gray-700">All Jobs</Link>
            <Link to="/internships" onClick={() => setMobileOpen(false)} className="block px-4 py-2 hover:bg-gray-50 rounded text-gray-700">Internships</Link>
            <Link to="/walkin" onClick={() => setMobileOpen(false)} className="block px-4 py-2 hover:bg-gray-50 rounded text-gray-700">Walk-in</Link>
            <Link to="/govt-jobs" onClick={() => setMobileOpen(false)} className="block px-4 py-2 hover:bg-gray-50 rounded text-gray-700">Govt Jobs</Link>
            <Link to="/companies" onClick={() => setMobileOpen(false)} className="block px-4 py-2 hover:bg-gray-50 rounded text-gray-700">Companies</Link>
            <Link to="/courses" onClick={() => setMobileOpen(false)} className="block px-4 py-2 hover:bg-gray-50 rounded text-gray-700">Courses</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
