import React, { useState } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { Award, BrainCircuit, FileCheck, CheckCircle2, ChevronRight } from 'lucide-react';

export default function ResumeOptimizer() {
  const { startLoading, stopLoading, showToast } = useAuth();
  const [jobDescription, setJobDescription] = useState('');
  const [report, setReport] = useState(null);

  const optimizeResume = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      showToast("Missing input", "Please input target Job Description text.", "warning");
      return;
    }

    startLoading("Optimizing ATS", "Cross-referencing resume text and injecting key terms...");
    try {
      const res = await api.post('resume-optimizer/', { job_description: jobDescription });
      setReport(res);
      stopLoading();
      showToast("Optimization Complete", "ATS reports updated successfully.", "success");
    } catch (e) {
      stopLoading();
      showToast("Optimizer Error", e.message, "error");
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">ATS Resume Optimizer</h1>
        <p className="text-sm text-slate-500 mt-1">Cross-reference target job descriptions to identify missing keywords and boost ATS parsing scores.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Input Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="skeuo-card p-6 space-y-4 border border-blue-500/15">
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <span>Paste Job Opening Details</span>
            </h3>

            <form onSubmit={optimizeResume} className="space-y-4">
              <div className="flex flex-col gap-1">
                <textarea
                  className="skeuo-input min-h-[220px] text-xs font-semibold leading-relaxed"
                  placeholder="Paste the target job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="skeuo-btn skeuo-btn-primary w-full py-2.5">
                <span>Check ATS Compatibility</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Report Outputs */}
        <div className="space-y-6">
          {report ? (
            <div className="skeuo-card p-6 space-y-6 border border-indigo-500/20">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-indigo-600">ATS Scorer</h3>
                <span className="text-[10px] uppercase font-bold text-blue-500">Groq Evaluator</span>
              </div>

              {/* Gauge Score */}
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="score-gauge shadow-indigo-500/10 scale-105">
                  <span className="score-gauge-value">{report.ats_score}%</span>
                </div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">ATS Score</span>
              </div>

              {/* Missing keywords */}
              <div>
                <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider mb-2">Missing Key Terms</span>
                <div className="flex flex-wrap gap-1">
                  {(report.missing_keywords || []).map((word, i) => (
                    <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-extrabold border border-amber-500/15">
                      {word}
                    </span>
                  ))}
                  {(report.missing_keywords || []).length === 0 && (
                    <span className="text-xs text-slate-400">Excellent keywords coverage!</span>
                  )}
                </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Strategic Recommendations</span>
                <div className="space-y-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {(report.recommendations || []).map((rec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="skeuo-card p-6 text-center text-slate-400 h-full flex flex-col justify-center gap-3 border border-dashed border-slate-200 dark:border-slate-800">
              <BrainCircuit className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-wider">Awaiting Evaluation</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
