import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { 
  CloudUpload, Brain, Search, ListTodo, User, CheckCircle, 
  AlertTriangle, Play, Check, Send, FileText, Eye, Download, 
  Trash2, Share2, Award, Sparkles, Star, Target, X, Plus, Edit,
  Globe, Code, Terminal, Cpu, Layers, ExternalLink, Image, MapPin, Phone, Mail,
  GraduationCap
} from 'lucide-react';

const Linkedin = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Github = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function SeekerDashboard() {
  const { startLoading, stopLoading, showToast, user } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');
  const [dragActive, setDragActive] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [insights, setInsights] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [recs, setRecs] = useState([]);
  const [selectedRec, setSelectedRec] = useState(null);
  
  // Search state
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [empType, setEmpType] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Applications state
  const [applications, setApplications] = useState([]);

  // EDIT PROFILE MODALS STATE
  // 1. Header
  const [showEditHeaderModal, setShowEditHeaderModal] = useState(false);
  const [headerFirstName, setHeaderFirstName] = useState('');
  const [headerLastName, setHeaderLastName] = useState('');
  const [headerHeadline, setHeaderHeadline] = useState('');
  const [headerLocation, setHeaderLocation] = useState('');
  const [headerPhone, setHeaderPhone] = useState('');

  // 2. About
  const [showEditAboutModal, setShowEditAboutModal] = useState(false);
  const [aboutSummary, setAboutSummary] = useState('');
  const [aboutObjective, setAboutObjective] = useState('');
  const [aboutMe, setAboutMe] = useState('');

  // 3. Education
  const [showEduModal, setShowEduModal] = useState(false);
  const [editingEdu, setEditingEdu] = useState(null);
  const [eduDegree, setEduDegree] = useState('');
  const [eduCollege, setEduCollege] = useState('');
  const [eduBranch, setEduBranch] = useState('');
  const [eduCgpa, setEduCgpa] = useState('');
  const [eduStartYear, setEduStartYear] = useState('');
  const [eduEndYear, setEduEndYear] = useState('');
  const [eduDesc, setEduDesc] = useState('');

  // 4. Experience
  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [expJobTitle, setExpJobTitle] = useState('');
  const [expCompanyName, setExpCompanyName] = useState('');
  const [expEmpType, setExpEmpType] = useState('Full-time');
  const [expLocation, setExpLocation] = useState('');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');
  const [expCurrentlyWorking, setExpCurrentlyWorking] = useState(false);
  const [expDesc, setExpDesc] = useState('');

  // 5. Skill
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('Intermediate');

  // 6. Certification
  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [certName, setCertName] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certIssueDate, setCertIssueDate] = useState('');
  const [certExpiryDate, setCertExpiryDate] = useState('');
  const [certCredId, setCertCredId] = useState('');
  const [certCredUrl, setCertCredUrl] = useState('');

  // 7. Project
  const [showProjModal, setShowProjModal] = useState(false);
  const [editingProj, setEditingProj] = useState(null);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projTech, setProjTech] = useState('');
  const [projGithub, setProjGithub] = useState('');
  const [projDemo, setProjDemo] = useState('');
  const [projImages, setProjImages] = useState('');

  // 8. Interest / Hobby
  const [newInterest, setNewInterest] = useState('');
  const [newHobby, setNewHobby] = useState('');

  // 9. Links input urls for inline edits
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [personalUrl, setPersonalUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [hackerrankUrl, setHackerrankUrl] = useState('');
  const [codechefUrl, setCodechefUrl] = useState('');
  const [codeforcesUrl, setCodeforcesUrl] = useState('');
  const [kaggleUrl, setKaggleUrl] = useState('');
  const [behanceUrl, setBehanceUrl] = useState('');
  const [dribbbleUrl, setDribbbleUrl] = useState('');

  const loadDashboardData = async () => {
    startLoading('Retrieving data...', 'Syncing qualifications & openings.');
    try {
      const userRes = await api.get('users/me/');
      const u = userRes;
      setCurrentUser(u);
      
      if (u.profile) {
        setHeaderFirstName(u.first_name || '');
        setHeaderLastName(u.last_name || '');
        setHeaderHeadline(u.profile.headline || '');
        setHeaderLocation(u.profile.location || '');
        setHeaderPhone(u.phone || '');
        
        setAboutSummary(u.profile.summary || '');
        setAboutObjective(u.profile.objective || '');
        setAboutMe(u.profile.about_me || '');

        // Prepopulate links
        setLinkedinUrl(u.profile.linkedin || '');
        setGithubUrl(u.profile.github || '');
        setPortfolioUrl(u.profile.portfolio || '');
        setPersonalUrl(u.profile.personal_website || '');
        setResumeUrl(u.profile.resume_website || '');
        setLeetcodeUrl(u.profile.leetcode || '');
        setHackerrankUrl(u.profile.hackerrank || '');
        setCodechefUrl(u.profile.codechef || '');
        setCodeforcesUrl(u.profile.codeforces || '');
        setKaggleUrl(u.profile.kaggle || '');
        setBehanceUrl(u.profile.behance || '');
        setDribbbleUrl(u.profile.dribbble || '');
      }

      if (u.profile?.active_resume) {
        try {
          const insightsRes = await api.get('resumes/insights/');
          setInsights(insightsRes);
        } catch (insightsErr) {
          console.error("Failed to load insights:", insightsErr);
          setInsights(null);
        }
      } else {
        setInsights(null);
      }

      const recsRes = await api.get('seeker/recommendations/');
      setRecs(recsRes);

      const appsRes = await api.get('applications/');
      setApplications(appsRes);

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

  // CRUD HELPER METHODS
  const handleSectionAdd = async (section, payload) => {
    startLoading('Saving entry...', 'Creating profile item.');
    try {
      await api.post(`profile/${section}/`, payload);
      showToast("Entry Added", "Profile details updated successfully.", "success");
      await loadDashboardData();
    } catch (err) {
      stopLoading();
      showToast("Add Failed", err.message, "error");
    }
  };

  const handleSectionEdit = async (section, id, payload) => {
    startLoading('Saving changes...', 'Updating profile item.');
    try {
      await api.put(`profile/${section}/${id}/`, payload);
      showToast("Entry Updated", "Profile changes saved successfully.", "success");
      await loadDashboardData();
    } catch (err) {
      stopLoading();
      showToast("Edit Failed", err.message, "error");
    }
  };

  const handleSectionDelete = async (section, id) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    startLoading('Removing entry...', 'Deleting profile item.');
    try {
      await api.delete(`profile/${section}/${id}/`);
      showToast("Entry Removed", "Profile item deleted successfully.", "success");
      await loadDashboardData();
    } catch (err) {
      stopLoading();
      showToast("Delete Failed", err.message, "error");
    }
  };

  // Profile picture/banner mock upload (sets placeholders for demo, saves text/urls)
  const handlePhotoUpload = async (type) => {
    const mockUrls = {
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      banner: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=800"
    };

    startLoading('Uploading media...', 'Applying profile artwork.');
    try {
      const payload = type === 'avatar' 
        ? { profile_picture: null, headline: headerHeadline } // in production use actual files; for now we write mock placeholder or headlines
        : { cover_banner: null };
      
      // Update with mocks via API
      await api.put('users/me/', type === 'avatar' 
        ? { first_name: headerFirstName, last_name: headerLastName }
        : {}
      );
      showToast("Upload Simulation", "Uploaded media files successfully.", "success");
      await loadDashboardData();
    } catch (err) {
      stopLoading();
      showToast("Upload Failed", err.message, "error");
    }
  };

  // Header Save
  const handleSaveHeader = async (e) => {
    e?.preventDefault();
    startLoading('Saving details...', 'Updating header console.');
    try {
      await api.put('users/me/', {
        first_name: headerFirstName,
        last_name: headerLastName,
        phone: headerPhone,
        headline: headerHeadline,
        location: headerLocation
      });
      showToast("Header Updated", "Personal info and headline saved.", "success");
      setShowEditHeaderModal(false);
      await loadDashboardData();
    } catch (err) {
      stopLoading();
      showToast("Update Failed", err.message, "error");
    }
  };

  // About Save
  const handleSaveAbout = async (e) => {
    e?.preventDefault();
    startLoading('Saving summary...', 'Updating about information.');
    try {
      await api.put('users/me/', {
        summary: aboutSummary,
        objective: aboutObjective,
        about_me: aboutMe
      });
      showToast("About Info Saved", "Summary and objectives updated.", "success");
      setShowEditAboutModal(false);
      await loadDashboardData();
    } catch (err) {
      stopLoading();
      showToast("Update Failed", err.message, "error");
    }
  };

  // Specific forms submit handlers
  const handleEduSubmit = (e) => {
    e.preventDefault();
    const payload = {
      degree: eduDegree,
      college: eduCollege,
      branch: eduBranch,
      cgpa: eduCgpa,
      start_year: parseInt(eduStartYear),
      end_year: parseInt(eduEndYear),
      description: eduDesc
    };
    if (editingEdu) {
      handleSectionEdit('education', editingEdu.id, payload);
    } else {
      handleSectionAdd('education', payload);
    }
    setShowEduModal(false);
    setEditingEdu(null);
  };

  const handleExpSubmit = (e) => {
    e.preventDefault();
    const payload = {
      job_title: expJobTitle,
      company_name: expCompanyName,
      employment_type: expEmpType,
      location: expLocation,
      start_date: expStartDate,
      end_date: expCurrentlyWorking ? null : expEndDate,
      currently_working: expCurrentlyWorking,
      description: expDesc
    };
    if (editingExp) {
      handleSectionEdit('experience', editingExp.id, payload);
    } else {
      handleSectionAdd('experience', payload);
    }
    setShowExpModal(false);
    setEditingExp(null);
  };

  const handleCertSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: certName,
      issuing_organization: certOrg,
      issue_date: certIssueDate || null,
      expiry_date: certExpiryDate || null,
      credential_id: certCredId,
      credential_url: certCredUrl
    };
    if (editingCert) {
      handleSectionEdit('certifications', editingCert.id, payload);
    } else {
      handleSectionAdd('certifications', payload);
    }
    setShowCertModal(false);
    setEditingCert(null);
  };

  const handleProjSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: projName,
      description: projDesc,
      technologies_used: projTech.split(',').map(t => t.trim()).filter(t => t),
      github_link: projGithub,
      live_demo_link: projDemo,
      images: projImages ? projImages.split(',').map(i => i.trim()).filter(i => i) : []
    };
    if (editingProj) {
      handleSectionEdit('projects', editingProj.id, payload);
    } else {
      handleSectionAdd('projects', payload);
    }
    setShowProjModal(false);
    setEditingProj(null);
  };

  // Resume drag files
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
      await api.post('resumes/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast("Resume Processed", "Structured profile matches saved.", "success");
      loadDashboardData();
    } catch (err) {
      stopLoading();
      showToast("Parser Error", err.response?.data?.error || err.message, "error");
    }
  };

  const handleDeleteResume = async () => {
    if (!confirm("Are you sure you want to permanently delete your resume? This will reset your profile skills and details.")) return;
    startLoading('Deleting Resume...', 'Removing resume record and clearing skills.');
    try {
      await api.delete('resumes/upload/');
      showToast("Resume Deleted", "Resume and profile metrics cleared.", "success");
      setInsights(null);
      await loadDashboardData();
    } catch (err) {
      stopLoading();
      showToast("Delete Error", err.response?.data?.error || err.message, "error");
    }
  };

  const handleShare = () => {
    if (currentUser.profile?.active_resume?.file_url) {
      navigator.clipboard.writeText(currentUser.profile.active_resume.file_url);
      showToast("Copied to Clipboard", "Resume link successfully copied.", "success");
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

  // Link save card handler
  const handleLinkSave = async (platformName, url) => {
    try {
      startLoading('Saving URL...', `Associating profile link for ${platformName}...`);
      await api.put('users/me/', {
        [platformName]: url
      });
      showToast("Link Saved", `${platformName} URL updated successfully.`, "success");
      await loadDashboardData();
    } catch (err) {
      stopLoading();
      showToast("Save Failed", err.message, "error");
    }
  };

  // Link delete card handler
  const handleLinkDelete = async (platformName) => {
    try {
      startLoading('Removing URL...', `Deleting link for ${platformName}...`);
      await api.put('users/me/', {
        [platformName]: ''
      });
      showToast("Link Deleted", `${platformName} URL cleared.`, "success");
      await loadDashboardData();
    } catch (err) {
      stopLoading();
      showToast("Delete Failed", err.message, "error");
    }
  };

  const extractUsername = (url, platform) => {
    if (!url) return '';
    try {
      const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');
      const parts = cleanUrl.split('/');
      if (platform === 'linkedin') {
        const inIdx = parts.indexOf('in');
        if (inIdx !== -1 && parts[inIdx + 1]) return parts[inIdx + 1];
      }
      const filtered = parts.filter(p => p);
      if (filtered.length > 1) {
        return filtered[filtered.length - 1];
      }
      return cleanUrl;
    } catch (e) {
      return 'profile';
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

  // PROFESSIONAL LINK CARD (Redesigned with URL inputs, Verify/Edit/Delete actions)
  const renderRedesignedLinkCard = (label, platformName, currentUrl, urlSetter, placeholder, colorClasses) => {
    const isActive = !!currentUrl;
    
    let Icon = Globe;
    if (platformName === 'linkedin') Icon = Linkedin;
    else if (platformName === 'github') Icon = Github;
    else if (platformName === 'leetcode') Icon = Code;
    else if (platformName === 'hackerrank') Icon = Terminal;
    else if (platformName === 'codechef') Icon = Terminal;
    else if (platformName === 'codeforces') Icon = Cpu;
    else if (platformName === 'kaggle') Icon = Layers;
    else if (platformName === 'behance') Icon = Sparkles;
    else if (platformName === 'dribbble') Icon = Sparkles;

    return (
      <div className={`skeuo-card p-4 space-y-3 border transition-all duration-300 ${
        isActive 
          ? 'border-blue-500/20 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50' 
          : 'opacity-85 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? colorClasses : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{label}</span>
            <span className="text-[10px] text-slate-400 font-medium block">
              {isActive ? extractUsername(currentUrl, platformName) : 'Not Setup'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <input 
            type="url" 
            className="skeuo-input text-[11px] py-1 px-2 w-full"
            placeholder={placeholder}
            value={currentUrl}
            onChange={(e) => urlSetter(e.target.value)}
          />
          <div className="flex gap-1">
            <button 
              onClick={() => handleLinkSave(platformName, currentUrl)}
              className="flex-1 text-[10px] py-1 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
            {isActive && (
              <>
                <a 
                  href={currentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-[10px] py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-center rounded font-bold flex items-center justify-center gap-1"
                >
                  <span>Verify</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <button 
                  onClick={() => {
                    urlSetter('');
                    handleLinkDelete(platformName);
                  }}
                  className="px-2 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Candidate Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Review AI recommendations, check skill gaps, and track active applications.</p>
        </div>
        
        {/* Progress gauge */}
        {currentUser?.profile && (
          <div className="skeuo-card px-4 py-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-blue-600/20 border-t-blue-600 flex items-center justify-center font-bold text-xs">
              {currentUser.profile.profile_completed || 0}%
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Profile Completed</span>
              <span className="text-xs font-semibold block text-slate-500">
                {(currentUser.profile.profile_completed || 0) >= 80 ? 'Robust resume profile' : 'Complete details to boost ranking'}
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
            <FileText className="w-4 h-4" />
            <span>My Resume</span>
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
        
        {/* TAB 1: MY RESUME (ONLY RESUME DETAILS & INSIGHTS) */}
        {activeTab === 'upload' && (
          <div className="p-6 space-y-6">
            {currentUser.profile?.active_resume ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side: Upload card & details */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="skeuo-card p-6 space-y-6 border border-blue-500/10">
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <span>Active Resume</span>
                    </h3>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1 overflow-hidden">
                        <h4 className="font-bold text-sm truncate" title={currentUser.profile.active_resume.file_name}>
                          {currentUser.profile.active_resume.file_name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-semibold">
                          Uploaded: {new Date(currentUser.profile.active_resume.uploaded_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[11px] text-slate-400 font-semibold">
                          Size: {currentUser.profile.active_resume.file_size ? `${(currentUser.profile.active_resume.file_size / 1024 / 1024).toFixed(2)} MB` : '0 KB'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button onClick={() => setShowViewer(true)} className="skeuo-btn skeuo-btn-primary py-2 text-xs flex items-center justify-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Resume</span>
                      </button>
                      <a href={currentUser.profile.active_resume.file_url} download className="skeuo-btn skeuo-btn-secondary py-2 text-xs flex items-center justify-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                      <button onClick={() => document.getElementById('replace-resume-input').click()} className="skeuo-btn skeuo-btn-secondary py-2 text-xs flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Replace</span>
                      </button>
                      <button onClick={handleDeleteResume} className="skeuo-btn text-rose-500 hover:bg-rose-500/10 py-2 text-xs flex items-center justify-center gap-1.5 border border-rose-500/20">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                      <button onClick={handleShare} className="col-span-2 skeuo-btn skeuo-btn-secondary py-2 text-xs flex items-center justify-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Resume</span>
                      </button>
                    </div>
                    <input type="file" id="replace-resume-input" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
                  </div>

                  {/* Insights card */}
                  {insights && (
                    <div className="skeuo-card p-6 space-y-6 border border-indigo-500/10">
                      <h3 className="text-base font-extrabold text-indigo-600 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <Brain className="w-5 h-5 animate-pulse" />
                        <span>Match Insights</span>
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="skeuo-card p-3 text-center border border-indigo-500/10">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Resume Strength</span>
                          <span className="text-xl font-extrabold text-blue-500">{insights.strength_score}%</span>
                        </div>
                        <div className="skeuo-card p-3 text-center border border-indigo-500/10">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">ATS Score</span>
                          <span className="text-xl font-extrabold text-indigo-500">{insights.ats_score}%</span>
                        </div>
                        <div className="skeuo-card p-3 text-center col-span-2 border border-indigo-500/10 flex items-center justify-between px-6">
                          <span className="text-xs font-bold text-slate-500 uppercase">Skill Match Score</span>
                          <span className="text-base font-extrabold text-emerald-500">{insights.skill_match_percentage}%</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-slate-500 block uppercase mb-2">Market Missing Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {insights.missing_skills.map((skill, idx) => (
                            <span key={idx} className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold border border-amber-500/15">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <span className="text-xs font-bold text-slate-500 block uppercase">Recommended Improvements</span>
                        <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {insights.recommended_improvements.map((imp, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Target className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                              <span>{imp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side: Resume Parsing Results */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="skeuo-card p-6 space-y-6 border border-blue-500/10">
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                      <span>Resume Parsing Results</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="skeuo-card p-4 border border-blue-500/10 md:col-span-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Identity Extracted</span>
                        <h4 className="text-lg font-extrabold mt-1">
                          {currentUser.profile.active_resume.parsed_json?.name || `${currentUser.first_name} ${currentUser.last_name}`}
                        </h4>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2 font-semibold">
                          {currentUser.profile.active_resume.parsed_json?.email && <span>Email: {currentUser.profile.active_resume.parsed_json.email}</span>}
                          {currentUser.profile.active_resume.parsed_json?.phone && <span>Phone: {currentUser.profile.active_resume.parsed_json.phone}</span>}
                        </div>
                      </div>

                      <div className="skeuo-card p-4 border border-blue-500/10 md:col-span-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Technical Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(currentUser.profile.active_resume.parsed_json?.skills || []).map((skill, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-500/10">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="skeuo-card p-4 border border-blue-500/10">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Education History</span>
                        <div className="space-y-4">
                          {(currentUser.profile.active_resume.parsed_json?.education || []).map((edu, idx) => (
                            <div key={idx} className="border-l-2 border-blue-500/30 pl-3 py-0.5">
                              <h5 className="font-bold text-sm">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</h5>
                              <p className="text-xs text-slate-500 font-semibold">{edu.school}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{edu.start_year} - {edu.end_year}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="skeuo-card p-4 border border-blue-500/10">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Experience Extracted</span>
                        <div className="space-y-4">
                          {(currentUser.profile.active_resume.parsed_json?.experience || []).map((exp, idx) => (
                            <div key={idx} className="border-l-2 border-indigo-500/30 pl-3 py-0.5">
                              <h5 className="font-bold text-sm">{exp.role}</h5>
                              <p className="text-xs text-slate-500 font-semibold">{exp.company} {exp.location ? `• ${exp.location}` : ''}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{exp.start_year} - {exp.end_year}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
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
                  <input type="file" id="resume-file-input" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
                  <button onClick={() => document.getElementById('resume-file-input').click()} type="button" className="skeuo-btn skeuo-btn-secondary">
                    <span>Browse Files</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI JOB RECOMMENDATIONS */}
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MANUAL SEARCH */}
        {activeTab === 'search' && (
          <div className="p-6 space-y-6">
            <form onSubmit={handleSearchSubmit} className="skeuo-card p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50">
              <input type="text" className="skeuo-input text-sm" placeholder="Title, keyword, skill..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
              <input type="text" className="skeuo-input text-sm" placeholder="City or Remote" value={location} onChange={(e) => setLocation(e.target.value)} />
              <select className="skeuo-input bg-transparent text-sm text-slate-800 dark:text-white" value={empType} onChange={(e) => setEmpType(e.target.value)}>
                <option value="" className="dark:bg-slate-900 text-slate-800 dark:text-white">Employment Type (Any)</option>
                <option value="FULL_TIME" className="dark:bg-slate-900 text-slate-800 dark:text-white">Full-time</option>
                <option value="PART_TIME" className="dark:bg-slate-900 text-slate-800 dark:text-white">Part-time</option>
                <option value="CONTRACT" className="dark:bg-slate-900 text-slate-800 dark:text-white">Contract</option>
                <option value="INTERNSHIP" className="dark:bg-slate-900 text-slate-800 dark:text-white">Internship</option>
                <option value="REMOTE" className="dark:bg-slate-900 text-slate-800 dark:text-white">Remote</option>
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

        {/* TAB 4: MY APPLICATIONS */}
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
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: REDESIGNED LINKEDIN-STYLE EDIT PROFILE PAGE */}
        {activeTab === 'profile' && (
          <div className="p-6 space-y-8 max-w-4xl mx-auto">
            
            {/* PROFILE HEADER CARD */}
            <div className="skeuo-card overflow-hidden border border-slate-200 dark:border-slate-800">
              {/* Cover Banner Area */}
              <div className="h-44 bg-gradient-to-r from-blue-600 via-indigo-500 to-indigo-700 relative">
                {currentUser?.profile?.cover_banner ? (
                  <img src={currentUser.profile.cover_banner} className="w-full h-full object-cover" alt="Cover Banner" />
                ) : (
                  <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <span>Default Cover Banner</span>
                  </div>
                )}
                <button 
                  onClick={() => handlePhotoUpload('banner')}
                  className="absolute right-4 bottom-4 p-2 bg-black/40 text-white rounded-lg hover:bg-black/60 transition-all flex items-center gap-1.5 text-xs font-bold"
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Edit Banner</span>
                </button>
              </div>

              {/* Avatar and Identity block */}
              <div className="p-6 relative pt-0">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-16 mb-4">
                  <div className="relative w-32 h-32 rounded-2xl border-4 border-white dark:border-slate-900 bg-slate-100 overflow-hidden shadow-md shrink-0">
                    <img 
                      src={currentUser?.profile?.profile_picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"} 
                      className="w-full h-full object-cover" 
                      alt="Profile Avatar" 
                    />
                    <button 
                      onClick={() => handlePhotoUpload('avatar')}
                      className="absolute inset-0 bg-black/40 text-white opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold"
                    >
                      Change Photo
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setShowEditHeaderModal(true)} className="skeuo-btn skeuo-btn-secondary text-xs flex items-center gap-1.5">
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Header</span>
                    </button>
                    <button onClick={handleSaveHeader} className="skeuo-btn skeuo-btn-primary text-xs">
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                    {currentUser?.first_name} {currentUser?.last_name}
                  </h2>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {currentUser?.profile?.headline || "Add a professional headline..."}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-semibold pt-1">
                    {currentUser?.profile?.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {currentUser.profile.location}</span>
                    )}
                    {currentUser?.phone && (
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {currentUser.phone}</span>
                    )}
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {currentUser?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PROFILE COMPLETION TRACKER */}
            <div className="skeuo-card p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-base">Profile Strength</h3>
                <span className="text-xs font-extrabold text-blue-600">{currentUser?.profile?.profile_completed || 0}% Complete</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${currentUser?.profile?.profile_completed || 0}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                  <span>Basic Info</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {currentUser?.profile?.educations?.length > 0 ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                  ) : (
                    <X className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Education</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {currentUser?.profile?.skills_list?.length > 0 ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                  ) : (
                    <X className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Skills Added</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {currentUser?.profile?.active_resume ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                  ) : (
                    <X className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Resume Uploaded</span>
                </div>
              </div>
            </div>

            {/* ABOUT / SUMMARY SECTION */}
            <div className="skeuo-card p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-800 dark:text-white">
                  <User className="w-5 h-5 text-indigo-500" />
                  <span>About & Summary</span>
                </h3>
                <button onClick={() => setShowEditAboutModal(true)} className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-1">
                  <Edit className="w-3.5 h-3.5" /> Edit About
                </button>
              </div>

              <div className="space-y-4 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Professional Summary</span>
                  <p className="whitespace-pre-line">{currentUser?.profile?.summary || "No summary provided yet. Add one to explain your career trajectory..."}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Career Objective</span>
                  <p className="whitespace-pre-line">{currentUser?.profile?.objective || "Add a career objective detailing your target roles..."}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">About Me</span>
                  <p className="whitespace-pre-line">{currentUser?.profile?.about_me || "Describe your personal background and highlights..."}</p>
                </div>
              </div>
            </div>

            {/* EDUCATION HISTORY */}
            <div className="skeuo-card p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-800 dark:text-white">
                  <GraduationCap className="w-5 h-5 text-indigo-500" />
                  <span>Education History</span>
                </h3>
                <button 
                  onClick={() => {
                    setEditingEdu(null);
                    setEduDegree('');
                    setEduCollege('');
                    setEduBranch('');
                    setEduCgpa('');
                    setEduStartYear('');
                    setEduEndYear('');
                    setEduDesc('');
                    setShowEduModal(true);
                  }} 
                  className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Education
                </button>
              </div>

              <div className="space-y-4">
                {(currentUser?.profile?.educations || []).map((edu) => (
                  <div key={edu.id} className="p-4 rounded-xl skeuo-card bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-start text-xs border border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm">{edu.degree}</h4>
                      <p className="font-bold text-slate-500">{edu.college} • {edu.branch}</p>
                      <p className="text-[10px] text-slate-400">Grade: {edu.cgpa || 'N/A'} • Period: {edu.start_year} - {edu.end_year}</p>
                      {edu.description && <p className="text-slate-500 mt-2 whitespace-pre-line leading-relaxed">{edu.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingEdu(edu);
                          setEduDegree(edu.degree);
                          setEduCollege(edu.college);
                          setEduBranch(edu.branch);
                          setEduCgpa(edu.cgpa || '');
                          setEduStartYear(edu.start_year);
                          setEduEndYear(edu.end_year);
                          setEduDesc(edu.description || '');
                          setShowEduModal(true);
                        }} 
                        className="text-blue-500 hover:text-blue-600 font-bold text-[10px]"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleSectionDelete('education', edu.id)} className="text-rose-500 hover:text-rose-600 font-bold text-[10px]">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {(currentUser?.profile?.educations || []).length === 0 && (
                  <p className="text-xs text-center text-slate-400 italic">No education history recorded. Add one above.</p>
                )}
              </div>
            </div>

            {/* WORK EXPERIENCE */}
            <div className="skeuo-card p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-800 dark:text-white">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  <span>Work Experience</span>
                </h3>
                <button 
                  onClick={() => {
                    setEditingExp(null);
                    setExpJobTitle('');
                    setExpCompanyName('');
                    setExpEmpType('Full-time');
                    setExpLocation('');
                    setExpStartDate('');
                    setExpEndDate('');
                    setExpCurrentlyWorking(false);
                    setExpDesc('');
                    setShowExpModal(true);
                  }} 
                  className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Experience
                </button>
              </div>

              <div className="space-y-4">
                {(currentUser?.profile?.experiences || []).map((exp) => (
                  <div key={exp.id} className="p-4 rounded-xl skeuo-card bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-start text-xs border border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm">{exp.job_title}</h4>
                      <p className="font-bold text-slate-500">{exp.company_name} • {exp.employment_type} {exp.location ? `• ${exp.location}` : ''}</p>
                      <p className="text-[10px] text-slate-400">
                        Period: {exp.start_date} - {exp.currently_working ? 'Present' : exp.end_date}
                      </p>
                      {exp.description && <p className="text-slate-500 mt-2 whitespace-pre-line leading-relaxed">{exp.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingExp(exp);
                          setExpJobTitle(exp.job_title);
                          setExpCompanyName(exp.company_name);
                          setExpEmpType(exp.employment_type);
                          setExpLocation(exp.location || '');
                          setExpStartDate(exp.start_date);
                          setExpEndDate(exp.end_date || '');
                          setExpCurrentlyWorking(exp.currently_working);
                          setExpDesc(exp.description || '');
                          setShowExpModal(true);
                        }} 
                        className="text-blue-500 hover:text-blue-600 font-bold text-[10px]"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleSectionDelete('experience', exp.id)} className="text-rose-500 hover:text-rose-600 font-bold text-[10px]">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {(currentUser?.profile?.experiences || []).length === 0 && (
                  <p className="text-xs text-center text-slate-400 italic">No work experiences recorded. Add one above.</p>
                )}
              </div>
            </div>

            {/* SKILLS SECTION */}
            <div className="skeuo-card p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-800 dark:text-white">
                  <Code className="w-5 h-5 text-indigo-500" />
                  <span>Skills & Core Competencies</span>
                </h3>
              </div>

              {/* Inline input */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newSkillName.trim()) return;
                  handleSectionAdd('skills', { name: newSkillName.trim(), level: newSkillLevel });
                  setNewSkillName('');
                }} 
                className="flex gap-2 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl skeuo-card-pressed"
              >
                <input 
                  type="text" 
                  className="skeuo-input text-xs flex-1" 
                  placeholder="e.g. Django, Kubernetes, Machine Learning"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                />
                <select 
                  className="skeuo-input text-xs w-32 bg-transparent text-slate-800 dark:text-white"
                  value={newSkillLevel}
                  onChange={(e) => setNewSkillLevel(e.target.value)}
                >
                  <option value="Beginner" className="dark:bg-slate-900">Beginner</option>
                  <option value="Intermediate" className="dark:bg-slate-900">Intermediate</option>
                  <option value="Expert" className="dark:bg-slate-900">Expert</option>
                </select>
                <button type="submit" className="skeuo-btn skeuo-btn-secondary py-2 text-xs">Add Skill</button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2">
                {(currentUser?.profile?.skills_list || []).map((s) => (
                  <span 
                    key={s.id} 
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-500/10"
                  >
                    <span>{s.name} ({s.level})</span>
                    <button 
                      type="button" 
                      onClick={() => handleSectionDelete('skills', s.id)} 
                      className="text-blue-500 hover:text-rose-500 font-bold ml-1.5 text-xs"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(currentUser?.profile?.skills_list || []).length === 0 && (
                  <p className="text-xs text-slate-400 italic">No skills listed yet. Add tags above.</p>
                )}
              </div>
            </div>

            {/* CERTIFICATIONS */}
            <div className="skeuo-card p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-800 dark:text-white">
                  <Star className="w-5 h-5 text-indigo-500" />
                  <span>Certifications</span>
                </h3>
                <button 
                  onClick={() => {
                    setEditingCert(null);
                    setCertName('');
                    setCertOrg('');
                    setCertIssueDate('');
                    setCertExpiryDate('');
                    setCertCredId('');
                    setCertCredUrl('');
                    setShowCertModal(true);
                  }} 
                  className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Certification
                </button>
              </div>

              <div className="space-y-4">
                {(currentUser?.profile?.certifications_list || []).map((cert) => (
                  <div key={cert.id} className="p-4 rounded-xl skeuo-card bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-start text-xs border border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm">{cert.name}</h4>
                      <p className="font-bold text-slate-500">{cert.issuing_organization}</p>
                      <p className="text-[10px] text-slate-400">
                        Issued: {cert.issue_date || 'N/A'} • Expires: {cert.expiry_date || 'Never'}
                      </p>
                      {cert.credential_id && <p className="text-[10px] text-slate-400 font-semibold">ID: {cert.credential_id}</p>}
                      {cert.credential_url && (
                        <a href={cert.credential_url} target="_blank" rel="noreferrer" className="text-blue-500 font-semibold inline-flex items-center gap-1 mt-1">
                          <span>View Certificate</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingCert(cert);
                          setCertName(cert.name);
                          setCertOrg(cert.issuing_organization);
                          setCertIssueDate(cert.issue_date || '');
                          setCertExpiryDate(cert.expiry_date || '');
                          setCertCredId(cert.credential_id || '');
                          setCertCredUrl(cert.credential_url || '');
                          setShowCertModal(true);
                        }} 
                        className="text-blue-500 hover:text-blue-600 font-bold text-[10px]"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleSectionDelete('certifications', cert.id)} className="text-rose-500 hover:text-rose-600 font-bold text-[10px]">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {(currentUser?.profile?.certifications_list || []).length === 0 && (
                  <p className="text-xs text-center text-slate-400 italic">No certifications listed yet.</p>
                )}
              </div>
            </div>

            {/* PROJECTS */}
            <div className="skeuo-card p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-800 dark:text-white">
                  <Target className="w-5 h-5 text-indigo-500" />
                  <span>Key Projects</span>
                </h3>
                <button 
                  onClick={() => {
                    setEditingProj(null);
                    setProjName('');
                    setProjDesc('');
                    setProjTech('');
                    setProjGithub('');
                    setProjDemo('');
                    setProjImages('');
                    setShowProjModal(true);
                  }} 
                  className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Project
                </button>
              </div>

              <div className="space-y-4">
                {(currentUser?.profile?.projects_list || []).map((proj) => (
                  <div key={proj.id} className="p-4 rounded-xl skeuo-card bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-start text-xs border border-slate-100 dark:border-slate-800">
                    <div className="space-y-2 flex-1">
                      <h4 className="font-extrabold text-sm">{proj.name}</h4>
                      <p className="text-slate-500 leading-relaxed">{proj.description}</p>
                      
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(proj.technologies_used || []).map((tech, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 border">
                            {tech}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-3 text-[10px] font-bold pt-1">
                        {proj.github_link && (
                          <a href={proj.github_link} target="_blank" rel="noreferrer" className="text-blue-500 inline-flex items-center gap-1">
                            <span>Code Repository</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {proj.live_demo_link && (
                          <a href={proj.live_demo_link} target="_blank" rel="noreferrer" className="text-indigo-500 inline-flex items-center gap-1">
                            <span>Live Demo</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => {
                          setEditingProj(proj);
                          setProjName(proj.name);
                          setProjDesc(proj.description || '');
                          setProjTech((proj.technologies_used || []).join(', '));
                          setProjGithub(proj.github_link || '');
                          setProjDemo(proj.live_demo_link || '');
                          setProjImages((proj.images || []).join(', '));
                          setShowProjModal(true);
                        }} 
                        className="text-blue-500 hover:text-blue-600 font-bold text-[10px]"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleSectionDelete('projects', proj.id)} className="text-rose-500 hover:text-rose-600 font-bold text-[10px]">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {(currentUser?.profile?.projects_list || []).length === 0 && (
                  <p className="text-xs text-center text-slate-400 italic">No key projects cataloged yet.</p>
                )}
              </div>
            </div>

            {/* PROFESSIONAL LINKS (Redesigned Cards Grid) */}
            <div className="skeuo-card p-6 space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <h3 className="font-extrabold text-base flex items-center gap-2 text-slate-800 dark:text-white">
                  <Award className="w-5 h-5 text-indigo-500" />
                  <span>Professional Links & Web Presence</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Edit, verify, or remove your links for specific platforms below.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {renderRedesignedLinkCard('LinkedIn', 'linkedin', linkedinUrl, setLinkedinUrl, 'https://linkedin.com/in/...', 'text-blue-600 bg-blue-500/10 border-blue-500/20')}
                {renderRedesignedLinkCard('GitHub', 'github', githubUrl, setGithubUrl, 'https://github.com/...', 'text-slate-800 dark:text-white bg-slate-500/10 border-slate-500/20')}
                {renderRedesignedLinkCard('Portfolio Website', 'portfolio', portfolioUrl, setPortfolioUrl, 'https://...', 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20')}
                {renderRedesignedLinkCard('Personal Website', 'personal_website', personalUrl, setPersonalUrl, 'https://...', 'text-teal-600 bg-teal-500/10 border-teal-500/20')}
                {renderRedesignedLinkCard('Resume Website', 'resume_website', resumeUrl, setResumeUrl, 'https://...', 'text-rose-600 bg-rose-500/10 border-rose-500/20')}
                {renderRedesignedLinkCard('LeetCode', 'leetcode', leetcodeUrl, setLeetcodeUrl, 'https://leetcode.com/...', 'text-amber-600 bg-amber-500/10 border-amber-500/20')}
                {renderRedesignedLinkCard('HackerRank', 'hackerrank', hackerrankUrl, setHackerrankUrl, 'https://hackerrank.com/...', 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20')}
                {renderRedesignedLinkCard('CodeChef', 'codechef', codechefUrl, setCodechefUrl, 'https://codechef.com/...', 'text-amber-800 bg-amber-500/10 border-amber-500/20')}
                {renderRedesignedLinkCard('Codeforces', 'codeforces', codeforcesUrl, setCodeforcesUrl, 'https://codeforces.com/...', 'text-red-600 bg-red-500/10 border-red-500/20')}
                {renderRedesignedLinkCard('Kaggle', 'kaggle', kaggleUrl, setKaggleUrl, 'https://kaggle.com/...', 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20')}
                {renderRedesignedLinkCard('Behance', 'behance', behanceUrl, setBehanceUrl, 'https://behance.net/...', 'text-blue-500 bg-blue-500/10 border-blue-500/20')}
                {renderRedesignedLinkCard('Dribbble', 'dribbble', dribbbleUrl, setDribbbleUrl, 'https://dribbble.com/...', 'text-pink-600 bg-pink-500/10 border-pink-500/20')}
              </div>
            </div>

            {/* INTERESTS & HOBBIES SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Interests Card */}
              <div className="skeuo-card p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                    <Globe className="w-4.5 h-4.5 text-indigo-500" />
                    <span>Interests</span>
                  </h3>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newInterest.trim()) return;
                    handleSectionAdd('interests', { name: newInterest.trim() });
                    setNewInterest('');
                  }}
                  className="flex gap-2"
                >
                  <input type="text" className="skeuo-input text-xs flex-1" placeholder="e.g. AI, WebDev" value={newInterest} onChange={(e) => setNewInterest(e.target.value)} />
                  <button type="submit" className="skeuo-btn skeuo-btn-secondary py-1.5 text-xs">Add</button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {(currentUser?.profile?.interests_list || []).map((item) => (
                    <span key={item.id} className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold flex items-center gap-1 border">
                      <span>{item.name}</span>
                      <button onClick={() => handleSectionDelete('interests', item.id)} className="text-slate-400 hover:text-rose-500 font-bold ml-1">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Hobbies Card */}
              <div className="skeuo-card p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                    <Star className="w-4.5 h-4.5 text-indigo-500" />
                    <span>Hobbies</span>
                  </h3>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newHobby.trim()) return;
                    handleSectionAdd('hobbies', { name: newHobby.trim() });
                    setNewHobby('');
                  }}
                  className="flex gap-2"
                >
                  <input type="text" className="skeuo-input text-xs flex-1" placeholder="e.g. Gaming, Cycling" value={newHobby} onChange={(e) => setNewHobby(e.target.value)} />
                  <button type="submit" className="skeuo-btn skeuo-btn-secondary py-1.5 text-xs">Add</button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {(currentUser?.profile?.hobbies_list || []).map((item) => (
                    <span key={item.id} className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold flex items-center gap-1 border">
                      <span>{item.name}</span>
                      <button onClick={() => handleSectionDelete('hobbies', item.id)} className="text-slate-400 hover:text-rose-500 font-bold ml-1">×</button>
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* EDIT HEADERS MODAL */}
      {showEditHeaderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveHeader} className="skeuo-card max-w-md w-full p-6 space-y-4 border border-blue-500/10">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h3 className="text-base font-extrabold">Edit Profile Header</h3>
              <button type="button" onClick={() => setShowEditHeaderModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">First Name</label>
                <input type="text" className="skeuo-input text-xs" required value={headerFirstName} onChange={(e) => setHeaderFirstName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Last Name</label>
                <input type="text" className="skeuo-input text-xs" required value={headerLastName} onChange={(e) => setHeaderLastName(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Professional Headline</label>
              <input type="text" className="skeuo-input text-xs" value={headerHeadline} onChange={(e) => setHeaderHeadline(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Location</label>
                <input type="text" className="skeuo-input text-xs" value={headerLocation} onChange={(e) => setHeaderLocation(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Phone</label>
                <input type="text" className="skeuo-input text-xs" value={headerPhone} onChange={(e) => setHeaderPhone(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="skeuo-btn skeuo-btn-primary w-full py-2">Save Header Details</button>
          </form>
        </div>
      )}

      {/* EDIT ABOUT MODAL */}
      {showEditAboutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveAbout} className="skeuo-card max-w-lg w-full p-6 space-y-4 border border-blue-500/10">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h3 className="text-base font-extrabold">Edit Summary & Objectives</h3>
              <button type="button" onClick={() => setShowEditAboutModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Professional Summary</label>
              <textarea className="skeuo-input text-xs" rows="3" value={aboutSummary} onChange={(e) => setAboutSummary(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Career Objective</label>
              <textarea className="skeuo-input text-xs" rows="2" value={aboutObjective} onChange={(e) => setAboutObjective(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">About Me</label>
              <textarea className="skeuo-input text-xs" rows="3" value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} />
            </div>

            <button type="submit" className="skeuo-btn skeuo-btn-primary w-full py-2">Save About Details</button>
          </form>
        </div>
      )}

      {/* EDUCATION MODAL */}
      {showEduModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleEduSubmit} className="skeuo-card max-w-md w-full p-6 space-y-4 border border-blue-500/10">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h3 className="text-base font-extrabold">{editingEdu ? 'Edit' : 'Add'} Education Entry</h3>
              <button type="button" onClick={() => setShowEduModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">College / University</label>
              <input type="text" className="skeuo-input text-xs" required value={eduCollege} onChange={(e) => setEduCollege(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Degree</label>
              <input type="text" className="skeuo-input text-xs" required value={eduDegree} onChange={(e) => setEduDegree(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Branch / Stream</label>
              <input type="text" className="skeuo-input text-xs" required value={eduBranch} onChange={(e) => setEduBranch(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Grade / CGPA</label>
                <input type="text" className="skeuo-input text-xs" value={eduCgpa} onChange={(e) => setEduCgpa(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Start Year</label>
                <input type="number" className="skeuo-input text-xs" required value={eduStartYear} onChange={(e) => setEduStartYear(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">End Year</label>
                <input type="number" className="skeuo-input text-xs" required value={eduEndYear} onChange={(e) => setEduEndYear(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Description</label>
              <textarea className="skeuo-input text-xs" rows="2" value={eduDesc} onChange={(e) => setEduDesc(e.target.value)} />
            </div>
            <button type="submit" className="skeuo-btn skeuo-btn-primary w-full py-2">Save Education</button>
          </form>
        </div>
      )}

      {/* EXPERIENCE MODAL */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleExpSubmit} className="skeuo-card max-w-md w-full p-6 space-y-4 border border-blue-500/10">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h3 className="text-base font-extrabold">{editingExp ? 'Edit' : 'Add'} Experience Entry</h3>
              <button type="button" onClick={() => setShowExpModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Job Title</label>
              <input type="text" className="skeuo-input text-xs" required value={expJobTitle} onChange={(e) => setExpJobTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Company Name</label>
              <input type="text" className="skeuo-input text-xs" required value={expCompanyName} onChange={(e) => setExpCompanyName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Employment Type</label>
                <select className="skeuo-input text-xs bg-transparent text-slate-800 dark:text-white" value={expEmpType} onChange={(e) => setExpEmpType(e.target.value)}>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Location</label>
                <input type="text" className="skeuo-input text-xs" value={expLocation} onChange={(e) => setExpLocation(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Start Date</label>
                <input type="date" className="skeuo-input text-xs" required value={expStartDate} onChange={(e) => setExpStartDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">End Date</label>
                <input type="date" className="skeuo-input text-xs" disabled={expCurrentlyWorking} required={!expCurrentlyWorking} value={expEndDate} onChange={(e) => setExpEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="exp-current" checked={expCurrentlyWorking} onChange={(e) => setExpCurrentlyWorking(e.target.checked)} />
              <label htmlFor="exp-current" className="text-xs font-semibold text-slate-500">Currently Working Here</label>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Description</label>
              <textarea className="skeuo-input text-xs" rows="2" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} />
            </div>
            <button type="submit" className="skeuo-btn skeuo-btn-primary w-full py-2">Save Experience</button>
          </form>
        </div>
      )}

      {/* CERTIFICATION MODAL */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCertSubmit} className="skeuo-card max-w-md w-full p-6 space-y-4 border border-blue-500/10">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h3 className="text-base font-extrabold">{editingCert ? 'Edit' : 'Add'} Certification</h3>
              <button type="button" onClick={() => setShowCertModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Certificate Name</label>
              <input type="text" className="skeuo-input text-xs" required value={certName} onChange={(e) => setCertName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Issuing Organization</label>
              <input type="text" className="skeuo-input text-xs" required value={certOrg} onChange={(e) => setCertOrg(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Issue Date</label>
                <input type="date" className="skeuo-input text-xs" value={certIssueDate} onChange={(e) => setCertIssueDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Expiry Date</label>
                <input type="date" className="skeuo-input text-xs" value={certExpiryDate} onChange={(e) => setCertExpiryDate(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Credential ID</label>
              <input type="text" className="skeuo-input text-xs" value={certCredId} onChange={(e) => setCertCredId(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Credential URL</label>
              <input type="url" className="skeuo-input text-xs" placeholder="https://" value={certCredUrl} onChange={(e) => setCertCredUrl(e.target.value)} />
            </div>
            <button type="submit" className="skeuo-btn skeuo-btn-primary w-full py-2">Save Certification</button>
          </form>
        </div>
      )}

      {/* PROJECT MODAL */}
      {showProjModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleProjSubmit} className="skeuo-card max-w-md w-full p-6 space-y-4 border border-blue-500/10">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h3 className="text-base font-extrabold">{editingProj ? 'Edit' : 'Add'} Project</h3>
              <button type="button" onClick={() => setShowProjModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Project Name</label>
              <input type="text" className="skeuo-input text-xs" required value={projName} onChange={(e) => setProjName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Description</label>
              <textarea className="skeuo-input text-xs" rows="3" required value={projDesc} onChange={(e) => setProjDesc(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Technologies Used (Comma-separated)</label>
              <input type="text" className="skeuo-input text-xs" placeholder="e.g. Django, Redis, React" value={projTech} onChange={(e) => setProjTech(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">GitHub Link</label>
                <input type="url" className="skeuo-input text-xs" placeholder="https://" value={projGithub} onChange={(e) => setProjGithub(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Live Demo Link</label>
                <input type="url" className="skeuo-input text-xs" placeholder="https://" value={projDemo} onChange={(e) => setProjDemo(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Project Image URLs (Comma-separated)</label>
              <input type="text" className="skeuo-input text-xs" placeholder="https://image1.jpg, https://image2.jpg" value={projImages} onChange={(e) => setProjImages(e.target.value)} />
            </div>
            <button type="submit" className="skeuo-btn skeuo-btn-primary w-full py-2">Save Project</button>
          </form>
        </div>
      )}

      {/* Embedded Resume Viewer Modal */}
      {showViewer && currentUser.profile?.active_resume && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="skeuo-card max-w-4xl w-full p-6 space-y-4 h-[90vh] flex flex-col border border-blue-500/10">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="truncate max-w-md">{currentUser.profile.active_resume.file_name}</span>
                </h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Embedded PDF/Document Browser Viewer</p>
              </div>
              <button onClick={() => setShowViewer(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 min-h-0 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center">
              {currentUser.profile.active_resume.file_name.toLowerCase().endsWith('.pdf') ? (
                <iframe src={currentUser.profile.active_resume.file_url} className="w-full h-full border-0" title="Resume PDF Viewer" />
              ) : (
                <div className="p-8 text-center max-w-md space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base">DOCX Preview Online</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">DOCX files cannot be previewed natively in standard browser iframes. You can open the file externally or download it using the actions below.</p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <a href={currentUser.profile.active_resume.file_url} target="_blank" rel="noreferrer" className="skeuo-btn skeuo-btn-secondary py-2 text-xs">Open External</a>
                    <a href={currentUser.profile.active_resume.file_url} download className="skeuo-btn skeuo-btn-primary py-2 text-xs">Download Resume</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
