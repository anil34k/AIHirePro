import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { Calendar, UserPlus, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function InterviewScheduler() {
  const { user, startLoading, stopLoading, showToast } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [seekers, setSeekers] = useState([]);
  const [jobs, setJobs] = useState([]);

  // Form state (Recruiter only)
  const [selectedSeekerId, setSelectedSeekerId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchSchedules();
    if (user?.role === 'COMPANY') {
      fetchRecruiterFormData();
    }
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await api.get('scheduler/');
      setSchedules(res);
    } catch (e) {
      showToast("Error", "Could not fetch interview schedules.", "error");
    }
  };

  const fetchRecruiterFormData = async () => {
    try {
      // Fetch seekers
      const seekersRes = await api.get('admin/users/');
      setSeekers(seekersRes.filter(u => u.role === 'SEEKER'));
      
      // Fetch jobs
      const jobsRes = await api.get('jobs/');
      setJobs(jobsRes);
    } catch (e) {
      showToast("Error", "Could not fetch recruiter configuration details.", "error");
    }
  };

  const scheduleInterview = async (e) => {
    e.preventDefault();
    if (!selectedSeekerId || !selectedJobId || !scheduledTime) {
      showToast("Missing fields", "Please fill in all target fields.", "warning");
      return;
    }

    startLoading("Booking Slot", "Registering schedule and notifying candidate...");
    try {
      const res = await api.post('scheduler/', {
        candidate_id: selectedSeekerId,
        job_id: selectedJobId,
        scheduled_time: scheduledTime,
        notes: notes
      });
      showToast("Scheduled", "Candidate has been notified of the interview request.", "success");
      setSchedules(prev => [res, ...prev]);
      setSelectedSeekerId('');
      setSelectedJobId('');
      setScheduledTime('');
      setNotes('');
      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Scheduling Failed", e.message, "error");
    }
  };

  const updateScheduleStatus = async (scheduleId, newStatus) => {
    startLoading("Updating Status", "Saving interview confirmation...");
    try {
      await api.put('scheduler/', {
        schedule_id: scheduleId,
        status: newStatus
      });
      showToast("Status Changed", `Interview request marked as ${newStatus.toLowerCase()}.`, "success");
      fetchSchedules();
      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Update Failed", e.message, "error");
    }
  };

  const getStatusColor = (status) => {
    if (status === 'ACCEPTED') return 'text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded';
    if (status === 'REJECTED') return 'text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded';
    return 'text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Interview Booking Center</h1>
        <p className="text-sm text-slate-500 mt-1">Book slots for virtual technical assessments and confirm scheduled interview times.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recruiter Booking Form */}
        {user?.role === 'COMPANY' && (
          <div className="skeuo-card p-6 space-y-6 border border-blue-500/15 h-fit">
            <h3 className="text-base font-extrabold flex items-center gap-2 text-slate-800 dark:text-white">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span>Schedule Candidate</span>
            </h3>

            <form onSubmit={scheduleInterview} className="space-y-4 text-xs font-semibold">
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase tracking-wider block">Target Candidate</label>
                <select
                  className="skeuo-input bg-transparent w-full text-xs"
                  value={selectedSeekerId}
                  onChange={(e) => setSelectedSeekerId(e.target.value)}
                  required
                >
                  <option value="" className="dark:bg-slate-900">Select Seeker Profile</option>
                  {seekers.map(seeker => (
                    <option key={seeker.id} value={seeker.id} className="dark:bg-slate-900">{seeker.first_name} {seeker.last_name} ({seeker.username})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase tracking-wider block">Target Job opening</label>
                <select
                  className="skeuo-input bg-transparent w-full text-xs"
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  required
                >
                  <option value="" className="dark:bg-slate-900">Select Position</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id} className="dark:bg-slate-900">{job.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase tracking-wider block">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  className="skeuo-input w-full text-xs"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-500 uppercase tracking-wider block">Notes & Topics</label>
                <textarea
                  className="skeuo-input min-h-[80px] w-full text-xs font-medium"
                  placeholder="System architecture, coding puzzle questions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="skeuo-btn skeuo-btn-primary w-full py-2">
                <span>Confirm Booking</span>
              </button>
            </form>
          </div>
        )}

        {/* Schedules list */}
        <div className={user?.role === 'COMPANY' ? 'lg:col-span-2 space-y-4' : 'lg:col-span-3 space-y-4'}>
          <h3 className="text-base font-extrabold flex items-center gap-2 pl-1">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>Active Schedules List</span>
          </h3>

          <div className="space-y-4">
            {schedules.map(sch => (
              <div key={sch.id} className="skeuo-card p-5 space-y-4 border border-slate-200/50 dark:border-slate-800/50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      {sch.job_title}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mt-0.5">
                      {user?.role === 'COMPANY' ? `Candidate: ${sch.candidate_name}` : `Recruiter: ${sch.recruiter_name}`}
                    </h4>
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${getStatusColor(sch.status)}`}>
                    {sch.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] font-semibold text-slate-500 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>{new Date(sch.scheduled_time).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="truncate">{sch.notes || 'No notes added'}</span>
                  </div>
                </div>

                {user?.role === 'SEEKER' && sch.status === 'PENDING' && (
                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      onClick={() => updateScheduleStatus(sch.id, 'REJECTED')}
                      className="skeuo-btn text-xs py-1.5 px-3 bg-red-500/10 text-red-500 border border-red-500/20"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                    <button 
                      onClick={() => updateScheduleStatus(sch.id, 'ACCEPTED')}
                      className="skeuo-btn skeuo-btn-primary text-xs py-1.5 px-3"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Accept Invite</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {schedules.length === 0 && (
              <div className="skeuo-card p-6 text-center text-slate-400">
                <p>No active interview schedules booked.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
