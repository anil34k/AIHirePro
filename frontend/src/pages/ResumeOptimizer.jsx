import React, { useState } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { Award, BrainCircuit, FileCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import { marked } from 'marked';

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

  const downloadMarkdownResume = () => {
    if (!report || !report.optimized_resume) return;
    const blob = new Blob([report.optimized_resume], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'optimized_resume.md';
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded", "Optimized resume markdown downloaded successfully.", "success");
  };

  const printResume = () => {
    if (!report || !report.optimized_resume) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Optimized Resume</title>
          <style>
            body {
              font-family: "Times New Roman", Times, Baskerville, Georgia, serif;
              line-height: 1.4;
              color: #000;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              background-color: #fff;
            }
            h1 {
              text-align: center;
              font-size: 22px;
              font-weight: bold;
              margin-top: 0;
              margin-bottom: 5px;
              text-transform: uppercase;
              color: #000;
              border-bottom: none;
              padding-bottom: 0;
            }
            /* Center contact info paragraphs immediately following h1 */
            h1 ~ p {
              text-align: center;
              margin: 3px 0;
              font-size: 13px;
              color: #333;
            }
            /* Reset body paragraphs to be left aligned */
            h2 ~ p, 
            h2 ~ ul p {
              text-align: left;
            }
            h2 {
              font-size: 15px;
              font-weight: bold;
              color: #000;
              border-bottom: 2px solid #0056b3; /* Blue underline */
              margin-top: 18px;
              margin-bottom: 8px;
              padding-bottom: 2px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              text-align: left;
            }
            h3 {
              font-size: 13px;
              font-weight: bold;
              margin-top: 10px;
              margin-bottom: 4px;
              color: #000;
              text-align: left;
            }
            ul {
              margin-top: 4px;
              margin-bottom: 6px;
              padding-left: 20px;
              list-style-type: disc;
            }
            li {
              margin-bottom: 3px;
              font-size: 13px;
              line-height: 1.4;
              color: #111;
              text-align: left;
            }
            a {
              color: #0056b3;
              text-decoration: underline;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              @page {
                margin: 15mm;
              }
            }
          </style>
        </head>
        <body>
          <div id="content" class="resume-paper"></div>
          <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
          <script>
            document.getElementById('content').innerHTML = marked.parse(\`${report.optimized_resume.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <style>{`
        .resume-paper {
          font-family: "Times New Roman", Times, Baskerville, Georgia, serif !important;
          color: #000000 !important;
          line-height: 1.4 !important;
          background-color: #ffffff !important;
        }
        .resume-paper h1 {
          text-align: center !important;
          font-size: 22px !important;
          font-weight: bold !important;
          margin-top: 0 !important;
          margin-bottom: 5px !important;
          text-transform: uppercase !important;
          color: #000000 !important;
          border-bottom: none !important;
          padding-bottom: 0 !important;
        }
        .resume-paper h1 ~ p {
          text-align: center !important;
          margin: 3px 0 !important;
          font-size: 13px !important;
          color: #333333 !important;
        }
        .resume-paper h2 ~ p, 
        .resume-paper h2 ~ ul p {
          text-align: left !important;
        }
        .resume-paper h2 {
          font-size: 15px !important;
          font-weight: bold !important;
          color: #000000 !important;
          border-bottom: 2px solid #0056b3 !important;
          margin-top: 18px !important;
          margin-bottom: 8px !important;
          padding-bottom: 2px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          text-align: left !important;
        }
        .resume-paper h3 {
          font-size: 13px !important;
          font-weight: bold !important;
          margin-top: 10px !important;
          margin-bottom: 4px !important;
          color: #000000 !important;
          text-align: left !important;
        }
        .resume-paper ul {
          margin-top: 4px !important;
          margin-bottom: 6px !important;
          padding-left: 20px !important;
          list-style-type: disc !important;
        }
        .resume-paper li {
          margin-bottom: 3px !important;
          font-size: 13px !important;
          line-height: 1.4 !important;
          color: #111111 !important;
          text-align: left !important;
        }
        .resume-paper a {
          color: #0056b3 !important;
          text-decoration: underline !important;
        }
      `}</style>
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

      {report && report.optimized_resume && (
        <div className="skeuo-card p-6 space-y-4 border border-emerald-500/15">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-emerald-600 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" />
                <span>AI Generated Optimized Resume</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase">Ready-to-use resume optimized with target ATS key terms</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={downloadMarkdownResume}
                className="flex-1 sm:flex-none skeuo-btn skeuo-btn-secondary py-2 text-xs px-4"
              >
                Download Markdown (.md)
              </button>
              <button 
                onClick={printResume}
                className="flex-1 sm:flex-none skeuo-btn skeuo-btn-primary py-2 text-xs px-4"
              >
                Print / Save as PDF
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white text-black p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner max-h-[600px] overflow-y-auto resume-paper">
              <div 
                dangerouslySetInnerHTML={{ __html: marked.parse(report.optimized_resume) }}
              />
            </div>
            
            <details className="text-xs">
              <summary className="cursor-pointer text-slate-500 font-bold hover:text-slate-700 select-none uppercase tracking-wider">Show Raw Markdown Source</summary>
              <pre className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono whitespace-pre-wrap mt-2 text-slate-700 dark:text-slate-300 max-h-[250px] overflow-y-auto">
                {report.optimized_resume}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
