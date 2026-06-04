import React, { useState } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { Search, Sparkles, User, Badge, Mail, Brain, CheckSquare, AlertTriangle } from 'lucide-react';

export default function TalentScout() {
  const { startLoading, stopLoading, showToast } = useAuth();
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      showToast("Empty search", "Please input search criteria.", "warning");
      return;
    }

    startLoading("Scouting Talent", "Semantic search engine parsing candidate profiles...");
    try {
      const res = await api.post('talent-scout/search/', { query });
      setCandidates(res);
      stopLoading();
      showToast("Scout Match Complete", `Found ${res.length} matches.`, "success");
    } catch (e) {
      stopLoading();
      showToast("Scout Failed", e.message, "error");
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Talent Scout</h1>
        <p className="text-sm text-slate-500 mt-1">NL query matching engine finds job seekers and scores compatibility instantly.</p>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleSearch} className="skeuo-card p-4 flex flex-col sm:flex-row items-center gap-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50">
        <input 
          type="text" 
          className="skeuo-input flex-1 text-sm font-semibold py-2.5" 
          placeholder="e.g., django rest backend developer with docker container knowledge..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <button type="submit" className="skeuo-btn skeuo-btn-primary shrink-0 py-2.5 px-6">
          <Search className="w-4 h-4" />
          <span>Scout Candidates</span>
        </button>
      </form>

      {/* Candidate Listings */}
      <div className="space-y-4">
        {candidates.map((cand) => (
          <div key={cand.id} className="skeuo-card p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 hover:border-blue-500/20 transition-all border border-slate-200/40 dark:border-slate-800/40">
            
            {/* Left: General Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-500/10 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-tight">{cand.name}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold mt-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{cand.email}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Declared Skills</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(cand.skills || []).map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle: AI Match Breakdown */}
            <div className="space-y-3 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Matched Criteria</span>
                </span>
                <div className="space-y-1 pl-1">
                  {(cand.matched_criteria || []).map((crit, i) => (
                    <p key={i} className="leading-snug text-slate-500">{crit}</p>
                  ))}
                  {(cand.matched_criteria || []).length === 0 && <p className="text-slate-400">No specific matching skills found.</p>}
                </div>
              </div>
            </div>

            {/* Right: Scores & Actions */}
            <div className="flex flex-col justify-between items-end border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6 shrink-0">
              <div className="text-right w-full lg:w-auto">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest">Match Compatibility</span>
                <div className="flex items-center justify-between lg:justify-end gap-3 mt-1">
                  <Brain className="w-5 h-5 text-blue-500 animate-pulse" />
                  <span className={`text-2xl font-extrabold ${getScoreColor(cand.match_score)}`}>{cand.match_score}%</span>
                </div>
              </div>

              <div className="flex gap-2 w-full lg:w-auto mt-4">
                <a 
                  href={`mailto:${cand.email}`}
                  className="skeuo-btn skeuo-btn-secondary text-xs py-1.5 flex-1 lg:flex-none text-center"
                >
                  <span>Contact</span>
                </a>
                <a 
                  href={`/portfolio/${cand.name.toLowerCase().replace(/\s+/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="skeuo-btn skeuo-btn-primary text-xs py-1.5 flex-1 lg:flex-none text-center"
                >
                  <span>View Portfolio</span>
                </a>
              </div>
            </div>

          </div>
        ))}

        {candidates.length === 0 && (
          <div className="skeuo-card p-6 text-center text-slate-400">
            <p>Enter search criteria to scan active applicants.</p>
          </div>
        )}
      </div>
    </div>
  );
}
