import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { Terminal, Code, Award, CheckCircle, RefreshCw, Cpu, BookOpen, Send } from 'lucide-react';

export default function CodeArena() {
  const { startLoading, stopLoading, showToast } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  
  // Editor state
  const [submittedCode, setSubmittedCode] = useState('');
  const [language, setLanguage] = useState('python');
  
  // Evaluation Output
  const [runResult, setRunResult] = useState(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const res = await api.get('code/run/');
      setChallenges(res);
      if (res.length > 0) {
        setSelectedChallenge(res[0]);
        setSubmittedCode(res[0].initial_code || '');
      }
    } catch (e) {
      showToast("Error", "Could not load coding challenges.", "error");
    }
  };

  const selectChallenge = (chall) => {
    setSelectedChallenge(chall);
    setSubmittedCode(chall.initial_code || '');
    setRunResult(null);
  };

  const executeCode = async (e) => {
    e.preventDefault();
    if (!submittedCode.trim()) {
      showToast("Empty code block", "Please write or paste solution code.", "warning");
      return;
    }

    startLoading("Compiling Code", "Evaluating complexity bounds and executing simulated assertions...");
    try {
      const res = await api.post('code/run/', {
        challenge_id: selectedChallenge.id,
        code: submittedCode,
        language: language
      });
      setRunResult(res);
      showToast("Code Processed", "Simulation tests completed.", "success");
      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Compilation Error", e.message, "error");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">AI Coding Arena</h1>
        <p className="text-sm text-slate-500 mt-1">Practice algorithm coding challenges in a secure local workspace with real-time complexity analyses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Challenges selection column */}
        <div className="space-y-4 lg:col-span-1">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 pl-1">Algorithm Challenges</h3>
          <div className="space-y-3">
            {challenges.map(ch => (
              <div 
                key={ch.id}
                onClick={() => selectChallenge(ch)}
                className={`skeuo-card p-4 cursor-pointer hover:scale-98 transition-all ${selectedChallenge?.id === ch.id ? 'border-2 border-blue-500 bg-blue-500/5' : 'border-slate-200/50 dark:border-slate-800/50'}`}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Terminal className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="truncate text-slate-800 dark:text-white">{ch.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle and Right Coding Workspace */}
        <div className="lg:col-span-3 space-y-6">
          {selectedChallenge && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Problem Description */}
              <div className="skeuo-card p-6 space-y-4 border border-slate-200/60 dark:border-slate-800/60">
                <h3 className="text-base font-extrabold flex items-center gap-2 text-indigo-600">
                  <BookOpen className="w-5 h-5" />
                  <span>Problem Statement</span>
                </h3>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white">{selectedChallenge.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                  {selectedChallenge.description}
                </p>

                {selectedChallenge.test_cases && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Assert Example</span>
                    <pre className="text-[10px] font-medium p-3 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 overflow-x-auto">
                      {JSON.stringify(selectedChallenge.test_cases, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Sandbox Editor */}
              <div className="skeuo-card p-6 space-y-4 border border-blue-500/10">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-extrabold text-blue-600">Workspace Editor</h3>
                  <select 
                    className="skeuo-input py-1 px-2 text-[10px] bg-transparent font-bold"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="python" className="dark:bg-slate-900">Python 3</option>
                    <option value="javascript" className="dark:bg-slate-900">JavaScript</option>
                  </select>
                </div>

                <form onSubmit={executeCode} className="space-y-4">
                  <textarea
                    className="w-full min-h-[220px] p-4 rounded-xl font-mono text-xs bg-slate-900 text-slate-100 border border-slate-800 focus:outline-none focus:border-blue-500 shadow-inner"
                    style={{ whiteSpace: 'pre', overflowWrap: 'normal' }}
                    value={submittedCode}
                    onChange={(e) => setSubmittedCode(e.target.value)}
                    required
                  />

                  <button type="submit" className="skeuo-btn skeuo-btn-primary w-full py-2.5">
                    <Send className="w-4 h-4" />
                    <span>Run & Evaluate Solutions</span>
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* Execution outputs report */}
          {runResult && (
            <div className="skeuo-card p-6 space-y-6 border-l-4 border-emerald-500">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-extrabold flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Compilation Verification Report</span>
                </h3>
                <span className="text-xs font-extrabold px-3 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-emerald-500">
                  Score: {runResult.submission?.score}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
                
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Execution Output</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-mono bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-200/40 mt-1">
                      {runResult.run_result}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-blue-500" />
                      <span>Complexity Analysis</span>
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                      {runResult.submission?.evaluation?.complexity_analysis}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Correctness Evaluation</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                      {runResult.submission?.evaluation?.correctness_feedback}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Suggested Improvements</span>
                    <ul className="list-disc pl-4 space-y-1 mt-1 font-medium text-slate-600 dark:text-slate-400">
                      {runResult.submission?.evaluation?.suggested_improvements?.map((imp, idx) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
