import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { Building, ListPlus, Users, Plus, X, Brain, Check, ShieldAlert, Award, Trash2 } from 'lucide-react';

export default function CompanyDashboard() {
  const { startLoading, stopLoading, showToast, user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Modals state
  const [showPostModal, setShowPostModal] = useState(false);
  const [showAssessModal, setShowAssessModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

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
          <div className="skeuo-card max-w-xl w-full p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <Brain className="w-5 h-5 animate-pulse" />
                <h3 className="text-xl font-extrabold tracking-tight">AI Matching Evaluator</h3>
              </div>
              <button onClick={() => setShowAssessModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="score-gauge flex-shrink-0">
                <svg className="w-24 h-24 score-gauge-ring">
                  <circle cx="48" cy="48" r="40" stroke="var(--border-light)" stroke-width="8" fill="transparent"/>
                  <circle cx="48" cy="48" r="40" stroke="var(--primary)" stroke-width="8" fill="transparent"
                          strokeDasharray="251" stroke-dashoffset={251 - (251 * selectedApp.match_score) / 100}/>
                </svg>
                <span className="score-gauge-value">{selectedApp.match_score}%</span>
              </div>
              <div>
                <h4 className="text-lg font-extrabold">{selectedApp.seeker_name}</h4>
                <p className="text-sm text-slate-500 mt-1">Application for {selectedApp.job_title}</p>
              </div>
            </div>
            
            <div className="space-y-4 text-sm max-h-[40vh] overflow-y-auto">
              <div>
                <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"><Award className="w-4 h-4 text-green-500" /> Candidate Strengths</h5>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {(selectedApp.strengths || []).map((s, idx) => <li key={idx}>{s}</li>)}
                  {(selectedApp.strengths || []).length === 0 && <li>Solid core credentials match.</li>}
                </ul>
              </div>
              
              <div>
                <h5 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1"><ShieldAlert className="w-4 h-4 text-amber-500" /> Detected Skill Gaps</h5>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {(selectedApp.missing_skills || []).map((g, idx) => <li key={idx}>{g}</li>)}
                  {(selectedApp.missing_skills || []).length === 0 && <li>No critical skill gaps identified.</li>}
                </ul>
              </div>
              
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <h5 className="font-bold text-slate-800 dark:text-slate-300 text-xs uppercase tracking-wider">AI Hiring Recommendation</h5>
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
      )}

    </div>
  );

  function switchRecruiterTab(tab) {
    setActiveTab(tab);
  }
}
