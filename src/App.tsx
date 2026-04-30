import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { JobsList } from './pages/JobsList';
import { JobDetail } from './pages/JobDetail';
import { CompaniesList } from './pages/CompaniesList';
import { CompanyProfile } from './pages/CompanyProfile';
import { Courses } from './pages/Courses';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/dashboard/Dashboard';
import { MyApplications } from './pages/dashboard/MyApplications';
import { Bookmarks } from './pages/dashboard/Bookmarks';
import { Alerts } from './pages/dashboard/Alerts';
import { Profile } from './pages/Profile';
import { EmployerDashboard } from './pages/employer/EmployerDashboard';
import { PostJob } from './pages/employer/PostJob';
import { ManageApplications } from './pages/employer/ManageApplications';
import { useAuth } from './contexts/AuthContext';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Auth pages - no navbar/footer */}
      <Route path="/login" element={<AuthGuard><Login /></AuthGuard>} />
      <Route path="/register" element={<AuthGuard><Register /></AuthGuard>} />

      {/* Main app with navbar/footer */}
      <Route path="/" element={<AppLayout><Home /></AppLayout>} />
      <Route path="/jobs" element={<AppLayout><JobsList /></AppLayout>} />
      <Route path="/jobs/:id" element={<AppLayout><JobDetail /></AppLayout>} />
      <Route path="/internships" element={<AppLayout><JobsList presetType="internship" title="Internships" /></AppLayout>} />
      <Route path="/walkin" element={<AppLayout><JobsList presetType="walkin" title="Walk-in Jobs" /></AppLayout>} />
      <Route path="/govt-jobs" element={<AppLayout><JobsList presetType="govt" title="Government Jobs" /></AppLayout>} />
      <Route path="/companies" element={<AppLayout><CompaniesList /></AppLayout>} />
      <Route path="/companies/:id" element={<AppLayout><CompanyProfile /></AppLayout>} />
      <Route path="/courses" element={<AppLayout><Courses /></AppLayout>} />

      {/* Jobseeker routes */}
      <Route path="/dashboard" element={<AppLayout><ProtectedRoute roles={['jobseeker']}><Dashboard /></ProtectedRoute></AppLayout>} />
      <Route path="/dashboard/applications" element={<AppLayout><ProtectedRoute roles={['jobseeker']}><MyApplications /></ProtectedRoute></AppLayout>} />
      <Route path="/dashboard/bookmarks" element={<AppLayout><ProtectedRoute roles={['jobseeker']}><Bookmarks /></ProtectedRoute></AppLayout>} />
      <Route path="/dashboard/alerts" element={<AppLayout><ProtectedRoute roles={['jobseeker']}><Alerts /></ProtectedRoute></AppLayout>} />
      <Route path="/profile" element={<AppLayout><ProtectedRoute><Profile /></ProtectedRoute></AppLayout>} />

      {/* Employer routes */}
      <Route path="/employer/dashboard" element={<AppLayout><ProtectedRoute roles={['employer', 'admin']}><EmployerDashboard /></ProtectedRoute></AppLayout>} />
      <Route path="/employer/post-job" element={<AppLayout><ProtectedRoute roles={['employer', 'admin']}><PostJob /></ProtectedRoute></AppLayout>} />
      <Route path="/employer/applications" element={<AppLayout><ProtectedRoute roles={['employer', 'admin']}><ManageApplications /></ProtectedRoute></AppLayout>} />

      {/* 404 */}
      <Route path="*" element={
        <AppLayout>
          <div className="flex items-center justify-center py-20 text-center">
            <div>
              <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-6">Page not found</p>
              <a href="/" className="bg-orange-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition">Go Home</a>
            </div>
          </div>
        </AppLayout>
      } />
    </Routes>
  );
}
