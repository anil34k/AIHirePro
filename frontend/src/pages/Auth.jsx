import React, { useState } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { LogIn, UserPlus } from 'lucide-react';

export default function Auth() {
  const { login, startLoading, stopLoading, showToast } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loginRole, setLoginRole] = useState('SEEKER');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('SEEKER');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    startLoading('Authenticating...', 'Logging in to your secure console.');
    try {
      const response = await api.post('auth/login/', { username, password });
      login(response.access, response.refresh);
      showToast("Access Granted", "Logged in successfully!", "success");
      stopLoading();
    } catch (err) {
      stopLoading();
      showToast("Access Denied", err.response?.data?.detail || "Invalid credentials.", "error");
    }
  };

  const handleDemoLogin = async (targetRole) => {
    startLoading('Accessing Demo...', `Activating session for demo ${targetRole.toLowerCase()}...`);
    try {
      const response = await api.post('auth/demo/', { role: targetRole });
      login(response.access, response.refresh);
      showToast("Access Granted", `Logged in as demo ${targetRole.toLowerCase()}!`, "success");
      stopLoading();
    } catch (err) {
      stopLoading();
      showToast("Access Denied", err.response?.data?.error || "Demo login failed.", "error");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    startLoading('Creating Account...', 'Registering details on database.');
    
    const payload = {
      username,
      password,
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      company_name: companyName,
      industry
    };

    try {
      const response = await api.post('auth/register/', payload);
      login(response.access, response.refresh);
      showToast("Registration Complete", "Account successfully created!", "success");
      stopLoading();
    } catch (err) {
      stopLoading();
      const errData = err.response?.data || {};
      const firstKey = Object.keys(errData)[0] || '';
      const errMsg = firstKey ? `${firstKey}: ${errData[firstKey]}` : "Registration failed.";
      showToast("Registration Failed", errMsg, "error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        
        {!isRegister ? (
          /* Login Card */
          <div className="skeuo-card p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight">Welcome Back</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Sign in to your AIHire Pro recruitment dashboard.</p>
            </div>

            {/* Skeuomorphic Role Toggle */}
            <div className="flex rounded-xl skeuo-card-pressed p-1 bg-slate-100 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setLoginRole('SEEKER')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  loginRole === 'SEEKER' 
                    ? 'bg-blue-600 text-white shadow-[0_2px_4px_rgba(37,99,235,0.3)]' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Job Seeker
              </button>
              <button
                type="button"
                onClick={() => setLoginRole('COMPANY')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  loginRole === 'COMPANY' 
                    ? 'bg-blue-600 text-white shadow-[0_2px_4px_rgba(37,99,235,0.3)]' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Recruiter
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Username</label>
                <input 
                  type="text" 
                  required 
                  className="skeuo-input text-sm" 
                  placeholder="e.g. john_doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                <input 
                  type="password" 
                  required 
                  className="skeuo-input text-sm" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <button type="submit" className="skeuo-btn skeuo-btn-primary w-full mt-2">
                <span>Sign In</span>
                <LogIn className="w-4 h-4" />
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                <span className="bg-[#ffffff] dark:bg-[#1e293b] px-3 text-slate-400">Or Quick Demo Login</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('SEEKER')}
                className="skeuo-btn skeuo-btn-secondary text-[10px] py-2 px-1 font-extrabold uppercase tracking-wider"
              >
                Seeker
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('COMPANY')}
                className="skeuo-btn skeuo-btn-secondary text-[10px] py-2 px-1 font-extrabold uppercase tracking-wider"
              >
                Recruiter
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                className="skeuo-btn skeuo-btn-secondary text-[10px] py-2 px-1 font-extrabold uppercase tracking-wider"
              >
                Admin
              </button>
            </div>
            
            <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500">Don't have an account?</span>
              <button onClick={() => setIsRegister(true)} className="text-blue-500 font-bold hover:underline ml-1">Create Account</button>
            </div>
          </div>
        ) : (
          /* Register Card */
          <div className="skeuo-card p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight">Create Account</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Join our AI-powered recruitment ecosystem.</p>
            </div>
            
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">First Name</label>
                  <input 
                    type="text" 
                    required 
                    className="skeuo-input text-sm" 
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Name</label>
                  <input 
                    type="text" 
                    required 
                    className="skeuo-input text-sm" 
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Username</label>
                <input 
                  type="text" 
                  required 
                  className="skeuo-input text-sm" 
                  placeholder="e.g. john_doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="skeuo-input text-sm" 
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">I want to:</label>
                <select 
                  className="skeuo-input bg-transparent text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="SEEKER" className="dark:bg-slate-900 text-slate-800 dark:text-white">Find a Job (Job Seeker)</option>
                  <option value="COMPANY" className="dark:bg-slate-900 text-slate-800 dark:text-white">Post Jobs & Hire (Company)</option>
                </select>
              </div>

              {role === 'COMPANY' && (
                <div className="space-y-4 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Company Name</label>
                    <input 
                      type="text" 
                      required 
                      className="skeuo-input text-sm" 
                      placeholder="Acme Corporation"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Industry</label>
                    <input 
                      type="text" 
                      className="skeuo-input text-sm" 
                      placeholder="e.g. Technology, Health"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                <input 
                  type="password" 
                  required 
                  className="skeuo-input text-sm" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <button type="submit" className="skeuo-btn skeuo-btn-primary w-full mt-2">
                <span>Sign Up</span>
                <UserPlus className="w-4 h-4" />
              </button>
            </form>
            
            <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500">Already have an account?</span>
              <button onClick={() => setIsRegister(false)} className="text-blue-500 font-bold hover:underline ml-1">Sign In</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
