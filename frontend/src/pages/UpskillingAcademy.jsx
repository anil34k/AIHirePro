import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { GraduationCap, Award, PlayCircle, Star, Compass, CheckCircle2, ChevronRight } from 'lucide-react';

export default function UpskillingAcademy() {
  const { startLoading, stopLoading, showToast } = useAuth();
  const [missingSkills, setMissingSkills] = useState([]);
  const [roadmapSteps, setRoadmapSteps] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchAcademyDetails();
  }, []);

  const fetchAcademyDetails = async () => {
    startLoading("Analyzing Gaps", "Checking profile differences and generating custom roadmaps...");
    try {
      const res = await api.get('academy/recommendations/');
      setMissingSkills(res.missing_skills || []);
      setRoadmapSteps(res.roadmap_steps || []);
      setCourses(res.recommendations || []);
      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Sync Failed", e.message, "error");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Upskilling Academy</h1>
        <p className="text-sm text-slate-500 mt-1">Acquire missing skills identified in your job applications with automated roadmaps and structured courses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Missing skills and course recommendations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="skeuo-card p-6 space-y-4">
            <h3 className="text-lg font-extrabold flex items-center gap-2 text-blue-600">
              <Award className="w-5 h-5 text-blue-600" />
              <span>Target Skills to Learn</span>
            </h3>
            <p className="text-xs text-slate-500">Skills identified as gaps based on recent position applications.</p>
            
            <div className="flex flex-wrap gap-2.5">
              {missingSkills.map((skill, idx) => (
                <span key={idx} className="px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-sm">
                  {skill}
                </span>
              ))}
              {missingSkills.length === 0 && (
                <span className="text-xs text-slate-400 font-semibold">No active skill gaps identified. Keep it up!</span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-extrabold flex items-center gap-2 text-indigo-600 pl-1">
              <PlayCircle className="w-5 h-5" />
              <span>Recommended Curations</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="skeuo-card p-5 flex flex-col justify-between gap-4 border border-slate-200/50 dark:border-slate-800/50 hover:border-blue-500/30 transition-all">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full border border-blue-500/10">
                      {course.skill_name}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-snug line-clamp-2">
                      {course.course_title}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{course.platform}</span>
                    </div>
                  </div>

                  <a 
                    href={course.resource_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="skeuo-btn skeuo-btn-secondary text-xs py-2 w-full text-center"
                  >
                    <span>Start Course</span>
                    <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="col-span-2 text-center p-8 text-slate-400 skeuo-card">
                  <p>No active course suggestions available.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Interactive Visual learning roadmap */}
        <div className="space-y-6">
          <div className="skeuo-card p-6 space-y-6 border border-indigo-500/15">
            <h3 className="text-base font-extrabold flex items-center gap-2 text-slate-800 dark:text-white">
              <Compass className="w-5 h-5 text-indigo-600 animate-spin-slow" />
              <span>Interactive Upskill Path</span>
            </h3>
            
            <div className="relative pl-6 border-l-2 border-indigo-600/30 space-y-8 py-2">
              {roadmapSteps.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Glowing Node Dot */}
                  <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-4 border-slate-100 dark:border-slate-900 shadow-[0_0_8px_rgba(99,102,241,0.5)] flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  </span>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest block">Phase {idx + 1}</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed">
                      {step}
                    </p>
                  </div>
                </div>
              ))}
              {roadmapSteps.length === 0 && (
                <p className="text-xs text-slate-400">Add resume experience details to activate your custom roadmap steps.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
