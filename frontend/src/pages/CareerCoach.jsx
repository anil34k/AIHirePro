import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { Bot, User, Send, Sparkles, HelpCircle, Compass } from 'lucide-react';

export default function CareerCoach() {
  const { startLoading, stopLoading, showToast } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Seed initial message if empty
    setMessages([
      {
        role: 'bot',
        text: 'Hello! I am your AI Career Coach counselor. Ask me for resume suggestions, technical interview practice guidelines, cover letter drafts, or tactical strategic career goals.'
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    const targetText = inputText;
    setInputText('');

    startLoading("Consulting Coach", "Analyzing background history and formulating strategic advice...");
    try {
      const res = await api.post('chatbot/chat/', { message: targetText });
      
      const botMsg = { role: 'bot', text: res.response };
      setMessages(prev => [...prev, botMsg]);
      
      // Update history logs if needed
      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Coach Unavailable", e.message, "error");
    }
  };

  const sendSuggestedPrompt = (promptText) => {
    setInputText(promptText);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      
      {/* Page Title */}
      <div className="shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight">AI Career Coach</h1>
        <p className="text-sm text-slate-500 mt-1">Get immediate feedback on upskilling, draft cover letters, and review professional options.</p>
      </div>

      {/* Suggested quick shortcuts */}
      <div className="flex gap-2 flex-wrap shrink-0">
        <button 
          onClick={() => sendSuggestedPrompt("Draft me a cover letter")}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20 text-xs flex items-center gap-1.5 hover:scale-95 active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Draft Cover Letter</span>
        </button>

        <button 
          onClick={() => sendSuggestedPrompt("Give me strategic career advice")}
          className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20 text-xs flex items-center gap-1.5 hover:scale-95 active:scale-95 transition-all"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Upskill Strategic Goals</span>
        </button>

        <button 
          onClick={() => sendSuggestedPrompt("Give me technical interview tips")}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20 text-xs flex items-center gap-1.5 hover:scale-95 active:scale-95 transition-all"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Interview Guidance</span>
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 skeuo-card border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between">
        
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => {
            const isBot = msg.role === 'bot';
            return (
              <div key={i} className={`flex items-start gap-3 max-w-[85%] ${isBot ? '' : 'ml-auto flex-row-reverse'}`}>
                
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${
                  isBot ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {isBot ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble message box */}
                <div className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed border ${
                  isBot 
                    ? 'bg-slate-50 dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 text-slate-800 dark:text-slate-300 shadow-[inset_1px_1px_2px_rgba(255,255,255,1)] dark:shadow-none' 
                    : 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input form */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
          <input
            type="text"
            className="skeuo-input flex-1 text-xs font-semibold py-2.5"
            placeholder="Ask anything about recruiting, resumes, skill gaps..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="skeuo-btn skeuo-btn-primary shrink-0 py-2.5 px-4 text-xs">
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>

      </div>
    </div>
  );
}
