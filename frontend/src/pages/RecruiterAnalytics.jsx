import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { BarChart3, TrendingUp, Users, Award, ShieldCheck, Briefcase } from 'lucide-react';

export default function RecruiterAnalytics() {
  const { startLoading, stopLoading, showToast } = useAuth();
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchCorporateAnalytics();
  }, []);

  const fetchCorporateAnalytics = async () => {
    startLoading("Compiling Analytics", "Parsing corporate hire details and matching statistics...");
    try {
      const res = await api.get('analytics/dashboard/');
      setMetrics(res);
      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Sync Failed", e.message, "error");
    }
  };

  if (!metrics) {
    return (
      <div className="text-center p-8 text-slate-400">
        <p>Analyzing recruitment funnel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Corporate Recruiting Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Review hiring funnels, applicant distribution metrics, and target skills demanded across active jobs.</p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="skeuo-card p-6 flex items-center justify-between border-l-4 border-blue-600">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Jobs</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{metrics.total_jobs}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="skeuo-card p-6 flex items-center justify-between border-l-4 border-indigo-600">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Applicants</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{metrics.total_applicants}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="skeuo-card p-6 flex items-center justify-between border-l-4 border-emerald-600">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Average AI Match</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{metrics.avg_match_score}%</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="skeuo-card p-6 flex items-center justify-between border-l-4 border-amber-600">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Overall Hire Rate</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{metrics.hire_rate}%</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-600/10 flex items-center justify-center text-amber-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Applicant Status Funnel */}
        <div className="skeuo-card p-6 space-y-6">
          <h3 className="text-base font-extrabold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Recruiting Pipeline Funnel</span>
          </h3>

          <div className="space-y-4">
            {Object.entries(metrics.funnel || {}).map(([status, count]) => {
              const maxVal = Math.max(...Object.values(metrics.funnel || {})) || 1;
              const percentWidth = Math.min(100, Math.max(5, (count / maxVal) * 100));
              
              let barColor = 'bg-blue-600';
              if (status === 'HIRED') barColor = 'bg-emerald-600';
              if (status === 'SHORTLISTED') barColor = 'bg-indigo-600';
              if (status === 'REJECTED') barColor = 'bg-red-500';

              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-500">
                    <span>{status}</span>
                    <span>{count} candidates</span>
                  </div>
                  <div className="h-4 w-full rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 overflow-hidden relative shadow-[inset_1px_1px_3px_rgba(0,0,0,0.06)]">
                    <div 
                      className={`h-full ${barColor} rounded-md transition-all duration-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]`}
                      style={{ width: `${percentWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Demanded Skills */}
        <div className="skeuo-card p-6 space-y-6">
          <h3 className="text-base font-extrabold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Top Skills in Demand</span>
          </h3>
          <p className="text-xs text-slate-500">Skills required most frequently across your active job postings.</p>

          <div className="space-y-4">
            {(metrics.top_skills || []).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.skill}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                    {item.count} postings
                  </span>
                </div>
              </div>
            ))}
            {(metrics.top_skills || []).length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No skill requirements specified in active job postings.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
