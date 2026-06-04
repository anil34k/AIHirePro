import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../App';
import api from '../api';
import { User, Mail, Shield, Check, Globe, Layout, Eye, EyeOff, Code, Briefcase, GraduationCap, Award } from 'lucide-react';

export default function Portfolio() {
  const { username } = useParams();
  const { user, startLoading, stopLoading, showToast } = useAuth();
  const [isPublic, setIsPublic] = useState(!!username);
  
  // Settings state
  const [isVisible, setIsVisible] = useState(true);
  const [themeStyle, setThemeStyle] = useState('MODERN');
  
  // Data state
  const [portfolioData, setPortfolioData] = useState(null);

  useEffect(() => {
    fetchPortfolioData();
  }, [username]);

  const fetchPortfolioData = async () => {
    startLoading("Syncing Portfolio", "Fetching layout configurations...");
    try {
      if (isPublic) {
        const res = await api.get(`portfolio/${username}/`);
        setPortfolioData(res);
        setThemeStyle(res.theme_style || 'MODERN');
      } else {
        const res = await api.get('portfolio/settings/');
        setPortfolioData(res);
        setIsVisible(res.is_visible);
        setThemeStyle(res.theme_style || 'MODERN');
      }
      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Sync Failed", e.message, "error");
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    startLoading("Updating Settings", "Saving visualization profiles...");
    try {
      const res = await api.post('portfolio/settings/', {
        is_visible: isVisible,
        theme_style: themeStyle
      });
      setPortfolioData(res);
      showToast("Settings Updated", "Portfolio settings saved successfully.", "success");
      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Save Failed", e.message, "error");
    }
  };

  if (!portfolioData) {
    return (
      <div className="text-center p-8 text-slate-400">
        <p>No active portfolio configuration found or it has been set to private.</p>
      </div>
    );
  }

  // Public View layout
  const renderPublicView = () => {
    const isSkeuo = themeStyle === 'SKEUOMORPHIC';
    
    return (
      <div className={`space-y-8 ${isSkeuo ? 'p-8 max-w-4xl mx-auto' : 'p-4 max-w-3xl mx-auto'}`}>
        
        {/* Header Section */}
        <div className={isSkeuo ? 'skeuo-card p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-b-4 border-indigo-600' : 'bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm'}>
          <div className="space-y-1 text-center sm:text-left">
            <span className={isSkeuo ? 'text-[10px] uppercase font-bold text-indigo-600 tracking-wider' : 'text-xs text-blue-400 font-bold uppercase tracking-widest'}>Verified Candidate</span>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">{portfolioData.seeker_name}</h2>
            <div className="flex items-center gap-2 justify-center sm:justify-start text-xs text-slate-500 mt-1">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{portfolioData.seeker_email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>AI Verified Profile</span>
            </span>
          </div>
        </div>

        {/* Skillset */}
        <div className={isSkeuo ? 'skeuo-card p-6 space-y-4' : 'bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-3 shadow-sm'}>
          <h3 className="text-base font-extrabold flex items-center gap-2 text-indigo-600">
            <Code className="w-5 h-5" />
            <span>Technical Expertise</span>
          </h3>
          <div className="flex flex-wrap gap-2 pt-2">
            {(portfolioData.skills || []).map((skill, idx) => (
              <span key={idx} className={isSkeuo ? 'px-3.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-500/10' : 'px-3 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}>
                {skill}
              </span>
            ))}
            {(portfolioData.skills || []).length === 0 && <span className="text-xs text-slate-400">No skills declared.</span>}
          </div>
        </div>

        {/* Experience & Projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className={isSkeuo ? 'skeuo-card p-6 space-y-4' : 'bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-3 shadow-sm'}>
            <h3 className="text-base font-extrabold flex items-center gap-2 text-indigo-600">
              <Briefcase className="w-5 h-5" />
              <span>Professional History</span>
            </h3>
            
            <div className="space-y-4">
              {(portfolioData.experience || []).map((exp, idx) => (
                <div key={idx} className="border-l-2 border-slate-200 dark:border-slate-800 pl-4 py-1 space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">{exp.role} at {exp.company}</h4>
                  <span className="text-[10px] text-slate-400 font-bold">{exp.start_year} - {exp.end_year}</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{exp.description}</p>
                </div>
              ))}
              {(portfolioData.experience || []).length === 0 && <span className="text-xs text-slate-400">No experience uploaded.</span>}
            </div>
          </div>

          <div className={isSkeuo ? 'skeuo-card p-6 space-y-4' : 'bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-3 shadow-sm'}>
            <h3 className="text-base font-extrabold flex items-center gap-2 text-indigo-600">
              <GraduationCap className="w-5 h-5" />
              <span>Academics & Certifications</span>
            </h3>
            
            <div className="space-y-4">
              {(portfolioData.education || []).map((edu, idx) => (
                <div key={idx} className="border-l-2 border-slate-200 dark:border-slate-800 pl-4 py-1 space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">{edu.degree} in {edu.field}</h4>
                  <span className="text-[10px] text-slate-400 font-bold">{edu.school} ({edu.start_year} - {edu.end_year})</span>
                </div>
              ))}
              {(portfolioData.education || []).length === 0 && <span className="text-xs text-slate-400">No academics uploaded.</span>}
            </div>
          </div>

        </div>

      </div>
    );
  };

  return (
    <div className="space-y-8">
      
      {/* Control panel for Seeker */}
      {!isPublic && (
        <div className="skeuo-card p-6 space-y-6 max-w-2xl mx-auto border border-blue-500/10">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <span>Public Portfolio Settings</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Make your parsed resume profile publicly searchable and customize design views.</p>
            </div>
          </div>

          <form onSubmit={saveSettings} className="space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Visibility Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-xs block">Public Visibility</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">Allow recruiters to see page.</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsVisible(prev => !prev)}
                  className={`w-12 h-6 rounded-full p-1 transition-all ${isVisible ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${isVisible ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              {/* Theme Selector */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-xs block">Design Styling</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">Style theme configuration.</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setThemeStyle('MODERN')}
                    className={`px-3 py-1.5 rounded text-[11px] font-bold border transition-all ${themeStyle === 'MODERN' ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800'}`}
                  >
                    Modern
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeStyle('SKEUOMORPHIC')}
                    className={`px-3 py-1.5 rounded text-[11px] font-bold border transition-all ${themeStyle === 'SKEUOMORPHIC' ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800'}`}
                  >
                    Skeuo
                  </button>
                </div>
              </div>

            </div>

            {/* Public Link Box */}
            {portfolioData.is_visible && (
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
                <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Your Shareable URL Link</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    className="skeuo-input text-xs w-full font-bold text-slate-500"
                    value={`http://localhost:5173/portfolio/${user.username}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`http://localhost:5173/portfolio/${user.username}`);
                      showToast("Link Copied", "Vanity URL saved to clipboard.", "success");
                    }}
                    className="skeuo-btn skeuo-btn-primary py-2 text-xs"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="skeuo-btn skeuo-btn-primary">
              <Check className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </form>
        </div>
      )}

      {/* Actual Portfolio layout */}
      {(!isPublic || portfolioData.is_visible) ? renderPublicView() : (
        <div className="text-center p-8 text-slate-400">
          <EyeOff className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="font-semibold">This profile portfolio is private or visiblity is disabled.</p>
        </div>
      )}

    </div>
  );
}
