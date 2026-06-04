import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { Activity, ShieldAlert, Cpu, Timer, ShieldCheck } from 'lucide-react';

export default function AITelemetry() {
  const { startLoading, stopLoading, showToast } = useAuth();
  const [telemetry, setTelemetry] = useState(null);

  useEffect(() => {
    fetchTelemetryData();
  }, []);

  const fetchTelemetryData = async () => {
    startLoading("Syncing Telemetry", "Pulling server API stats and tokens...");
    try {
      const res = await api.get('admin/telemetry/');
      setTelemetry(res);
      stopLoading();
    } catch (e) {
      stopLoading();
      showToast("Access Denied", e.message, "error");
    }
  };

  if (!telemetry) {
    return (
      <div className="text-center p-8 text-slate-400">
        <p>Loading AI telemetry charts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Service Telemetry</h1>
        <p className="text-sm text-slate-500 mt-1">Review Groq model completions, latency profiles, token throughput, and service errors.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="skeuo-card p-6 flex items-center justify-between border-l-4 border-blue-600">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total LLM Requests</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{telemetry.total_calls}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="skeuo-card p-6 flex items-center justify-between border-l-4 border-indigo-600">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tokens Transferred</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{(telemetry.prompt_tokens + telemetry.completion_tokens).toLocaleString()}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="skeuo-card p-6 flex items-center justify-between border-l-4 border-emerald-600">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Avg API Latency</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{telemetry.avg_latency}ms</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-600">
            <Timer className="w-6 h-6" />
          </div>
        </div>

        <div className="skeuo-card p-6 flex items-center justify-between border-l-4 border-rose-600">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Request Failures</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{telemetry.errors}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-600/10 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Logs Table */}
      <div className="skeuo-card p-6 space-y-4">
        <h3 className="text-base font-extrabold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Real-time API Access Log</span>
        </h3>

        <div className="skeuo-table-container">
          <table className="skeuo-table w-full text-left text-xs font-semibold">
            <thead>
              <tr>
                <th>Service Endpoint</th>
                <th>Prompt Tokens</th>
                <th>Completion Tokens</th>
                <th>Execution Latency</th>
                <th>Status</th>
                <th>Request Date</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.logs?.map((log, idx) => (
                <tr key={idx}>
                  <td className="font-extrabold text-slate-700 dark:text-slate-300">{log.endpoint}</td>
                  <td>{log.prompt_tokens}</td>
                  <td>{log.completion_tokens}</td>
                  <td className="font-bold text-slate-800 dark:text-white">{log.latency_ms}ms</td>
                  <td>
                    {log.error ? (
                      <span className="text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded font-extrabold border border-rose-500/20 truncate max-w-[120px] inline-block" title={log.error}>
                        {log.error}
                      </span>
                    ) : (
                      <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-extrabold border border-emerald-500/20">
                        200 OK
                      </span>
                    )}
                  </td>
                  <td className="text-slate-400">{log.timestamp}</td>
                </tr>
              ))}
              {(!telemetry.logs || telemetry.logs.length === 0) && (
                <tr>
                  <td colSpan="6" className="text-center text-slate-400 py-6">No request logs recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
