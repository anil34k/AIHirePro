import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import api from './api';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import SeekerDashboard from './pages/SeekerDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import AdminDashboard from './pages/AdminDashboard';

// V2 Page Imports
import MockInterview from './pages/MockInterview';
import UpskillingAcademy from './pages/UpskillingAcademy';
import Portfolio from './pages/Portfolio';
import RecruiterAnalytics from './pages/RecruiterAnalytics';
import InterviewScheduler from './pages/InterviewScheduler';
import AITelemetry from './pages/AITelemetry';
import CareerCoach from './pages/CareerCoach';
import TalentScout from './pages/TalentScout';
import ResumeOptimizer from './pages/ResumeOptimizer';
import CodeArena from './pages/CodeArena';

import { 
  Sun, Moon, Briefcase, LogOut, ChartPie, UserCheck, 
  ShieldAlert, GraduationCap, Building, AlertCircle, 
  Brain, Code, Calendar, User, FileText, MessageSquare, Activity 
} from 'lucide-react';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function AppContent() {
  const { user, logout, theme, toggleTheme, toasts, removeToast, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Routing redirects are managed via ProtectedRoute and PublicRoute components

  // Sidebar link config based on user role
  const renderSidebarLinks = () => {
    if (!user) return null;
    let links = [];
    if (user.role === 'ADMIN') {
      links = [
        { name: 'Telemetry Dashboard', icon: <ChartPie className="w-5 h-5" />, path: '/admin-dashboard' },
        { name: 'AI Telemetry Center', icon: <Activity className="w-5 h-5" />, path: '/admin-telemetry' }
      ];
    } else if (user.role === 'COMPANY') {
      links = [
        { name: 'Recruiter Dashboard', icon: <Building className="w-5 h-5" />, path: '/company-dashboard' },
        { name: 'Hire Analytics', icon: <ChartPie className="w-5 h-5" />, path: '/analytics' },
        { name: 'Interview Scheduler', icon: <Calendar className="w-5 h-5" />, path: '/scheduler' },
        { name: 'AI Talent Scout', icon: <UserCheck className="w-5 h-5" />, path: '/talent-scout' }
      ];
    } else if (user.role === 'SEEKER') {
      links = [
        { name: 'Seeker Console', icon: <GraduationCap className="w-5 h-5" />, path: '/seeker-dashboard' },
        { name: 'Mock Interview Arena', icon: <Brain className="w-5 h-5" />, path: '/mock-interview' },
        { name: 'Upskilling Academy', icon: <Code className="w-5 h-5" />, path: '/academy' },
        { name: 'Interview Invites', icon: <Calendar className="w-5 h-5" />, path: '/scheduler' },
        { name: 'AI Career Coach', icon: <MessageSquare className="w-5 h-5" />, path: '/career-coach' },
        { name: 'ATS Resume Optimizer', icon: <FileText className="w-5 h-5" />, path: '/resume-optimizer' },
        { name: 'AI Coding Arena', icon: <Code className="w-5 h-5" />, path: '/code-arena' },
        { name: 'Public Portfolio Settings', icon: <User className="w-5 h-5" />, path: '/portfolio-settings' }
      ];
    }

    return (
      <aside className="w-full md:w-64 skeuo-glass border-r border-black/5 dark:border-white/5 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3">Management</span>
            <nav className="space-y-1 mt-2">
              {links.map((link, idx) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={idx}
                    to={link.path}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          AIHire Pro v2.0
        </div>
      </aside>
    );
  };

  const showSidebar = user && location.pathname !== '/' && !location.pathname.startsWith('/portfolio/');

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 bg-[#f0f2f5] dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f8fafc]">
      
      {/* Dynamic Header */}
      <header className="skeuo-glass border-b border-black/5 dark:border-white/5 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_6px_rgba(37,99,235,0.2)]">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">AIHire Pro</span>
            <span className="text-xs block text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider leading-none">Enterprise Suite</span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {/* Light/Dark Toggle */}
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-slate-400" />
            <div onClick={toggleTheme} className="theme-switch flex items-center">
              <div className="theme-switch-knob"></div>
            </div>
            <Moon className="w-4 h-4 text-slate-400" />
          </div>

          {/* User state indicator */}
          {user && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <span className="font-bold text-sm block">
                  {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.username}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">
                  {user.role === 'ADMIN' ? 'Administrator' : (user.role === 'COMPANY' ? 'Recruiter' : 'Job Seeker')}
                </span>
              </div>
              <button onClick={logout} className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all flex items-center justify-center" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {showSidebar && renderSidebarLinks()}
        
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={
              <PublicRoute>
                <Auth />
              </PublicRoute>
            } />
            
            {/* Seeker Dashboard & Modules */}
            <Route path="/seeker-dashboard" element={
              <ProtectedRoute allowedRoles={['SEEKER']}>
                <SeekerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/mock-interview" element={
              <ProtectedRoute allowedRoles={['SEEKER']}>
                <MockInterview />
              </ProtectedRoute>
            } />
            <Route path="/academy" element={
              <ProtectedRoute allowedRoles={['SEEKER']}>
                <UpskillingAcademy />
              </ProtectedRoute>
            } />
            <Route path="/portfolio-settings" element={
              <ProtectedRoute allowedRoles={['SEEKER']}>
                <Portfolio />
              </ProtectedRoute>
            } />
            <Route path="/career-coach" element={
              <ProtectedRoute allowedRoles={['SEEKER']}>
                <CareerCoach />
              </ProtectedRoute>
            } />
            <Route path="/resume-optimizer" element={
              <ProtectedRoute allowedRoles={['SEEKER']}>
                <ResumeOptimizer />
              </ProtectedRoute>
            } />
            <Route path="/code-arena" element={
              <ProtectedRoute allowedRoles={['SEEKER']}>
                <CodeArena />
              </ProtectedRoute>
            } />

            {/* Recruiter Dashboard & Modules */}
            <Route path="/company-dashboard" element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <CompanyDashboard />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <RecruiterAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/scheduler" element={
              <ProtectedRoute allowedRoles={['COMPANY', 'SEEKER']}>
                <InterviewScheduler />
              </ProtectedRoute>
            } />
            <Route path="/talent-scout" element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <TalentScout />
              </ProtectedRoute>
            } />

            {/* Admin Dashboard & Telemetry */}
            <Route path="/admin-dashboard" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin-telemetry" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AITelemetry />
              </ProtectedRoute>
            } />

            {/* Public Resume Portfolio vanity route */}
            <Route path="/portfolio/:username" element={<Portfolio />} />
          </Routes>
        </main>
      </div>

      {/* Loading overlay */}
      {loading.active && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
          <div className="skeuo-card p-6 flex flex-col items-center gap-4 text-center max-w-xs">
            <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white">{loading.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{loading.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`skeuo-glass p-4 rounded-xl border flex items-start gap-3 shadow-lg min-w-[300px] max-w-sm transition-all duration-300 ${
              toast.type === 'error' ? 'border-red-500/20' : (toast.type === 'warning' ? 'border-amber-500/20' : 'border-green-500/20')
            }`}
          >
            <AlertCircle className={`w-5 h-5 mt-0.5 ${
              toast.type === 'error' ? 'text-red-500' : (toast.type === 'warning' ? 'text-amber-500' : 'text-green-500')
            }`} />
            <div className="flex-1">
              <h4 className="font-bold text-sm">{toast.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState({ active: false, title: '', message: '' });
  const [authChecking, setAuthChecking] = useState(true);

  // Manage Dark Mode styles
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Toast controls
  const showToast = (title, message, type = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Loading spinner controls
  const startLoading = (title = 'AI Processing...', message = 'Consulting Groq API.') => {
    setLoading({ active: true, title, message });
  };

  const stopLoading = () => {
    setLoading({ active: false, title: '', message: '' });
  };

  // Fetch current user from API
  const fetchUser = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setAuthChecking(false);
      return;
    }
    try {
      const res = await api.get('users/me/');
      setUser(res);
    } catch (e) {
      console.error("Failed to load user state", e);
      localStorage.clear();
      setUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    fetchUser();
    
    // Bind to auth events (logout triggers)
    const handleLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  const login = (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    fetchUser();
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] dark:bg-[#0f172a]">
        <div className="skeuo-card p-6 flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <div>
            <p className="font-bold text-slate-800 dark:text-white">AIHire Pro</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Initializing secure session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user, login, logout, theme, toggleTheme, toasts, showToast, removeToast, loading, startLoading, stopLoading
    }}>
      <Router>
        <AppContent />
      </Router>
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'COMPANY') return <Navigate to="/company-dashboard" replace />;
    return <Navigate to="/seeker-dashboard" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();

  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'COMPANY') return <Navigate to="/company-dashboard" replace />;
    return <Navigate to="/seeker-dashboard" replace />;
  }

  return children;
}
