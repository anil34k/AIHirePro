import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { Building, ListPlus, Users, Plus, X, Brain, Check, ShieldAlert, Award, Trash2, FileText, Eye, Download, ExternalLink, Globe, Code, Terminal, Cpu, Layers, Sparkles, GraduationCap } from 'lucide-react';

const Linkedin = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Github = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function CompanyDashboard() {
  const { startLoading, stopLoading, showToast, user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Modals state
  const [showPostModal, setShowPostModal] = useState(false);
  const [showAssessModal, setShowAssessModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [presenceExpanded, setPresenceExpanded] = useState(true);
  const [assessTab, setAssessTab] = useState('evaluation');

  // Profile Form state
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [hq, setHq] = useState('');
  const [size, setSize] = useState('11-50');
  const [contactEmail, setContactEmail] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Post Job form state
  const [jobTitle, setJobTitle] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobType, setJobType] = useState('FULL_TIME');
  const [jobExp, setJobExp] = useState(0);
  const [jobSalMin, setJobSalMin] = useState('');
  const [jobSalMax, setJobSalMax] = useState('');
  const [jobSkills, setJobSkills] = useState('');
  const [jobOpenings, setJobOpenings] = useState(1);
  const [jobDesc, setJobDesc] = useState('');

  // Lists state
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);

  const loadRecruiterData = async () => {
    startLoading('Retrieving data...', 'Syncing openings & candidates.');
    try {
      const userRes = await api.get('users/me/');
      const u = userRes;
      if (u.profile) {
        setName(u.profile.name || '');
        setIndustry(u.profile.industry || '');
        setWebsite(u.profile.website || '');
        setHq(u.profile.headquarters || '');
        setSize(u.profile.size || '11-50');
        setContactEmail(u.profile.contact_email || '');
        setDescription(u.profile.description || '');
        setLogoUrl(u.profile.logo_url || '');
      }

      // Load Job openings
      const jobsRes = await api.get('jobs/');
      setJobs(jobsRes);

      // Load applicants
      const appsRes = await api.get('applications/');
      setApplicants(appsRes);

      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Data Sync Error", e.message, "error");
    }
  };

  useEffect(() => {
    loadRecruiterData();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    startLoading('Saving details...', 'Syncing recruiter information.');
    try {
      await api.put('users/me/', {
        company_name: name,
        industry,
        website,
        headquarters: hq,
        size,
        contact_email: contactEmail,
        description,
        logo_url: logoUrl
      });
      showToast("Profile Updated", "Settings saved successfully.", "success");
      loadRecruiterData();
    } catch (err) {
      stopLoading();
      showToast("Sync Error", err.message, "error");
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    startLoading('Publishing opening...', 'Registering new job requirements.');
    const skillsList = jobSkills.split(',').map(s => s.trim()).filter(s => s);
    const payload = {
      title: jobTitle,
      location: jobLocation,
      employment_type: jobType,
      experience_required: parseInt(jobExp),
      salary_min: parseInt(jobSalMin || 0),
      salary_max: parseInt(jobSalMax || 0),
      skills_required: skillsList,
      openings: parseInt(jobOpenings),
      description: jobDesc
    };

    try {
      await api.post('jobs/', payload);
      setShowPostModal(false);
      showToast("Job Posted", "New job is now active on search indexes.", "success");
      loadRecruiterData();
      
      // Reset form
      setJobTitle('');
      setJobLocation('');
      setJobExp(0);
      setJobSalMin('');
      setJobSalMax('');
      setJobSkills('');
      setJobDesc('');
    } catch (err) {
      stopLoading();
      showToast("Posting failed", err.message, "error");
    }
  };

  const archiveJob = async (jobId) => {
    startLoading('Updating status...', 'Archiving job posting.');
    try {
      await api.patch(`jobs/${jobId}/`, { status: 'ARCHIVED' });
      showToast("Job Archived", "Opening closed to applicants.", "success");
      loadRecruiterData();
    } catch (e) {
      stopLoading();
      showToast("Action Failed", e.message, "error");
    }
  };

  const deleteJob = async (jobId) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;
    startLoading('Removing opening...', 'Deleting from database.');
    try {
      await api.delete(`jobs/${jobId}/`);
      showToast("Job Deleted", "Job post successfully removed.", "success");
      loadRecruiterData();
    } catch (e) {
      stopLoading();
      showToast("Action Failed", e.message, "error");
    }
  };

  const updateAppStatus = async (appId, action) => {
    if (action === 'hire' && !confirm("Confirm hiring applicant? This will notify them via email.")) return;
    
    setShowAssessModal(false);
    startLoading('Writing Status...', 'Updating recruitment records.');
    try {
      await api.post(`applications/${appId}/${action}/`);
      showToast("Workflow Saved", `Applicant marked as ${action}ed.`, "success");
      loadRecruiterData();
    } catch (e) {
      stopLoading();
      showToast("Workflow Error", e.message, "error");
    }
  };

  const openAssessment = (app) => {
    setSelectedApp(app);
    setAssessTab('evaluation');
    setShowAssessModal(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Recruiter Suite</h1>
          <p className="text-sm text-slate-500 mt-1">Manage postings, corporate identity, and filter applicants via Groq AI.</p>
        </div>
        <button onClick={() => setShowPostModal(true)} className="skeuo-btn skeuo-btn-primary">
          <Plus className="w-5 h-5" />
          <span>Post New Job</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="skeuo-card">
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button 
            onClick={() => switchRecruiterTab('profile')} 
            id="tab-profile" 
            className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-all ${
              activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Company Profile</span>
          </button>
          
          <button 
            onClick={() => switchRecruiterTab('jobs')} 
            id="tab-jobs" 
            className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-all ${
              activeTab === 'jobs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <ListPlus className="w-4 h-4" />
            <span>Job Openings</span>
          </button>

          <button 
            onClick={() => switchRecruiterTab('applicants')} 
            id="tab-applicants" 
            className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-all ${
              activeTab === 'applicants' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Applicants & AI Rank</span>
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'profile' && (
          <div className="p-6">
            <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl skeuo-card flex items-center justify-center bg-slate-100 dark:bg-slate-800 border-dashed border-2 relative overflow-hidden" id="logo-preview-box">
                  {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" alt="logo" /> : <Building className="w-8 h-8 text-slate-300 dark:text-slate-700" />}
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-sm">Company Branding Logo</h4>
                  <input 
                    type="text" 
                    className="skeuo-input text-xs w-64" 
                    placeholder="Enter Logo Image URL"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400">Specify a URL for the corporate logo image.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Company Name</label>
                  <input 
                    type="text" 
                    required 
                    className="skeuo-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Industry</label>
                  <input 
                    type="text" 
                    className="skeuo-input" 
                    placeholder="e.g. Technology"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Website URL</label>
                  <input 
                    type="url" 
                    className="skeuo-input" 
                    placeholder="https://"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Headquarters</label>
                  <input 
                    type="text" 
                    className="skeuo-input" 
                    placeholder="City, Country"
                    value={hq}
                    onChange={(e) => setHq(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Company Size</label>
                  <select 
                    className="skeuo-input bg-transparent"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  >
                    <option value="1-10" className="dark:bg-slate-900">1-10 employees</option>
                    <option value="11-50" className="dark:bg-slate-900">11-50 employees</option>
                    <option value="51-200" className="dark:bg-slate-900">51-200 employees</option>
                    <option value="201-500" className="dark:bg-slate-900">201-500 employees</option>
                    <option value="500+" className="dark:bg-slate-900">500+ employees</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Email</label>
                  <input 
                    type="email" 
                    className="skeuo-input"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Company Description</label>
                <textarea 
                  rows="4" 
                  className="skeuo-input resize-none" 
                  placeholder="Describe company business, culture and core mission..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <button type="submit" className="skeuo-btn skeuo-btn-primary">
                <span>Save Profile</span>
              </button>
            </form>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="p-6">
            <div className="skeuo-table-container">
              <table className="skeuo-table w-full text-left">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Salary Range</th>
                    <th>Openings</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td className="font-bold">{job.title}</td>
                      <td>{job.location}</td>
                      <td><span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{job.employment_type}</span></td>
                      <td>${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}</td>
                      <td>{job.openings}</td>
                      <td>
                        {job.status === 'ACTIVE' ? (
                          <span className="text-xs font-bold text-green-500"><Check className="w-3.5 h-3.5 inline" /> Published</span>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">Archived</span>
                        )}
                      </td>
                      <td>
                        <button onClick={() => archiveJob(job.id)} className="text-xs text-amber-500 font-bold hover:underline mr-3">Archive</button>
                        <button onClick={() => deleteJob(job.id)} className="text-xs text-rose-500 font-bold hover:underline"><Trash2 className="w-3 h-3 inline" /> Delete</button>
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center text-slate-400 py-6">No job openings posted yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'applicants' && (
          <div className="p-6">
            <div className="skeuo-table-container">
              <table className="skeuo-table w-full text-left">
                <thead>
                  <tr>
                    <th>Candidate Name</th>
                    <th>Target Job</th>
                    <th>AI Match Score</th>
                    <th>Applied Date</th>
                    <th>Workflow Status</th>
                    <th>Evaluator Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map(app => {
                    let scoreColor = 'text-red-500';
                    if (app.match_score >= 80) scoreColor = 'text-green-500';
                    else if (app.match_score >= 60) scoreColor = 'text-amber-500';

                    let statusColor = 'text-slate-500';
                    if (app.status === 'HIRED') statusColor = 'text-green-500 font-bold';
                    else if (app.status === 'SHORTLISTED') statusColor = 'text-blue-500 font-bold';
                    else if (app.status === 'REJECTED') statusColor = 'text-red-500 font-bold';

                    return (
                      <tr key={app.id}>
                        <td className="font-bold">{app.seeker_name}</td>
                        <td>{app.job_title}</td>
                        <td className={`${scoreColor} font-extrabold text-sm flex items-center gap-1.5`}>
                          <Brain className="w-4 h-4" />
                          <span>{app.match_score}%</span>
                        </td>
                        <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                        <td className={statusColor}>{app.status}</td>
                        <td>
                          <button onClick={() => openAssessment(app)} className="text-xs text-indigo-500 font-bold hover:underline mr-3">Assess</button>
                          <a 
                            href={app.resume_file ? (app.resume_file.startsWith('http') ? app.resume_file : `http://localhost:8000${app.resume_file}`) : '#'} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs text-slate-500 font-bold hover:underline"
                          >
                            View Resume
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                  {applicants.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-slate-400 py-6">No applicants registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Post Job Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="skeuo-card max-w-2xl w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xl font-extrabold tracking-tight">Post Job Opening</h3>
              <button onClick={() => setShowPostModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleJobSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Job Title</label>
                  <input 
                    type="text" 
                    required 
                    className="skeuo-input" 
                    placeholder="e.g. Senior Backend Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Location</label>
                  <input 
                    type="text" 
                    required 
                    className="skeuo-input" 
                    placeholder="e.g. San Francisco, CA / Remote"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Employment Type</label>
                  <select 
                    className="skeuo-input bg-transparent"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                  >
                    <option value="FULL_TIME" className="dark:bg-slate-900">Full-time</option>
                    <option value="PART_TIME" className="dark:bg-slate-900">Part-time</option>
                    <option value="CONTRACT" className="dark:bg-slate-900">Contract</option>
                    <option value="INTERNSHIP" className="dark:bg-slate-900">Internship</option>
                    <option value="REMOTE" className="dark:bg-slate-900">Remote</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Required Experience (Years)</label>
                  <input 
                    type="number" 
                    required 
                    min="0" 
                    className="skeuo-input" 
                    placeholder="e.g. 3"
                    value={jobExp}
                    onChange={(e) => setJobExp(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Salary Min ($)</label>
                  <input 
                    type="number" 
                    className="skeuo-input" 
                    placeholder="60000"
                    value={jobSalMin}
                    onChange={(e) => setJobSalMin(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Salary Max ($)</label>
                  <input 
                    type="number" 
                    className="skeuo-input" 
                    placeholder="120000"
                    value={jobSalMax}
                    onChange={(e) => setJobSalMax(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Required Skills (Comma separated)</label>
                  <input 
                    type="text" 
                    required 
                    className="skeuo-input" 
                    placeholder="Python, Django, Postgres"
                    value={jobSkills}
                    onChange={(e) => setJobSkills(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Openings Available</label>
                  <input 
                    type="number" 
                    min="1" 
                    required 
                    className="skeuo-input"
                    value={jobOpenings}
                    onChange={(e) => setJobOpenings(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Detailed Job Description</label>
                <textarea 
                  rows="5" 
                  required 
                  className="skeuo-input resize-none" 
                  placeholder="Highlight day-to-day duties, background prerequisites..."
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowPostModal(false)} className="skeuo-btn skeuo-btn-secondary">Cancel</button>
                <button type="submit" className="skeuo-btn skeuo-btn-primary">Post Opening</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assessment Modal */}
      {showAssessModal && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="skeuo-card max-w-5xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <Brain className="w-5 h-5 animate-pulse" />
                <h3 className="text-xl font-extrabold tracking-tight">AI Matching Evaluator</h3>
              </div>
              <button 
                onClick={() => setShowAssessModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 pb-1 gap-4">
              <button 
                onClick={() => setAssessTab('evaluation')}
                className={`pb-2 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
                  assessTab === 'evaluation' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>AI Evaluation & Resume</span>
              </button>
              <button 
                onClick={() => setAssessTab('profile')}
                className={`pb-2 font-bold text-xs flex items-center gap-2 border-b-2 transition-all ${
                  assessTab === 'profile' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Full Candidate Profile</span>
              </button>
            </div>

            {assessTab === 'evaluation' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Embedded Document Viewer (no download required) */}
                <div className="lg:col-span-7 flex flex-col space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Resume Preview</span>
                  <div className="flex-1 min-h-[480px] bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-200 dark:border-slate-800">
                    {selectedApp.resume_file ? (
                      selectedApp.resume_file.toLowerCase().endsWith('.pdf') ? (
                        <iframe 
                          src={selectedApp.resume_file} 
                          className="w-full h-full border-0 min-h-[480px]" 
                          title="Candidate Resume PDF"
                        />
                      ) : (
                        <div className="p-6 text-center max-w-sm space-y-3">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                            <FileText className="w-6 h-6 animate-pulse" />
                          </div>
                          <h4 className="font-bold text-sm">DOCX Viewer Preview</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Inline preview is not supported for DOCX files in standard browsers. You can open or download the file directly using the actions below.</p>
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-slate-400">No resume file attached.</span>
                    )}
                  </div>
                  {selectedApp.resume_file && (
                    <div className="flex gap-2 justify-end">
                      <a 
                        href={selectedApp.resume_file} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="skeuo-btn skeuo-btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in Browser</span>
                      </a>
                      <a 
                        href={selectedApp.resume_file} 
                        download 
                        className="skeuo-btn skeuo-btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download File</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Right Column: AI Metrics & Operations */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="score-gauge flex-shrink-0">
                      <svg className="w-20 h-20 score-gauge-ring">
                        <circle cx="40" cy="40" r="32" stroke="var(--border-light)" strokeWidth="6" fill="transparent"/>
                        <circle cx="40" cy="40" r="32" stroke="var(--primary)" strokeWidth="6" fill="transparent"
                                strokeDasharray="201" strokeDashoffset={201 - (201 * selectedApp.match_score) / 100}/>
                      </svg>
                      <span className="score-gauge-value text-base">{selectedApp.match_score}%</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-extrabold">{selectedApp.seeker_name}</h4>
                      <p className="text-xs text-slate-500 font-semibold">Application for <span className="font-bold text-slate-700 dark:text-slate-300">{selectedApp.job_title}</span></p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">ATS Matching Compatibility</p>
                      {selectedApp.candidate_links && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedApp.candidate_links.linkedin && (
                            <a 
                              href={selectedApp.candidate_links.linkedin} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/15 hover:bg-blue-500/20 transition-all"
                              title="LinkedIn Profile"
                            >
                              <Linkedin className="w-3.5 h-3.5" />
                              <span>LinkedIn</span>
                            </a>
                          )}
                          {selectedApp.candidate_links.github && (
                            <a 
                              href={selectedApp.candidate_links.github} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-500/10 text-slate-800 dark:text-white border border-slate-500/15 hover:bg-slate-500/20 transition-all"
                              title="GitHub Profile"
                            >
                              <Github className="w-3.5 h-3.5" />
                              <span>GitHub</span>
                            </a>
                          )}
                          {selectedApp.candidate_links.portfolio && (
                            <a 
                              href={selectedApp.candidate_links.portfolio} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/15 hover:bg-indigo-500/20 transition-all"
                              title="Portfolio Website"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>Portfolio</span>
                            </a>
                          )}
                          {selectedApp.candidate_links.leetcode && (
                            <a 
                              href={selectedApp.candidate_links.leetcode} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/15 hover:bg-amber-500/20 transition-all"
                              title="LeetCode Profile"
                            >
                              <Code className="w-3.5 h-3.5" />
                              <span>LeetCode</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 text-xs max-h-[42vh] overflow-y-auto pr-1">
                    {/* Extracted Skills */}
                    <div>
                      <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 uppercase tracking-wider mb-2">Extracted Candidate Skills</h5>
                      <div className="flex flex-wrap gap-1">
                        {(selectedApp.resume_parsed?.skills || []).map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-500/10">
                            {skill}
                          </span>
                        ))}
                        {(selectedApp.resume_parsed?.skills || []).length === 0 && (
                          <span className="text-slate-400 italic">No skills extracted.</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"><Award className="w-4 h-4 text-green-500" /> Candidate Strengths</h5>
                      <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400 mt-1">
                        {(selectedApp.strengths || []).map((s, idx) => <li key={idx}>{s}</li>)}
                        {(selectedApp.strengths || []).length === 0 && <li>Solid core credentials match.</li>}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"><ShieldAlert className="w-4 h-4 text-amber-500" /> Detected Skill Gaps</h5>
                      <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400 mt-1">
                        {(selectedApp.missing_skills || []).map((g, idx) => <li key={idx}>{g}</li>)}
                        {(selectedApp.missing_skills || []).length === 0 && <li>No critical skill gaps identified.</li>}
                      </ul>
                    </div>

                    {/* AI Presence Analysis Accordion */}
                    {selectedApp.presence_analysis && (
                      <div className="skeuo-card border border-indigo-500/10 rounded-xl overflow-hidden mt-4">
                        <button 
                          type="button"
                          onClick={() => setPresenceExpanded(!presenceExpanded)}
                          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-left"
                        >
                          <span className="font-extrabold text-xs text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            <span>AI Web Presence Analysis</span>
                          </span>
                          <span className="text-xs font-bold text-slate-500">{presenceExpanded ? 'Collapse' : 'Expand'}</span>
                        </button>
                        
                        {presenceExpanded && (
                          <div className="p-4 space-y-4 text-xs">
                            {selectedApp.presence_analysis.overall_summary && (
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed border-b border-slate-100 dark:border-slate-800/60 pb-3">
                                {selectedApp.presence_analysis.overall_summary}
                              </div>
                            )}

                            {selectedApp.presence_analysis.github_analyzed && selectedApp.presence_analysis.github_metrics && (
                              <div className="space-y-2">
                                <h6 className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <Github className="w-4 h-4" />
                                  <span>GitHub Repository Insights</span>
                                </h6>
                                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Public Repositories</span>
                                    <span className="font-bold block text-slate-800 dark:text-white">
                                      {selectedApp.presence_analysis.github_metrics.public_repositories}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Stars & Forks</span>
                                    <span className="font-bold block text-slate-800 dark:text-white">
                                      ★ {selectedApp.presence_analysis.github_metrics.stars_count} / {selectedApp.presence_analysis.github_metrics.forks_count} forks
                                    </span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Language Mix</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {Object.entries(selectedApp.presence_analysis.github_metrics.primary_languages || {}).map(([lang, pct]) => (
                                        <span key={lang} className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 font-semibold text-[10px]">
                                          {lang}: {pct}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Project Architecture Quality</span>
                                    <span className="font-semibold block text-slate-700 dark:text-slate-400 leading-normal mt-0.5">
                                      {selectedApp.presence_analysis.github_metrics.project_quality_score}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {selectedApp.presence_analysis.portfolio_analyzed && selectedApp.presence_analysis.portfolio_metrics && (
                              <div className="space-y-2">
                                <h6 className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <Globe className="w-4 h-4" />
                                  <span>Portfolio Website Review</span>
                                </h6>
                                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Design & Usability</span>
                                    <span className="font-bold block text-slate-800 dark:text-white">
                                      {selectedApp.presence_analysis.portfolio_metrics.design_quality}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Status & Response Speed</span>
                                    <span className="font-bold block text-emerald-500">
                                      {selectedApp.presence_analysis.portfolio_metrics.availability} ({selectedApp.presence_analysis.portfolio_metrics.page_speed})
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <h5 className="font-bold text-slate-800 dark:text-slate-300 text-xs uppercase tracking-wider">AI Recommendation Context</h5>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                        {selectedApp.recruiter_notes || "Match indicates strong alignment across key criteria. Candidate demonstrates qualifications required for the role."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 pt-4">
                    {selectedApp.status === 'APPLIED' ? (
                      <>
                        <button onClick={() => updateAppStatus(selectedApp.id, 'reject')} className="skeuo-btn text-rose-500 hover:bg-rose-500/10 mr-3">Reject</button>
                        <button onClick={() => updateAppStatus(selectedApp.id, 'shortlist')} className="skeuo-btn skeuo-btn-secondary mr-3">Shortlist</button>
                        <button onClick={() => updateAppStatus(selectedApp.id, 'hire')} className="skeuo-btn skeuo-btn-primary">Hire Candidate</button>
                      </>
                    ) : selectedApp.status === 'SHORTLISTED' ? (
                      <>
                        <button onClick={() => updateAppStatus(selectedApp.id, 'reject')} className="skeuo-btn text-rose-500 hover:bg-rose-500/10 mr-3">Reject</button>
                        <button onClick={() => updateAppStatus(selectedApp.id, 'hire')} className="skeuo-btn skeuo-btn-primary">Hire Candidate</button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status: {selectedApp.status}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {selectedApp.seeker_profile ? (
                  <div className="space-y-6">
                    {/* Header Card */}
                    <div className="skeuo-card overflow-hidden border border-slate-200 dark:border-slate-800">
                      <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-500 to-indigo-700 relative">
                        {selectedApp.seeker_profile.cover_banner && (
                          <img src={selectedApp.seeker_profile.cover_banner} className="w-full h-full object-cover" alt="Cover" />
                        )}
                      </div>
                      
                      <div className="p-6 -mt-12 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="flex items-end gap-4">
                          <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-slate-900 bg-slate-100 overflow-hidden shadow shrink-0">
                            <img 
                              src={selectedApp.seeker_profile.profile_picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"} 
                              className="w-full h-full object-cover" 
                              alt="Avatar" 
                            />
                          </div>
                          <div>
                            <h4 className="text-xl font-extrabold text-slate-800 dark:text-white">
                              {selectedApp.seeker_profile.user?.first_name} {selectedApp.seeker_profile.user?.last_name}
                            </h4>
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                              {selectedApp.seeker_profile.headline || "Job Seeker"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">
                              {selectedApp.seeker_profile.location || "Location not provided"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col text-xs text-slate-500 font-semibold gap-1">
                          <span>Email: {selectedApp.seeker_profile.user?.email || selectedApp.seeker_email}</span>
                          {selectedApp.seeker_profile.user?.phone && (
                            <span>Phone: {selectedApp.seeker_profile.user.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Summary & Objectives */}
                    {(selectedApp.seeker_profile.summary || selectedApp.seeker_profile.objective || selectedApp.seeker_profile.about_me) && (
                      <div className="skeuo-card p-6 space-y-4">
                        <h4 className="font-extrabold text-sm border-b pb-2">About & Summary</h4>
                        <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                          {selectedApp.seeker_profile.summary && (
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Professional Summary</span>
                              <p className="whitespace-pre-line">{selectedApp.seeker_profile.summary}</p>
                            </div>
                          )}
                          {selectedApp.seeker_profile.objective && (
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Career Objective</span>
                              <p className="whitespace-pre-line">{selectedApp.seeker_profile.objective}</p>
                            </div>
                          )}
                          {selectedApp.seeker_profile.about_me && (
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">About Me</span>
                              <p className="whitespace-pre-line">{selectedApp.seeker_profile.about_me}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Education & Experience Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Education */}
                      <div className="skeuo-card p-6 space-y-4">
                        <h4 className="font-extrabold text-sm border-b pb-2 flex items-center gap-1.5 text-slate-800 dark:text-white">
                          <GraduationCap className="w-4.5 h-4.5 text-indigo-500" />
                          <span>Education History</span>
                        </h4>
                        <div className="space-y-4">
                          {(selectedApp.seeker_profile.educations || []).map((edu) => (
                            <div key={edu.id} className="border-l-2 border-blue-500/30 pl-3 space-y-1">
                              <h5 className="font-bold text-xs">{edu.degree}</h5>
                              <p className="text-[11px] font-bold text-slate-500">{edu.college} • {edu.branch}</p>
                              <p className="text-[10px] text-slate-400">Grade: {edu.cgpa || 'N/A'} • {edu.start_year} - {edu.end_year}</p>
                              {edu.description && <p className="text-[10px] text-slate-500 mt-1">{edu.description}</p>}
                            </div>
                          ))}
                          {(selectedApp.seeker_profile.educations || []).length === 0 && (
                            <p className="text-xs text-slate-400 italic">No education history recorded.</p>
                          )}
                        </div>
                      </div>

                      {/* Experience */}
                      <div className="skeuo-card p-6 space-y-4">
                        <h4 className="font-extrabold text-sm border-b pb-2 flex items-center gap-1.5 text-slate-800 dark:text-white">
                          <Layers className="w-4.5 h-4.5 text-indigo-500" />
                          <span>Work Experience</span>
                        </h4>
                        <div className="space-y-4">
                          {(selectedApp.seeker_profile.experiences || []).map((exp) => (
                            <div key={exp.id} className="border-l-2 border-indigo-500/30 pl-3 space-y-1">
                              <h5 className="font-bold text-xs">{exp.job_title}</h5>
                              <p className="text-[11px] font-bold text-slate-500">{exp.company_name} • {exp.employment_type} {exp.location ? `• ${exp.location}` : ''}</p>
                              <p className="text-[10px] text-slate-400">{exp.start_date} - {exp.currently_working ? 'Present' : exp.end_date}</p>
                              {exp.description && <p className="text-[10px] text-slate-500 mt-1">{exp.description}</p>}
                            </div>
                          ))}
                          {(selectedApp.seeker_profile.experiences || []).length === 0 && (
                            <p className="text-xs text-slate-400 italic">No work experience recorded.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Skills & Certifications */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Skills */}
                      <div className="skeuo-card p-6 space-y-4">
                        <h4 className="font-extrabold text-sm border-b pb-2 flex items-center gap-1.5 text-slate-800 dark:text-white">
                          <Code className="w-4.5 h-4.5 text-indigo-500" />
                          <span>Skills & Core Competencies</span>
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedApp.seeker_profile.skills_list || []).map((s) => (
                            <span key={s.id} className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-500/10">
                              {s.name} ({s.level})
                            </span>
                          ))}
                          {(selectedApp.seeker_profile.skills_list || []).length === 0 && (
                            <p className="text-xs text-slate-400 italic">No skills listed.</p>
                          )}
                        </div>
                      </div>

                      {/* Certifications */}
                      <div className="skeuo-card p-6 space-y-4">
                        <h4 className="font-extrabold text-sm border-b pb-2 flex items-center gap-1.5 text-slate-800 dark:text-white">
                          <Star className="w-4.5 h-4.5 text-indigo-500" />
                          <span>Certifications</span>
                        </h4>
                        <div className="space-y-3">
                          {(selectedApp.seeker_profile.certifications_list || []).map((cert) => (
                            <div key={cert.id} className="text-xs space-y-0.5">
                              <h5 className="font-bold text-slate-800 dark:text-slate-200">{cert.name}</h5>
                              <p className="font-semibold text-slate-500">{cert.issuing_organization}</p>
                              <p className="text-[10px] text-slate-400">
                                Issued: {cert.issue_date || 'N/A'} • Expires: {cert.expiry_date || 'Never'}
                              </p>
                              {cert.credential_url && (
                                <a href={cert.credential_url} target="_blank" rel="noreferrer" className="text-blue-500 text-[10px] font-semibold inline-flex items-center gap-0.5">
                                  <span>Verify Certificate</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          ))}
                          {(selectedApp.seeker_profile.certifications_list || []).length === 0 && (
                            <p className="text-xs text-slate-400 italic">No certifications listed.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Key Projects */}
                    <div className="skeuo-card p-6 space-y-4">
                      <h4 className="font-extrabold text-sm border-b pb-2 flex items-center gap-1.5 text-slate-800 dark:text-white">
                        <Target className="w-4.5 h-4.5 text-indigo-500" />
                        <span>Key Projects</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(selectedApp.seeker_profile.projects_list || []).map((proj) => (
                          <div key={proj.id} className="p-4 rounded-xl skeuo-card bg-slate-50/50 dark:bg-slate-900/30 border space-y-2 text-xs">
                            <h5 className="font-extrabold">{proj.name}</h5>
                            <p className="text-slate-500 leading-normal">{proj.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {(proj.technologies_used || []).map((tech, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 border">
                                  {tech}
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-3 text-[10px] font-bold pt-1">
                              {proj.github_link && (
                                <a href={proj.github_link} target="_blank" rel="noreferrer" className="text-blue-500 inline-flex items-center gap-0.5">
                                  <span>Repository</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                              {proj.live_demo_link && (
                                <a href={proj.live_demo_link} target="_blank" rel="noreferrer" className="text-indigo-500 inline-flex items-center gap-0.5">
                                  <span>Live Demo</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                        {(selectedApp.seeker_profile.projects_list || []).length === 0 && (
                          <p className="col-span-2 text-xs text-slate-400 italic">No key projects cataloged.</p>
                        )}
                      </div>
                    </div>

                    {/* Social Web Presence Links */}
                    <div className="skeuo-card p-6 space-y-4">
                      <h4 className="font-extrabold text-sm border-b pb-2 flex items-center gap-1.5 text-slate-800 dark:text-white">
                        <Award className="w-4.5 h-4.5 text-indigo-500" />
                        <span>Professional Links & Web Presence</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs font-semibold">
                        {(selectedApp.seeker_profile.links_list || []).map((l) => (
                          <a 
                            key={l.id} 
                            href={l.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 flex items-center justify-between gap-2 transition-colors"
                          >
                            <span className="capitalize">{l.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </a>
                        ))}
                        {(selectedApp.seeker_profile.links_list || []).length === 0 && (
                          <p className="col-span-4 text-xs text-slate-400 italic">No professional links configured.</p>
                        )}
                      </div>
                    </div>

                    {/* Interests & Hobbies */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="skeuo-card p-6 space-y-3">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Globe className="w-4 h-4 text-indigo-500" />
                          <span>Interests</span>
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedApp.seeker_profile.interests_list || []).map((item) => (
                            <span key={item.id} className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold border">
                              {item.name}
                            </span>
                          ))}
                          {(selectedApp.seeker_profile.interests_list || []).length === 0 && (
                            <p className="text-xs text-slate-400 italic">No interests provided.</p>
                          )}
                        </div>
                      </div>

                      <div className="skeuo-card p-6 space-y-3">
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Star className="w-4 h-4 text-indigo-500" />
                          <span>Hobbies</span>
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedApp.seeker_profile.hobbies_list || []).map((item) => (
                            <span key={item.id} className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold border">
                              {item.name}
                            </span>
                          ))}
                          {(selectedApp.seeker_profile.hobbies_list || []).length === 0 && (
                            <p className="text-xs text-slate-400 italic">No hobbies provided.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 pt-4">
                      {selectedApp.status === 'APPLIED' ? (
                        <>
                          <button onClick={() => updateAppStatus(selectedApp.id, 'reject')} className="skeuo-btn text-rose-500 hover:bg-rose-500/10 mr-3">Reject</button>
                          <button onClick={() => updateAppStatus(selectedApp.id, 'shortlist')} className="skeuo-btn skeuo-btn-secondary mr-3">Shortlist</button>
                          <button onClick={() => updateAppStatus(selectedApp.id, 'hire')} className="skeuo-btn skeuo-btn-primary">Hire Candidate</button>
                        </>
                      ) : selectedApp.status === 'SHORTLISTED' ? (
                        <>
                          <button onClick={() => updateAppStatus(selectedApp.id, 'reject')} className="skeuo-btn text-rose-500 hover:bg-rose-500/10 mr-3">Reject</button>
                          <button onClick={() => updateAppStatus(selectedApp.id, 'hire')} className="skeuo-btn skeuo-btn-primary">Hire Candidate</button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status: {selectedApp.status}</span>
                      )}
                    </div>
                    
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <p>No complete candidate profile exists yet for this seeker. They might have only uploaded their resume without completing the setup steps.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );

  function switchRecruiterTab(tab) {
    setActiveTab(tab);
  }
}
