import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { Terminal, Code, Award, CheckCircle, RefreshCw, Cpu, BookOpen, Send, Filter, ChevronDown } from 'lucide-react';

export default function CodeArena() {
  const { startLoading, stopLoading, showToast } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [submittedCode, setSubmittedCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [runResult, setRunResult] = useState(null);
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterActive, setFilterActive] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const res = await api.get('code/run/');
      setChallenges(res);
      if (res.length > 0) {
        selectChallenge(res[0]);
      }
    } catch (e) {
      showToast("Error", "Could not load coding challenges.", "error");
    }
  };

  const selectChallenge = (chall) => {
    setSelectedChallenge(chall);
    const langCodeMap = {
      python: chall.starter_code_python,
      javascript: chall.starter_code_javascript,
      java: chall.starter_code_java,
      cpp: chall.starter_code_cpp,
      csharp: chall.starter_code_csharp,
    };
    setSubmittedCode(langCodeMap[language] || langCodeMap.python || '');
    setRunResult(null);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (selectedChallenge) {
      const langCodeMap = {
        python: selectedChallenge.starter_code_python,
        javascript: selectedChallenge.starter_code_javascript,
        java: selectedChallenge.starter_code_java,
        cpp: selectedChallenge.starter_code_cpp,
        csharp: selectedChallenge.starter_code_csharp,
      };
      setSubmittedCode(langCodeMap[lang] || '');
    }
  };

  const executeCode = async (e) => {
    e.preventDefault();
    if (!submittedCode.trim()) {
      showToast("Empty code block", "Please write or paste solution code.", "warning");
      return;
    }
    startLoading("Evaluating Code", "Running test cases and computing complexity...");
    try {
      const res = await api.post('code/run/', {
        challenge_id: selectedChallenge.id,
        code: submittedCode,
        language: language
      });
      setRunResult(res);
      showToast("Code Evaluated", `Score: ${res.submission?.score}%`, "success");
      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Error", e.message, "error");
    }
  };

  const filteredChallenges = challenges.filter(ch => {
    if (filterDifficulty !== 'ALL' && ch.difficulty !== filterDifficulty) return false;
    if (filterCategory !== 'ALL' && ch.category !== filterCategory) return false;
    return true;
  });

  const difficultyColor = (d) => {
    switch(d) {
      case 'EASY': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
      case 'MEDIUM': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
      case 'HARD': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-900/20';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">AI Coding Arena</h1>
          <p className="text-sm text-slate-500 mt-1">Practice algorithm challenges with multi-language support</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left panel - challenge list */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
              Challenges ({filteredChallenges.length})
            </h3>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <select
              value={filterDifficulty}
              onChange={e => setFilterDifficulty(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="ARRAYS">Arrays</option>
              <option value="STRINGS">Strings</option>
              <option value="TREES">Trees</option>
              <option value="GRAPHS">Graphs</option>
              <option value="DYNAMIC_PROGRAMMING">DP</option>
              <option value="SORTING">Sorting</option>
              <option value="SEARCHING">Searching</option>
              <option value="SQL">SQL</option>
              <option value="PYTHON">Python</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {filteredChallenges.map(ch => (
              <div 
                key={ch.id}
                onClick={() => selectChallenge(ch)}
                className={`skeuo-card p-3 cursor-pointer hover:scale-98 transition-all ${
                  selectedChallenge?.id === ch.id 
                    ? 'border-2 border-blue-500 bg-blue-500/5' 
                    : 'border-slate-200/50 dark:border-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold mb-1">
                  <Terminal className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate text-slate-800 dark:text-white text-[13px]">{ch.title}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${difficultyColor(ch.difficulty)}`}>
                    {ch.difficulty}
                  </span>
                  {ch.submission_count > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {ch.submission_count} tries
                    </span>
                  )}
                </div>
              </div>
            ))}
            {filteredChallenges.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">No challenges match filters</p>
            )}
          </div>
        </div>

        {/* Right panel - coding workspace */}
        <div className="lg:col-span-3 space-y-6">
          {selectedChallenge && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Problem description */}
              <div className="skeuo-card p-6 space-y-4 border border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold flex items-center gap-2 text-indigo-600">
                    <BookOpen className="w-5 h-5" />
                    <span>Problem</span>
                  </h3>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${difficultyColor(selectedChallenge.difficulty)}`}>
                    {selectedChallenge.get_difficulty_display || selectedChallenge.difficulty}
                  </span>
                </div>

                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white">
                  {selectedChallenge.title}
                </h4>

                <div className="flex gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                    {selectedChallenge.get_category_display || selectedChallenge.category}
                  </span>
                  {selectedChallenge.function_signature && (
                    <code className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                      {selectedChallenge.function_signature}
                    </code>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold whitespace-pre-wrap">
                  {selectedChallenge.description}
                </p>

                {/* Sample test case */}
                {(selectedChallenge.visible_test_cases?.length > 0) && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sample Test Cases</span>
                    {selectedChallenge.visible_test_cases.slice(0, 2).map((tc, idx) => (
                      <div key={idx} className="text-[11px] p-3 rounded-lg bg-slate-900 text-slate-200 border border-slate-800 font-mono space-y-1">
                        <div><span className="text-blue-400">Input:</span> {tc.input}</div>
                        <div><span className="text-green-400">Output:</span> {tc.output}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Code editor */}
              <div className="skeuo-card p-6 space-y-4 border border-blue-500/10">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-extrabold text-blue-600">Editor</h3>
                  <select 
                    className="skeuo-input py-1 px-2 text-[10px] bg-transparent font-bold"
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                  >
                    <option value="python" className="dark:bg-slate-900">Python 3</option>
                    <option value="javascript" className="dark:bg-slate-900">JavaScript</option>
                    <option value="java" className="dark:bg-slate-900">Java</option>
                    <option value="cpp" className="dark:bg-slate-900">C++</option>
                    <option value="csharp" className="dark:bg-slate-900">C#</option>
                  </select>
                </div>

                <form onSubmit={executeCode} className="space-y-4">
                  <textarea
                    className="w-full min-h-[240px] p-4 rounded-xl font-mono text-xs bg-slate-900 text-slate-100 border border-slate-800 focus:outline-none focus:border-blue-500 shadow-inner"
                    style={{ whiteSpace: 'pre', overflowWrap: 'normal', tabSize: 4 }}
                    value={submittedCode}
                    onChange={(e) => setSubmittedCode(e.target.value)}
                    spellCheck={false}
                    required
                  />
                  <button type="submit" className="skeuo-btn skeuo-btn-primary w-full py-2.5">
                    <Send className="w-4 h-4" />
                    <span>Run & Evaluate</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Execution results */}
          {runResult && (
            <div className="skeuo-card p-6 space-y-6 border-l-4 border-emerald-500">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-extrabold flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Results</span>
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold px-3 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 text-emerald-500">
                    Score: {runResult.submission?.score}%
                  </span>
                  <span className="text-xs text-slate-400">
                    {runResult.submission?.passed_visible}/{runResult.submission?.total_visible} visible passed
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execution Output</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-mono bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-200/40 mt-1">
                      {runResult.run_result}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-blue-500" />
                      <span>Complexity</span>
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                      {runResult.submission?.evaluation?.complexity_analysis}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feedback</span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                      {runResult.submission?.evaluation?.correctness_feedback}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Improvements</span>
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
