import { Link } from 'react-router-dom';
import { Briefcase, Mail, Globe, Share2, Link2, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-[#ff6600] text-white font-bold px-2 py-0.5 rounded text-lg">FW</div>
              <span className="font-bold text-white text-lg">FreshersWorld</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">India's leading job portal for fresh graduates and entry-level professionals.</p>
            <div className="flex gap-3">
              {[Globe, Share2, Link2, ExternalLink].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-orange-500 transition">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Job Seekers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/jobs" className="hover:text-orange-400 transition">Browse Jobs</Link></li>
              <li><Link to="/internships" className="hover:text-orange-400 transition">Internships</Link></li>
              <li><Link to="/govt-jobs" className="hover:text-orange-400 transition">Govt Jobs</Link></li>
              <li><Link to="/walkin" className="hover:text-orange-400 transition">Walk-in Jobs</Link></li>
              <li><Link to="/courses" className="hover:text-orange-400 transition">Courses</Link></li>
              <li><Link to="/dashboard/alerts" className="hover:text-orange-400 transition">Job Alerts</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Employers</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/employer/post-job" className="hover:text-orange-400 transition">Post a Job</Link></li>
              <li><Link to="/employer/dashboard" className="hover:text-orange-400 transition">Employer Dashboard</Link></li>
              <li><Link to="/employer/applications" className="hover:text-orange-400 transition">Manage Applications</Link></li>
              <li><Link to="/companies" className="hover:text-orange-400 transition">Company Profiles</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Job Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/jobs?category=IT" className="hover:text-orange-400 transition">IT & Software</Link></li>
              <li><Link to="/jobs?category=Analytics" className="hover:text-orange-400 transition">Data & Analytics</Link></li>
              <li><Link to="/jobs?category=Finance" className="hover:text-orange-400 transition">Finance</Link></li>
              <li><Link to="/jobs?category=Marketing" className="hover:text-orange-400 transition">Marketing</Link></li>
              <li><Link to="/jobs?category=HR" className="hover:text-orange-400 transition">Human Resources</Link></li>
              <li><Link to="/jobs?category=Banking" className="hover:text-orange-400 transition">Banking</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2"><Mail size={13} /> support@freshersworld.com</li>
              <li className="flex items-center gap-2"><Briefcase size={13} /> Mon-Sat: 9AM - 6PM IST</li>
            </ul>
            <div className="mt-4">
              <Link to="/register" className="inline-block bg-orange-500 text-white text-sm px-4 py-2 rounded hover:bg-orange-600 transition font-medium">
                Post Free Job
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} FreshersWorld. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-300">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300">Terms of Service</a>
            <a href="#" className="hover:text-gray-300">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
