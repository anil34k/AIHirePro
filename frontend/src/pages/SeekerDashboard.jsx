import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { CloudUpload, Brain, Search, ListTodo, User, CheckCircle, AlertTriangle, Play, Check, Send } from 'lucide-react';

export default function SeekerDashboard() {
  const { startLoading, stopLoading, showToast, user } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');
  const [dragActive, setDragActive] = useState(false);
  const [previewProfile, setPreviewProfile] = useState(null);
  const [recs, setRecs] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  
  // Search state
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [empType, setEmpType] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Applications state
  const [applications, setApplications] = useState([]);

  // Seeker edit profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [skills, setSkills] = useState('');

  const loadDashboardData = async () => {
    startLoading('Retrieving data...', 'Syncing qualifications & openings.');
    try {
      // Load current user profile details
      const userRes = await api.get('users/me/');
      const u = userRes;
      if (u.profile) {
        setFirstName(u.first_name || '');
        setLastName(u.last_name || '');
        setEmail(u.email || '');
        setPhone(u.phone || '');
        setLinkedin(u.profile.linkedin || '');
        setGithub(u.profile.github || '');
        setSkills((u.profile.skills || []).join(', '));
        
        if (u.profile.skills?.length > 0) {
          setPreviewProfile({
            name: `${u.first_name} ${u.last_name}`.trim(),
            email: u.email,
            skills: u.profile.skills
          });
        }
      }

      // Load AI recommendations
      const recsRes = await api.get('seeker/recommendations/');
      setRecs(recsRes);

      // Load applied jobs
      const appsRes = await api.get('applications/');
      setApplications(appsRes);

      // Trigger default manual search
      const jobsRes = await api.get('jobs/');
      setSearchResults(jobsRes);

      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Data Sync Error", e.message, "error");
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle drag files
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadResume(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadResume(e.target.files[0]);
    }
  };

  const uploadResume = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      showToast("Format Unsupported", "Please upload PDF or DOCX file.", "error");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    startLoading('Parsing Resume...', 'Groq AI model reading text structure and matching metrics.');
    try {
      const response = await api.post('resumes/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast("Resume Processed", "Structured profile matches saved.", "success");
      
      const parsed = response.parsed_profile;
      setPreviewProfile({
        name: parsed.name || 'Candidate',
        email: parsed.email || 'Email not found',
        skills: parsed.skills || []
      });
      
      loadDashboardData();
    } catch (err) {
      stopLoading();
      showToast("Parser Error", err.response?.data?.error || err.message, "error");
    }
  };

  // Manual Job Search
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    let url = 'jobs/?status=ACTIVE';
    if (keyword) url += `&search=${encodeURIComponent(keyword)}`;
    if (location) url += `&location=${encodeURIComponent(location)}`;
    if (empType) url += `&employment_type=${empType}`;
    
    try {
      const res = await api.get(url);
      setSearchResults(res);
    } catch (err) {
      showToast("Search failed", err.message, "error");
    }
  };

  // Save profile modifications
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    startLoading('Saving Changes...', 'Updating profile settings.');
    const skillsList = skills.split(',').map(s => s.trim()).filter(s => s);
    try {
      await api.put('users/me/', {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        linkedin,
        github,
        skills: skillsList
      });
      showToast("Changes Saved", "Candidate settings updated successfully.", "success");
      loadDashboardData();
    } catch (err) {
      stopLoading();
      showToast("Save Failed", err.message, "error");
    }
  };

  // Submit job application
  const applyForJob = async (jobId) => {
    if (!confirm("Confirm job application using active resume profile?")) return;
    startLoading('Submitting Application...', 'AI evaluator computing match metrics.');
    try {
      await api.post('applications/', { job: jobId });
      showToast("Application Sent", "Successfully submitted! Recruiter has been notified.", "success");
      loadDashboardData();
    } catch (err) {
      stopLoading();
      showToast("Application Error", err.response?.data?.error || err.message, "error");
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getStatusColor = (status) => {
    if (status === 'HIRED') return 'text-green-500 font-bold';
    if (status === 'SHORTLISTED') return 'text-blue-500 font-bold';
    if (status === 'REJECTED') return 'text-red-500 font-bold';
    return 'text-slate-500';
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Candidate Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Review AI recommendations, check skill gaps, and track active applications.</p>
        </div>
        
        {/* Progress gauge */}
        {user?.profile && (
          <div className="skeuo-card px-4 py-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-blue-600/20 border-t-blue-600 flex items-center justify-center font-bold text-xs">
              {user.profile.profile_completed || 0}%
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Profile Completed</span>
              <span className="text-xs font-semibold block text-slate-500">
                {(user.profile.profile_completed || 0) >= 80 ? 'Robust resume profile' : 'Upload resume to complete'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="skeuo-card">
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('upload')} 
            className={`px-6 py-4 font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            <span>Upload Resume</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('recommendations')} 
            className={`px-6 py-4 font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'recommendations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>AI Job Matches</span>
          </button>

          <button 
            onClick={() => setActiveTab('search')} 
            className={`px-6 py-4 font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'search' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Manual Search</span>
          </button>

          <button 
            onClick={() => setActiveTab('applied')} 
            className={`px-6 py-4 font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'applied' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>My Applications</span>
          </button>

          <button 
            onClick={() => setActiveTab('profile')} 
            className={`px-6 py-4 font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'upload' && (
          <div className="p-6 space-y-6">
            <div className="max-w-xl mx-auto space-y-6">
              <div 
                className={`drop-zone p-8 flex flex-col items-center justify-center gap-4 text-center ${dragActive ? 'dragover' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <CloudUpload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">Drag & Drop Resume File</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Supports PDF & DOCX. Max file size: 5MB.</p>
                </div>
                <input 
                  type="file" 
                  id="resume-file-input" 
                  className="hidden" 
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                />
                <button onClick={() => document.getElementById('resume-file-input').click()} type="button" className="skeuo-btn skeuo-btn-secondary">
                  <span>Browse Files</span>
                </button>
              </div>

              {previewProfile && (
                <div className="skeuo-card p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h4 className="font-bold flex items-center gap-2 text-blue-600"><CheckCircle className="w-4 h-4" /> Structured Profile Created</h4>
                    <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Parsed by Groq</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Full Name</span>
                      <span className="font-bold">{previewProfile.name}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email Contact</span>
                      <span className="font-bold">{previewProfile.email}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Extracted Skillset</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {previewProfile.skills.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-500/10">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-4">
                {recs.length === 0 ? (
                  <div className="text-center p-8 text-slate-400">
                    <Brain className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold">Upload your resume to receive AI match score analysis.</p>
                  </div>
                ) : (
                  recs.map((r) => (
                    <div key={r.id} className="skeuo-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{r.job_details.company_name}</span>
                        <h4 className="text-lg font-extrabold">{r.job_details.title}</h4>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-1">
                          <span>{r.job_details.location}</span>
                          <span>${r.job_details.salary_min.toLocaleString()} - ${r.job_details.salary_max.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedRec(r)} className="skeuo-btn skeuo-btn-secondary py-2 text-xs">
                          <span>Gap Check</span>
                        </button>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Match</span>
                          <span className={`text-lg font-extrabold ${getScoreColor(r.match_score)}`}>{r.match_score}%</span>
                        </div>
                        <button onClick={() => applyForJob(r.job_details.id)} className="skeuo-btn skeuo-btn-primary py-2 text-xs">
                          <span>Apply</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Skill gap panel */}
              {selectedRec && (
                <div className="skeuo-card p-6 space-y-6 h-fit border border-blue-500/10">
                  <div className="flex items-center gap-2 text-indigo-600 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <Brain className="w-5 h-5 animate-pulse" />
                    <h3 className="font-extrabold text-base">Upskill Guide</h3>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Missing Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedRec.skill_gap_analysis?.missing_skills || []).map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-500/10">
                          {skill}
                        </span>
                      ))}
                      {(selectedRec.skill_gap_analysis?.missing_skills || []).length === 0 && (
                        <span className="text-xs text-slate-400">Excellent! You have all required skills.</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Learning Recommendations</span>
                    <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                      {(selectedRec.skill_gap_analysis?.learning_recommendations || []).map((text, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Play className="w-3 h-3 text-blue-500 mt-1 fill-blue-500" />
                          <span>{text}</span>
                        </div>
                      ))}
                      {(selectedRec.skill_gap_analysis?.learning_recommendations || []).length === 0 && (
                        <span className="text-xs text-slate-400">No matching suggestions required.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="p-6 space-y-6">
            <form onSubmit={handleSearchSubmit} className="skeuo-card p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50">
              <input 
                type="text" 
                className="skeuo-input text-sm" 
                placeholder="Title, keyword, skill..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <input 
                type="text" 
                className="skeuo-input text-sm" 
                placeholder="City or Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <select 
                className="skeuo-input bg-transparent text-sm"
                value={empType}
                onChange={(e) => setEmpType(e.target.value)}
              >
                <option value="" className="dark:bg-slate-900">Employment Type (Any)</option>
                <option value="FULL_TIME" className="dark:bg-slate-900">Full-time</option>
                <option value="PART_TIME" className="dark:bg-slate-900">Part-time</option>
                <option value="CONTRACT" className="dark:bg-slate-900">Contract</option>
                <option value="INTERNSHIP" className="dark:bg-slate-900">Internship</option>
                <option value="REMOTE" className="dark:bg-slate-900">Remote</option>
              </select>
              <button type="submit" className="skeuo-btn skeuo-btn-primary">
                <Search className="w-4 h-4" />
                <span>Search Jobs</span>
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {searchResults.length === 0 ? (
                <div className="col-span-2 text-center p-8 text-slate-400">
                  <p>No jobs found.</p>
                </div>
              ) : (
                searchResults.map(job => (
                  <div key={job.id} className="skeuo-card p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{job.company_name}</span>
                        <h4 className="text-lg font-extrabold">{job.title}</h4>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{job.employment_type}</span>
                    </div>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{job.description}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="text-xs text-slate-500 font-bold">
                        <span>${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}</span>
                      </div>
                      <button onClick={() => applyForJob(job.id)} className="skeuo-btn skeuo-btn-primary py-2 text-xs">
                        <Send className="w-3.5 h-3.5" />
                        <span>Apply</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'applied' && (
          <div className="p-6">
            <div className="skeuo-table-container">
              <table className="skeuo-table w-full text-left">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Date Applied</th>
                    <th>Match Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id}>
                      <td className="font-bold">{app.job_title}</td>
                      <td>{app.company_name}</td>
                      <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                      <td className="font-bold"><Brain className="w-4 h-4 inline mr-1 text-blue-500" /> {app.match_score}%</td>
                      <td className={getStatusColor(app.status)}>{app.status}</td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-slate-400 py-6">You haven't applied for any jobs yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-6">
            <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">First Name</label>
                  <input 
                    type="text" 
                    required 
                    className="skeuo-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Name</label>
                  <input 
                    type="text" 
                    required 
                    className="skeuo-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Email</label>
                  <input 
                    type="email" 
                    required 
                    className="skeuo-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Contact</label>
                  <input 
                    type="text" 
                    className="skeuo-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">LinkedIn URL</label>
                  <input 
                    type="url" 
                    className="skeuo-input"
                    placeholder="https://linkedin.com/in/"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">GitHub Profile URL</label>
                  <input 
                    type="url" 
                    className="skeuo-input"
                    placeholder="https://github.com/"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Skills (Comma separated list)</label>
                <input 
                  type="text" 
                  className="skeuo-input"
                  placeholder="Python, Django, React"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>

              <button type="submit" className="skeuo-btn skeuo-btn-primary">
                <span>Save Changes</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
