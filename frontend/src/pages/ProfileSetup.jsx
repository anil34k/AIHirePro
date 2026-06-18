import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../api';
import { 
  CloudUpload, GraduationCap, Code, FileText, CheckCircle, 
  AlertCircle, ChevronRight, ChevronLeft, Award, User, Phone, Mail
} from 'lucide-react';

export default function ProfileSetup() {
  const { fetchUser, startLoading, stopLoading, showToast, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1: Basic Info
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Step 2: Education
  const [educationList, setEducationList] = useState([]);
  const [eduDegree, setEduDegree] = useState('');
  const [eduCollege, setEduCollege] = useState('');
  const [eduBranch, setEduBranch] = useState('');
  const [eduCgpa, setEduCgpa] = useState('');
  const [eduStartYear, setEduStartYear] = useState('');
  const [eduEndYear, setEduEndYear] = useState('');
  const [eduDesc, setEduDesc] = useState('');

  // Step 3: Skills
  const [skillsList, setSkillsList] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [skillLevel, setSkillLevel] = useState('Intermediate');

  // Step 4: Resume
  const [uploadedResume, setUploadedResume] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Helper: Add Education to local list
  const handleAddEducation = (e) => {
    e.preventDefault();
    if (!eduDegree || !eduCollege || !eduBranch || !eduStartYear || !eduEndYear) {
      showToast("Missing Fields", "Please fill out all required education fields.", "warning");
      return;
    }
    const newEdu = {
      degree: eduDegree,
      school: eduCollege,
      field: eduBranch,
      grade: eduCgpa,
      start_year: eduStartYear,
      end_year: eduEndYear,
      description: eduDesc
    };
    setEducationList([...educationList, newEdu]);
    setEduDegree('');
    setEduCollege('');
    setEduBranch('');
    setEduCgpa('');
    setEduStartYear('');
    setEduEndYear('');
    setEduDesc('');
    showToast("Education Added", "Entry appended to setup profile.", "success");
  };

  const handleRemoveEducation = (idx) => {
    setEducationList(educationList.filter((_, i) => i !== idx));
  };

  // Helper: Add Skill
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (skillsList.some(s => s.name.toLowerCase() === newSkill.trim().toLowerCase())) {
      showToast("Duplicate Skill", "This skill is already listed.", "warning");
      return;
    }
    setSkillsList([...skillsList, { name: newSkill.trim(), level: skillLevel }]);
    setNewSkill('');
  };

  const handleRemoveSkill = (name) => {
    setSkillsList(skillsList.filter(s => s.name !== name));
  };

  // Helper: Handle Drag & Drop Resume
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

    startLoading('Parsing Resume...', 'Extracting profile parameters using Groq AI.');
    try {
      const response = await api.post('resumes/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast("Resume Uploaded", "Resume successfully parsed and associated.", "success");
      setUploadedResume({
        file_name: file.name,
        file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      });
      // Optionally merge parsed skills/education if available
      const parsed = response.parsed_profile;
      if (parsed) {
        if (parsed.skills && parsed.skills.length > 0) {
          const newSkills = parsed.skills.map(s => ({ name: s, level: 'Intermediate' }));
          setSkillsList(prev => {
            const combined = [...prev];
            newSkills.forEach(ns => {
              if (!combined.some(s => s.name.toLowerCase() === ns.name.toLowerCase())) {
                combined.push(ns);
              }
            });
            return combined;
          });
        }
      }
      stopLoading();
    } catch (err) {
      stopLoading();
      showToast("Parser Error", err.response?.data?.error || err.message, "error");
    }
  };

  // Step Nav validation
  const nextStep = () => {
    if (step === 1) {
      if (!firstName || !lastName || !email || !phone) {
        showToast("Required Fields", "Please complete all basic information.", "warning");
        return;
      }
    }
    if (step === 2) {
      if (educationList.length === 0) {
        showToast("Education Required", "Please add at least one education entry.", "warning");
        return;
      }
    }
    if (step === 3) {
      if (skillsList.length === 0) {
        showToast("Skills Required", "Please list at least one key skill.", "warning");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleFinishSetup = async () => {
    if (!uploadedResume) {
      showToast("Resume Missing", "Please upload your resume to complete profile activation.", "warning");
      return;
    }

    startLoading('Finalizing Profile...', 'Storing your details permanently in the database.');
    try {
      // Put basic info & setup variables
      await api.put('users/me/', {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        education: educationList,
        skills: skillsList.map(s => s.name),
        is_setup_completed: true
      });
      
      showToast("Setup Completed", "Your profile is now active! Redirecting to Seeker Console.", "success");
      stopLoading();
      await fetchUser(); // reload user state to update routes
      navigate('/seeker-dashboard');
    } catch (err) {
      stopLoading();
      showToast("Setup Error", err.message, "error");
    }
  };

  // Render Step Nav bar
  const renderStepNav = () => {
    const steps = [
      { num: 1, label: "Basic Info", icon: <User className="w-4 h-4" /> },
      { num: 2, label: "Education", icon: <GraduationCap className="w-4 h-4" /> },
      { num: 3, label: "Skills", icon: <Code className="w-4 h-4" /> },
      { num: 4, label: "Resume Upload", icon: <FileText className="w-4 h-4" /> }
    ];

    return (
      <div className="flex items-center justify-between max-w-xl mx-auto mb-8 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-2xl skeuo-card-pressed">
        {steps.map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
              step === s.num 
                ? 'bg-blue-600 text-white shadow-md' 
                : step > s.num 
                  ? 'text-emerald-500 font-bold' 
                  : 'text-slate-400 dark:text-slate-500'
            }`}>
              <div className="p-1 rounded-lg bg-black/10">
                {s.icon}
              </div>
              <span className="text-xs font-extrabold hidden md:inline">{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className="h-0.5 w-6 bg-slate-200 dark:bg-slate-800" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
          Profile Activation Wizard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Complete these quick steps to access the AIHire Pro Seeker Console.
        </p>
      </div>

      {renderStepNav()}

      {/* STEP 1: Basic Info */}
      {step === 1 && (
        <div className="skeuo-card p-8 space-y-6">
          <h2 className="text-lg font-extrabold flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <User className="w-5 h-5 text-blue-500" />
            <span>Step 1: Basic Information</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">First Name</label>
              <input 
                type="text" 
                required 
                className="skeuo-input" 
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
                className="skeuo-input" 
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                required 
                className="skeuo-input pl-10" 
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                required 
                className="skeuo-input pl-10" 
                placeholder="+1 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={nextStep} className="skeuo-btn skeuo-btn-primary">
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Education */}
      {step === 2 && (
        <div className="skeuo-card p-8 space-y-6">
          <h2 className="text-lg font-extrabold flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <GraduationCap className="w-5 h-5 text-indigo-500" />
            <span>Step 2: Education Profile</span>
          </h2>

          {/* Form to add item */}
          <form onSubmit={handleAddEducation} className="p-4 rounded-xl skeuo-card-pressed bg-slate-50 dark:bg-slate-900/30 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">College / University</label>
                <input 
                  type="text" 
                  className="skeuo-input text-xs" 
                  placeholder="e.g. Stanford University"
                  value={eduCollege}
                  onChange={(e) => setEduCollege(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Degree</label>
                <input 
                  type="text" 
                  className="skeuo-input text-xs" 
                  placeholder="e.g. B.S. Computer Science"
                  value={eduDegree}
                  onChange={(e) => setEduDegree(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Branch / Stream</label>
                <input 
                  type="text" 
                  className="skeuo-input text-xs" 
                  placeholder="e.g. Software Engineering"
                  value={eduBranch}
                  onChange={(e) => setEduBranch(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">CGPA / Percentage</label>
                <input 
                  type="text" 
                  className="skeuo-input text-xs" 
                  placeholder="e.g. 3.9 / 4.0 or 92%"
                  value={eduCgpa}
                  onChange={(e) => setEduCgpa(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Start Year</label>
                <input 
                  type="number" 
                  className="skeuo-input text-xs" 
                  placeholder="2020"
                  value={eduStartYear}
                  onChange={(e) => setEduStartYear(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">End Year</label>
                <input 
                  type="number" 
                  className="skeuo-input text-xs" 
                  placeholder="2024"
                  value={eduEndYear}
                  onChange={(e) => setEduEndYear(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Description</label>
              <textarea 
                className="skeuo-input text-xs" 
                placeholder="Major project details, extracurricular activities, coursework."
                rows="2"
                value={eduDesc}
                onChange={(e) => setEduDesc(e.target.value)}
              />
            </div>
            <button type="submit" className="skeuo-btn skeuo-btn-secondary text-xs py-2 w-full">Add Education Entry</button>
          </form>

          {/* List display */}
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {educationList.length === 0 ? (
              <p className="text-xs text-center text-slate-400 italic py-4">No education entries added yet.</p>
            ) : (
              educationList.map((edu, idx) => (
                <div key={idx} className="skeuo-card p-3 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold">{edu.degree}</h4>
                    <p className="text-[10px] text-slate-500">{edu.school} • {edu.field} ({edu.start_year} - {edu.end_year})</p>
                  </div>
                  <button 
                    onClick={() => handleRemoveEducation(idx)} 
                    className="text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors font-bold text-[10px]"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={prevStep} className="skeuo-btn skeuo-btn-secondary">
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button onClick={nextStep} className="skeuo-btn skeuo-btn-primary">
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Skills */}
      {step === 3 && (
        <div className="skeuo-card p-8 space-y-6">
          <h2 className="text-lg font-extrabold flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Code className="w-5 h-5 text-emerald-500" />
            <span>Step 3: Core Skillset</span>
          </h2>

          <form onSubmit={handleAddSkill} className="flex gap-2 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl skeuo-card-pressed">
            <input 
              type="text" 
              className="skeuo-input text-xs flex-1" 
              placeholder="e.g. Python, React, AWS, Docker"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
            />
            <select 
              className="skeuo-input text-xs w-32 bg-transparent"
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
            >
              <option value="Beginner" className="dark:bg-slate-900 text-slate-800 dark:text-white">Beginner</option>
              <option value="Intermediate" className="dark:bg-slate-900 text-slate-800 dark:text-white">Intermediate</option>
              <option value="Expert" className="dark:bg-slate-900 text-slate-800 dark:text-white">Expert</option>
            </select>
            <button type="submit" className="skeuo-btn skeuo-btn-secondary py-2 text-xs">Add</button>
          </form>

          <div>
            <span className="text-xs font-bold text-slate-400 block mb-2 uppercase">Selected Skills</span>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {skillsList.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No skills listed yet.</p>
              ) : (
                skillsList.map((s, idx) => (
                  <span 
                    key={idx} 
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-500/10"
                  >
                    <span>{s.name} ({s.level})</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSkill(s.name)} 
                      className="text-blue-500 hover:text-rose-500 ml-1 font-bold text-xs"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={prevStep} className="skeuo-btn skeuo-btn-secondary">
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button onClick={nextStep} className="skeuo-btn skeuo-btn-primary">
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Resume */}
      {step === 4 && (
        <div className="skeuo-card p-8 space-y-6">
          <h2 className="text-lg font-extrabold flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <FileText className="w-5 h-5 text-rose-500" />
            <span>Step 4: Upload Resume</span>
          </h2>

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
              <h3 className="font-extrabold text-sm">Drag & Drop Resume File</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Supports PDF & DOCX. Max file size: 5MB.</p>
            </div>
            <input 
              type="file" 
              id="wizard-resume-input" 
              className="hidden" 
              accept=".pdf,.docx"
              onChange={handleFileChange}
            />
            <button onClick={() => document.getElementById('wizard-resume-input').click()} type="button" className="skeuo-btn skeuo-btn-secondary text-xs">
              <span>Browse Files</span>
            </button>
          </div>

          {uploadedResume && (
            <div className="p-4 rounded-xl skeuo-card bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
              <div>
                <h4 className="font-bold text-xs text-emerald-600 truncate">{uploadedResume.file_name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Size: {uploadedResume.file_size} • Verified & Parsed by AI</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={prevStep} className="skeuo-btn skeuo-btn-secondary">
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button onClick={handleFinishSetup} className="skeuo-btn skeuo-btn-primary">
              <Award className="w-4 h-4" />
              <span>Finish Setup & Launch</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
