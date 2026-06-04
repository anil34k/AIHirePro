import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { Mic, MicOff, Play, Send, Award, ArrowRight, RefreshCw, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

export default function MockInterview() {
  const { startLoading, stopLoading, showToast } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [session, setSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [results, setResults] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState('');

  // Speech Recognition setup (Browser native)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setSpokenText(prev => prev + ' ' + transcript);
      setAnswerText(prev => prev + ' ' + transcript);
    };
    recognition.onerror = (event) => {
      console.error(event.error);
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('jobs/');
      setJobs(res);
    } catch (e) {
      showToast("Error", "Could not fetch active jobs.", "error");
    }
  };

  const startInterview = async () => {
    startLoading("Initializing Arena", "Groq AI generating personalized technical queries...");
    try {
      const res = await api.post('interviews/start/', { job_id: selectedJobId || null });
      setSession(res);
      setCurrentQuestionIndex(0);
      setAnswerText('');
      setSpokenText('');
      setResults(null);
      stopLoading();
      showToast("Session Active", "Personalized interview initialized.", "success");
    } catch (e) {
      stopLoading();
      showToast("Startup Failed", e.message, "error");
    }
  };

  const toggleVoiceRecording = () => {
    if (!recognition) {
      showToast("Speech Recognition unsupported", "Please use modern Chrome or Edge.", "warning");
      // Simulate speech recognition fallback
      setSpokenText("Simulated voice content: Experiencing django web applications, SQLite databases, and structured rest api development.");
      setAnswerText(prev => prev + " Simulated voice content: Experiencing django web applications, SQLite databases, and structured rest api development.");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setSpokenText('');
      recognition.start();
      setIsRecording(true);
      showToast("Microphone Active", "Speak clearly into your device.", "success");
    }
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) {
      showToast("Empty response", "Please provide a text or voice response first.", "warning");
      return;
    }

    const currentQuestion = session.questions[currentQuestionIndex];
    startLoading("Evaluating Response", "Analyzing correctness, syntax, and conceptual depth...");
    try {
      if (spokenText) {
        // Voice upload flow
        const formData = new FormData();
        const dummyAudio = new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/wav' });
        formData.append('file', dummyAudio, 'voice.wav');
        formData.append('question_id', currentQuestion.id);
        
        await api.post('voice/upload/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      await api.post('interviews/answer/', {
        question_id: currentQuestion.id,
        answer_text: answerText,
        spoken_text: spokenText
      });

      showToast("Answer Evaluated", "Response saved successfully.", "success");

      // Next question or result
      if (currentQuestionIndex + 1 < session.questions.length) {
        setCurrentQuestionIndex(prev => prev + 1);
        setAnswerText('');
        setSpokenText('');
      } else {
        fetchResults();
      }
      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Evaluation Failed", e.message, "error");
    }
  };

  const fetchResults = async () => {
    startLoading("Compiling Report", "Recalculating score metrics and feedback logs...");
    try {
      const res = await api.get('interviews/result/', { params: { session_id: session.id } });
      setResults(res);
      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Compilation Failed", e.message, "error");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Mock Interview Arena</h1>
        <p className="text-sm text-slate-500 mt-1">Practice role-based technical challenges with real-time semantic scoring and verbal evaluations.</p>
      </div>

      {!session && !results && (
        <div className="skeuo-card p-8 text-center space-y-6">
          <Award className="w-16 h-16 mx-auto text-blue-600 animate-bounce" />
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold">Select target role to practice</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Choose from your applied jobs or practice general full stack engineering core concepts.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <select
              className="skeuo-input bg-transparent text-sm w-full"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
            >
              <option value="" className="dark:bg-slate-900">General Practice Mode</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id} className="dark:bg-slate-900">{job.title} ({job.company_name})</option>
              ))}
            </select>

            <button onClick={startInterview} className="skeuo-btn skeuo-btn-primary w-full sm:w-auto shrink-0">
              <span>Start Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {session && !results && (
        <div className="skeuo-card p-6 space-y-6 border border-blue-500/10">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Active Session</span>
              <h3 className="font-extrabold text-base">{session.job_title || 'General Practice'}</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">
              Question {currentQuestionIndex + 1} of {session.questions?.length}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Query</span>
            <p className="font-bold text-slate-800 dark:text-white mt-1 text-lg">
              {session.questions[currentQuestionIndex]?.question_text}
            </p>
          </div>

          {session.questions[currentQuestionIndex]?.suggested_keywords && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-slate-400">Hint keywords:</span>
              {session.questions[currentQuestionIndex].suggested_keywords.map((kw, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-semibold border border-indigo-500/20">{kw}</span>
              ))}
            </div>
          )}

          <form onSubmit={submitAnswer} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Response</label>
              <textarea
                className="skeuo-input min-h-[140px] text-sm font-medium"
                placeholder="Type your structured answer here, or click the microphone to transcribe verbal response..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`skeuo-btn text-xs ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'skeuo-btn-secondary'}`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-red-500" />}
                <span>{isRecording ? 'Stop Recording' : 'Voice Transcribe'}</span>
              </button>

              <button type="submit" className="skeuo-btn skeuo-btn-primary">
                <span>Submit Answer</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="skeuo-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-blue-600">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Evaluation Report</span>
              <h2 className="text-2xl font-extrabold">{results.job_title} Practice Complete</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Review detailed semantic evaluation scores per question response.</p>
            </div>

            <div className="score-gauge shrink-0 scale-110 shadow-blue-500/10">
              <span className="score-gauge-value">{results.avg_score}%</span>
            </div>
          </div>

          <div className="space-y-4">
            {results.results.map((res, i) => (
              <div key={i} className="skeuo-card p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400">QUESTION {res.order}</span>
                    <h4 className="font-bold text-slate-800 dark:text-white leading-relaxed">{res.question_text}</h4>
                  </div>
                  <span className={`font-extrabold text-sm shrink-0 px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 ${res.score >= 80 ? 'text-green-500' : (res.score >= 60 ? 'text-amber-500' : 'text-red-500')}`}>
                    Score: {res.score || 0}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="space-y-2">
                    <span className="font-bold text-slate-400 block uppercase tracking-wider">Your Answer</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-200/20">{res.answer_text || "Unanswered"}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="font-bold text-slate-400 block uppercase tracking-wider">AI Feedback</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-200/20">{res.feedback}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button onClick={() => { setSession(null); setResults(null); }} className="skeuo-btn skeuo-btn-primary">
              <RefreshCw className="w-4 h-4" />
              <span>Start New Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
