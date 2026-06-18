import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { ChartPie, Users, Building, Briefcase, RefreshCw, ShieldAlert, Trash2, Code, Plus } from 'lucide-react';

export default function AdminDashboard() {
  const { startLoading, stopLoading, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [metrics, setMetrics] = useState({ total_users: 0, total_companies: 0, active_jobs: 0, avg_match_score: 0 });
  const [logs, setLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [challenges, setChallenges] = useState([]);

  const loadAdminData = async () => {
    startLoading('Retrieving Data...', 'Polling platform databases.');
    try {
      const [analytics, usersRes, jobsRes, challengesRes] = await Promise.all([
        api.get('admin/analytics/'),
        api.get('admin/users/'),
        api.get('jobs/'),
        api.get('admin/challenges/').catch(() => []),
      ]);
      setMetrics(analytics.metrics);
      setLogs(analytics.recent_activities);
      setUsersList(usersRes);
      setJobsList(jobsRes);
      if (Array.isArray(challengesRes)) setChallenges(challengesRes);
      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Error", e.message, "error");
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  const modifyUser = async (userId, action) => {
    if (action === 'delete' && !confirm("Permanently delete this user?")) return;
    startLoading('Processing...', '');
    try {
      await api.post('admin/users/', { user_id: userId, action });
      showToast("Success", `User ${action} executed.`, "success");
      loadAdminData();
    } catch (e) { stopLoading(); showToast("Failed", e.message, "error"); }
  };

  const deleteJob = async (jobId) => {
    if (!confirm("Delete this job posting?")) return;
    startLoading('Removing...', '');
    try {
      await api.delete(`jobs/${jobId}/`);
      showToast("Removed", "Job post deleted.", "success");
      loadAdminData();
    } catch (e) { stopLoading(); showToast("Failed", e.message, "error"); }
  };

  const toggleChallenge = async (id) => {
    try {
      await api.post('admin/challenges/', { challenge_id: id, action: 'toggle' });
      loadAdminData();
    } catch (e) { showToast("Error", e.message, "error"); }
  };

  const deleteChallenge = async (id) => {
    if (!confirm("Delete this challenge?")) return;
    try {
      await api.delete('admin/challenges/', { challenge_id: id });
      showToast("Deleted", "Challenge removed.", "success");
      loadAdminData();
    } catch (e) { showToast("Error", e.message, "error"); }
  };

  const diffColor = (d) => {
    switch(d) {
      case 'EASY': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'MEDIUM': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'HARD': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Console</h1>
          <p className="text-sm text-slate-500 mt-1">Platform telemetry and management tools.</p>
        </div>
        <button onClick={loadAdminData} className="skeuo-btn skeuo-btn-secondary">
          <RefreshCw className="w-4 h-4" /><span>Refresh Data</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="skeuo-card p-6 flex flex-col justify-between h-32">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Registrants</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-4xl font-extrabold text-blue-600">{metrics.total_users}</span>
            <Users className="w-6 h-6 text-slate-300 dark:text-slate-700" />
          </div>
        </div>
        <div className="skeuo-card p-6 flex flex-col justify-between h-32">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Companies</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-4xl font-extrabold text-teal-600">{metrics.total_companies}</span>
            <Building className="w-6 h-6 text-slate-300 dark:text-slate-700" />
          </div>
        </div>
        <div className="skeuo-card p-6 flex flex-col justify-between h-32">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Jobs</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-4xl font-extrabold text-indigo-600">{metrics.active_jobs}</span>
            <Briefcase className="w-6 h-6 text-slate-300 dark:text-slate-700" />
          </div>
        </div>
        <div className="skeuo-card p-6 flex flex-col justify-between h-32">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Challenges</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-4xl font-extrabold text-amber-500">{challenges.length}</span>
            <Code className="w-6 h-6 text-slate-300 dark:text-slate-700" />
          </div>
        </div>
      </div>

      <div className="skeuo-card">
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-x-auto">
          {['users', 'jobs', 'challenges', 'logs'].map(tab => (
            <button key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {tab === 'users' ? 'User Accounts' : tab === 'jobs' ? 'Job Postings' : tab === 'challenges' ? 'Challenges' : 'Activity Log'}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <div className="p-6">
            <div className="skeuo-table-container">
              <table className="skeuo-table w-full text-left">
                <thead>
                  <tr><th>Username</th><th>Full Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td className="font-bold">{u.username}</td>
                      <td>{u.first_name} {u.last_name}</td>
                      <td>{u.email}</td>
                      <td><span className={`px-2 py-1 text-[10px] font-bold rounded-full ${
                        u.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30' : u.role === 'COMPANY' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30' : 'bg-slate-100 text-slate-800'
                      }`}>{u.role}</span></td>
                      <td>{u.is_suspended ? <span className="text-rose-500 font-bold text-xs"><ShieldAlert className="w-3.5 h-3.5 inline mr-1" /> Suspended</span> : <span className="text-emerald-500 font-bold text-xs"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span> Active</span>}</td>
                      <td>{u.role !== 'ADMIN' ? (
                        <>{u.is_suspended ? <button onClick={() => modifyUser(u.id, 'unsuspend')} className="text-xs font-bold text-emerald-500 hover:underline mr-3">Unsuspend</button> : <button onClick={() => modifyUser(u.id, 'suspend')} className="text-xs font-bold text-amber-500 hover:underline mr-3">Suspend</button>}
                        <button onClick={() => modifyUser(u.id, 'delete')} className="text-xs font-bold text-rose-500 hover:underline"><Trash2 className="w-3 h-3 inline" /> Delete</button></>
                      ) : <span className="text-xs text-slate-400">Protected</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="p-6">
            <div className="skeuo-table-container">
              <table className="skeuo-table w-full text-left">
                <thead>
                  <tr><th>Company</th><th>Job Title</th><th>Location</th><th>Type</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {jobsList.map(j => (
                    <tr key={j.id}>
                      <td className="font-bold">{j.company_name}</td>
                      <td>{j.title}</td>
                      <td>{j.location}</td>
                      <td><span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{j.employment_type}</span></td>
                      <td>{j.status}</td>
                      <td><button onClick={() => deleteJob(j.id)} className="text-xs font-bold text-rose-500 hover:underline"><Trash2 className="w-3.5 h-3.5 inline" /> Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="p-6">
            <div className="flex justify-end mb-4">
              <a href="http://localhost:8000/admin/challenges/add/" target="_blank" rel="noreferrer" className="skeuo-btn skeuo-btn-primary text-xs">
                <Plus className="w-3.5 h-3.5" /><span>New Challenge</span>
              </a>
            </div>
            <div className="skeuo-table-container">
              <table className="skeuo-table w-full text-left">
                <thead>
                  <tr><th>Title</th><th>Difficulty</th><th>Category</th><th>Status</th><th>Submissions</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {challenges.map(c => (
                    <tr key={c.id}>
                      <td className="font-bold">{c.title}</td>
                      <td><span className={`px-2 py-1 text-[10px] font-bold rounded-full ${diffColor(c.difficulty)}`}>{c.difficulty}</span></td>
                      <td><span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">{c.category}</span></td>
                      <td>{c.is_active ? <span className="text-emerald-500 font-bold text-xs"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span> Active</span> : <span className="text-slate-400 font-bold text-xs"><span className="inline-block w-2 h-2 rounded-full bg-slate-400 mr-1"></span> Inactive</span>}</td>
                      <td className="text-sm text-slate-500">{c.submission_count || 0}</td>
                      <td>
                        <button onClick={() => toggleChallenge(c.id)} className="text-xs font-bold text-indigo-500 hover:underline mr-3">
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => deleteChallenge(c.id)} className="text-xs font-bold text-rose-500 hover:underline"><Trash2 className="w-3 h-3 inline" /> Delete</button>
                      </td>
                    </tr>
                  ))}
                  {challenges.length === 0 && (
                    <tr><td colSpan="6" className="text-center text-slate-400 py-8 text-sm">No challenges found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="p-6">
            <div className="bg-slate-950 text-slate-300 font-mono p-4 rounded-xl max-h-[500px] overflow-y-auto border border-white/5 space-y-1 text-xs">
              <div className="text-blue-500 font-bold mb-2">--- START PLATFORM SYSTEM AUDIT ---</div>
              {logs.map((log, idx) => (
                <div key={idx}>
                  <span className="text-emerald-500">[{log.timestamp}]</span>
                  <span className="text-sky-400 font-bold"> {log.action}</span>
                  <span className="text-slate-400"> - by {log.username}:</span>
                  <span> {log.details}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
