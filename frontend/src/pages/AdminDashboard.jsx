import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { ChartPie, Users, Building, Briefcase, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const { startLoading, stopLoading, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  
  // Metrics state
  const [metrics, setMetrics] = useState({
    total_users: 0,
    total_companies: 0,
    active_jobs: 0,
    avg_match_score: 0,
  });

  const [logs, setLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [jobsList, setJobsList] = useState([]);

  const loadAdminTelemetry = async () => {
    startLoading('Retrieving Metrics...', 'Polling platform databases.');
    try {
      const res = await api.get('admin/analytics/');
      setMetrics(res.metrics);
      setLogs(res.recent_activities);

      const usersRes = await api.get('admin/users/');
      setUsersList(usersRes);

      const jobsRes = await api.get('jobs/');
      setJobsList(jobsRes);
      
      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Telemetry Offline", e.message, "error");
    }
  };

  useEffect(() => {
    loadAdminTelemetry();
  }, []);

  const modifyUser = async (userId, action) => {
    if (action === 'delete' && !confirm("Are you sure you want to permanently delete this user?")) return;
    startLoading('Processing request...', 'Updating database credentials.');
    try {
      await api.post('admin/users/', { user_id: userId, action });
      showToast("Success", `User action ${action} executed successfully.`, "success");
      loadAdminTelemetry();
    } catch (e) {
      stopLoading();
      showToast("Update Failed", e.message, "error");
    }
  };

  const deleteJob = async (jobId) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;
    startLoading('Removing Job...', 'Syncing database records.');
    try {
      await api.delete(`jobs/${jobId}/`);
      showToast("Job Removed", "The job post has been deleted.", "success");
      loadAdminTelemetry();
    } catch (e) {
      stopLoading();
      showToast("Action Failed", e.message, "error");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Console</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time platform telemetry and operational management tools.</p>
        </div>
        <button onClick={loadAdminTelemetry} className="skeuo-btn skeuo-btn-secondary">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="skeuo-card p-6 flex flex-col justify-between h-32">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Registrants</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-4xl font-extrabold text-blue-600">{metrics.total_users}</span>
            <Users className="w-6 h-6 text-slate-300 dark:text-slate-700" />
          </div>
        </div>
        <div className="skeuo-card p-6 flex flex-col justify-between h-32">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Companies Registered</span>
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
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Avg Match Score</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-4xl font-extrabold text-amber-500">{metrics.avg_match_score}%</span>
            <ChartPie className="w-6 h-6 text-slate-300 dark:text-slate-700" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="skeuo-card">
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button 
            onClick={() => setActiveTab('users')} 
            className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-all ${
              activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <span>User Accounts</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('jobs')} 
            className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-all ${
              activeTab === 'jobs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <span>Job Postings</span>
          </button>

          <button 
            onClick={() => setActiveTab('logs')} 
            className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-all ${
              activeTab === 'logs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <span>Activity Log</span>
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'users' && (
          <div className="p-6">
            <div className="skeuo-table-container">
              <table className="skeuo-table w-full text-left">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td className="font-bold">{u.username}</td>
                      <td>{u.first_name} {u.last_name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${
                          u.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30' : (u.role === 'COMPANY' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30' : 'bg-slate-100 text-slate-800')
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.is_suspended ? (
                          <span className="text-rose-500 font-bold text-xs"><ShieldAlert className="w-3.5 h-3.5 inline mr-1" /> Suspended</span>
                        ) : (
                          <span className="text-emerald-500 font-bold text-xs"><CheckPieIcon className="w-3.5 h-3.5 inline mr-1" /> Active</span>
                        )}
                      </td>
                      <td>
                        {u.role !== 'ADMIN' ? (
                          <>
                            {u.is_suspended ? (
                              <button onClick={() => modifyUser(u.id, 'unsuspend')} className="text-xs font-bold text-emerald-500 hover:underline mr-3">Unsuspend</button>
                            ) : (
                              <button onClick={() => modifyUser(u.id, 'suspend')} className="text-xs font-bold text-amber-500 hover:underline mr-3">Suspend</button>
                            )}
                            <button onClick={() => modifyUser(u.id, 'delete')} className="text-xs font-bold text-rose-500 hover:underline"><Trash2 className="w-3 h-3 inline" /> Delete</button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">System Protected</span>
                        )}
                      </td>
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
                  <tr>
                    <th>Company</th>
                    <th>Job Title</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobsList.map(j => (
                    <tr key={j.id}>
                      <td className="font-bold">{j.company_name}</td>
                      <td>{j.title}</td>
                      <td>{j.location}</td>
                      <td><span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{j.employment_type}</span></td>
                      <td>{j.status}</td>
                      <td>
                        <button onClick={() => deleteJob(j.id)} className="text-xs font-bold text-rose-500 hover:underline"><Trash2 className="w-3.5 h-3.5 inline" /> Remove</button>
                      </td>
                    </tr>
                  ))}
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
                  <span className="text-slate-400"> - by {log.username} ({log.ip}):</span>
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

// Mini components for indicator icon
function CheckPieIcon() {
  return (
    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span>
  );
}
