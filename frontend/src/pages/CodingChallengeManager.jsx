import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import api from '../api';
import { 
  Code, Plus, Terminal, Download, Search, 
  X, Globe, CheckCircle, XCircle, Trash2, 
  Edit, RefreshCw, Upload, FileJson
} from 'lucide-react';

export default function CodingChallengeManager() {
  const { startLoading, stopLoading, showToast } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Import modal
  const [showImport, setShowImport] = useState(false);
  const [importTab, setImportTab] = useState('leetcode'); // leetcode | manual | json
  const [importing, setImporting] = useState(false);

  // LeetCode tab
  const [importUrl, setImportUrl] = useState('');
  const [importUrls, setImportUrls] = useState('');
  const [importMultiple, setImportMultiple] = useState(false);

  // Manual tab
  const [manual, setManual] = useState({
    title: '', description: '', difficulty: 'MEDIUM', category: 'OTHER',
    function_signature: '', source_url: '',
    starter_code_python: '# Write your solution here\n',
    sample_input: '', sample_output: '',
    visible_test_cases: '[]',
  });

  // JSON tab
  const [jsonFile, setJsonFile] = useState(null);
  const [jsonPreview, setJsonPreview] = useState(null);

  useEffect(() => {
    loadChallenges();
  }, []);

  useEffect(() => {
    let result = [...challenges];
    if (search) result = result.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
    if (filterDifficulty) result = result.filter(c => c.difficulty === filterDifficulty);
    if (filterCategory) result = result.filter(c => c.category === filterCategory);
    if (filterStatus === 'active') result = result.filter(c => c.is_active);
    else if (filterStatus === 'inactive') result = result.filter(c => !c.is_active);
    setFiltered(result);
  }, [challenges, search, filterDifficulty, filterCategory, filterStatus]);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const res = await api.get('admin/challenges/');
      setChallenges(Array.isArray(res) ? res : []);
    } catch (e) {
      showToast('Error', 'Failed to load challenges', 'error');
    }
    setLoading(false);
  };

  const stats = {
    total: challenges.length,
    active: challenges.filter(c => c.is_active).length,
    easy: challenges.filter(c => c.difficulty === 'EASY').length,
    medium: challenges.filter(c => c.difficulty === 'MEDIUM').length,
    hard: challenges.filter(c => c.difficulty === 'HARD').length,
  };

  const toggleChallenge = async (id) => {
    try {
      await api.post('admin/challenges/', { challenge_id: id, action: 'toggle' });
      showToast('Success', 'Challenge status toggled', 'success');
      loadChallenges();
    } catch (e) { showToast('Error', e.message, 'error'); }
  };

  const deleteChallenge = async (id) => {
    if (!confirm('Delete this challenge? This cannot be undone.')) return;
    try {
      await api.delete('admin/challenges/', { challenge_id: id });
      showToast('Deleted', 'Challenge removed', 'success');
      loadChallenges();
    } catch (e) { showToast('Error', e.message, 'error'); }
  };

  const resetModal = () => {
    setImportUrl('');
    setImportUrls('');
    setImportMultiple(false);
    setManual({
      title: '', description: '', difficulty: 'MEDIUM', category: 'OTHER',
      function_signature: '', source_url: '',
      starter_code_python: '# Write your solution here\n',
      sample_input: '', sample_output: '', visible_test_cases: '[]',
    });
    setJsonFile(null);
    setJsonPreview(null);
    setImportTab('leetcode');
  };

  // --- LeetCode Import ---
  const handleLeetCodeImport = async () => {
    const urls = importMultiple
      ? importUrls.split('\n').map(u => u.trim()).filter(Boolean)
      : [importUrl.trim()];

    if (urls.length === 0) {
      showToast('Input required', 'Enter at least one LeetCode URL', 'warning');
      return;
    }

    setImporting(true);
    startLoading('Importing from LeetCode...', `Processing ${urls.length} URL(s) via GraphQL`);

    try {
      if (importMultiple) {
        const res = await api.post('admin/challenges/', { urls, action: 'import' });
        if (res.success) {
          const importedCount = res.imported?.length || 0;
          const failedCount = (res.errors?.length || 0) + (res.graphql_failed?.length || 0);
          showToast('Import complete', `${importedCount} imported, ${failedCount} failed`, importedCount > 0 ? 'success' : 'error');
          if (failedCount > 0) {
            showToast('Some URLs failed', 'Use Manual Entry for failed URLs', 'warning');
          }
          loadChallenges();
          setShowImport(false);
        }
      } else {
        const res = await api.post('admin/challenges/', { url: urls[0], action: 'import' });
        if (res.graphql_failed) {
          showToast('Auto import unavailable', res.error || 'GraphQL import failed', 'warning');
          setManual(prev => ({
            ...prev,
            title: res.suggested_title || '',
            source_url: res.source_url || urls[0],
          }));
          setImportTab('manual');
        } else if (res.success) {
          showToast('Imported', `"${res.challenge.title}" imported from LeetCode`, 'success');
          loadChallenges();
          setShowImport(false);
        }
      }
    } catch (e) {
      showToast('Import failed', e.message, 'error');
    }
    stopLoading();
    setImporting(false);
  };

  // --- Manual Create ---
  const handleManualCreate = async () => {
    if (!manual.title.trim()) {
      showToast('Title required', 'Enter a challenge title', 'warning');
      return;
    }
    setImporting(true);
    startLoading('Creating Challenge...', '');
    try {
      let visibleTC = [];
      try { visibleTC = JSON.parse(manual.visible_test_cases || '[]'); } catch {}
      const res = await api.post('admin/challenges/', {
        action: 'manual_create',
        title: manual.title,
        description: manual.description,
        difficulty: manual.difficulty,
        category: manual.category,
        function_signature: manual.function_signature,
        starter_code_python: manual.starter_code_python,
        visible_test_cases: visibleTC,
        sample_input: manual.sample_input,
        sample_output: manual.sample_output,
        source_url: manual.source_url,
      });
      if (res.success) {
        showToast('Created', `"${res.challenge.title}" created`, 'success');
        loadChallenges();
        setShowImport(false);
      }
    } catch (e) {
      showToast('Error', e.message, 'error');
    }
    stopLoading();
    setImporting(false);
  };

  // --- JSON Import ---
  const handleJsonFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setJsonFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setJsonPreview(data);
      } catch {
        setJsonPreview(null);
        showToast('Invalid JSON', 'File is not valid JSON', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleJsonImport = async () => {
    if (!jsonPreview) {
      showToast('No data', 'Upload a valid JSON file first', 'warning');
      return;
    }
    setImporting(true);
    startLoading('Importing from JSON...', '');
    try {
      const res = await api.post('admin/challenges/', {
        action: 'json_import',
        data: jsonPreview,
      });
      if (res.success) {
        showToast('Imported', `"${res.challenge.title}" imported from JSON`, 'success');
        loadChallenges();
        setShowImport(false);
      }
    } catch (e) {
      showToast('Error', e.message, 'error');
    }
    stopLoading();
    setImporting(false);
  };

  const diffBadge = (d) => {
    switch(d) {
      case 'EASY': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'HARD': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Terminal className="w-8 h-8 text-blue-600" />
            Coding Challenge Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage coding challenges, import LeetCode problems, create assessments, and monitor challenge performance.
          </p>
        </div>
        <button onClick={() => { resetModal(); setShowImport(true); }} className="skeuo-btn skeuo-btn-primary">
          <Plus className="w-4 h-4" /><Code className="w-4 h-4" />
          <span>Import LeetCode Problem</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="skeuo-card p-5 flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
          <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{stats.total}</span>
        </div>
        <div className="skeuo-card p-5 flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active</span>
          <span className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.active}</span>
        </div>
        <div className="skeuo-card p-5 flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Easy</span>
          <span className="text-3xl font-extrabold text-emerald-500 mt-1">{stats.easy}</span>
        </div>
        <div className="skeuo-card p-5 flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medium</span>
          <span className="text-3xl font-extrabold text-amber-500 mt-1">{stats.medium}</span>
        </div>
        <div className="skeuo-card p-5 flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hard</span>
          <span className="text-3xl font-extrabold text-rose-500 mt-1">{stats.hard}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="skeuo-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="Search challenge title..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <option value="">All Categories</option>
            <option value="ARRAYS">Arrays</option><option value="STRINGS">Strings</option>
            <option value="LINKED_LISTS">Linked Lists</option><option value="TREES">Trees</option>
            <option value="GRAPHS">Graphs</option><option value="DYNAMIC_PROGRAMMING">DP</option>
            <option value="RECURSION">Recursion</option><option value="SORTING">Sorting</option>
            <option value="SEARCHING">Searching</option><option value="SQL">SQL</option>
            <option value="PYTHON">Python</option><option value="DJANGO">Django</option>
            <option value="OTHER">Other</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
          <button onClick={loadChallenges} className="skeuo-btn skeuo-btn-secondary text-sm px-3 py-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="skeuo-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="skeuo-table w-full text-left">
            <thead>
              <tr>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Title</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Difficulty</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Source</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Created</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-12 text-slate-400 text-sm">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12 text-slate-400 text-sm">No challenges found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800 dark:text-white text-sm">{c.title}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${diffBadge(c.difficulty)}`}>
                      {c.difficulty}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                      {c.get_category_display || c.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {c.source_url ? (
                      <a href={c.source_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                        <Globe className="w-3 h-3" /> LeetCode
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Manual</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {c.is_active ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                        <XCircle className="w-3.5 h-3.5" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a href={`http://localhost:8000/admin/challenges/edit/${c.id}/`} target="_blank" rel="noreferrer"
                        className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1">
                        <Edit className="w-3 h-3" /> Edit
                      </a>
                      <button onClick={() => toggleChallenge(c.id)}
                        className={`text-xs font-bold flex items-center gap-1 ${c.is_active ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {c.is_active ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => deleteChallenge(c.id)}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowImport(false)}>
          <div className="skeuo-card p-6 max-w-2xl w-full space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                Import Challenge
              </h3>
              <button onClick={() => setShowImport(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 pb-2">
              {[
                { key: 'leetcode', label: 'Import from LeetCode', icon: <Globe className="w-4 h-4" /> },
                { key: 'manual', label: 'Manual Entry', icon: <Code className="w-4 h-4" /> },
                { key: 'json', label: 'JSON Upload', icon: <FileJson className="w-4 h-4" /> },
              ].map(tab => (
                <button key={tab.key} onClick={() => setImportTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-t-lg transition-all ${
                    importTab === tab.key
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: LeetCode */}
            {importTab === 'leetcode' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setImportMultiple(false)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg ${!importMultiple ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>Single URL</button>
                  <button onClick={() => setImportMultiple(true)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg ${importMultiple ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>Multiple URLs</button>
                </div>
                {!importMultiple ? (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">LeetCode URL</label>
                    <input type="url" value={importUrl} onChange={e => setImportUrl(e.target.value)}
                      placeholder="https://leetcode.com/problems/two-sum/"
                      className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500" />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">LeetCode URLs (one per line)</label>
                    <textarea value={importUrls} onChange={e => setImportUrls(e.target.value)}
                      placeholder="https://leetcode.com/problems/two-sum/&#10;https://leetcode.com/problems/valid-parentheses/"
                      rows={5}
                      className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 font-mono" />
                  </div>
                )}
                <p className="text-[10px] text-slate-400">Uses LeetCode GraphQL API. If unavailable, falls back to manual entry.</p>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowImport(false)} className="skeuo-btn skeuo-btn-secondary px-4 py-2 text-sm">Cancel</button>
                  <button onClick={handleLeetCodeImport} disabled={importing} className="skeuo-btn skeuo-btn-primary px-4 py-2 text-sm">
                    {importing ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Manual */}
            {importTab === 'manual' && (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Title *</label>
                    <input type="text" value={manual.title} onChange={e => setManual({...manual, title: e.target.value})}
                      placeholder="Challenge title" className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                    <textarea value={manual.description} onChange={e => setManual({...manual, description: e.target.value})}
                      rows={3} placeholder="Problem statement..." className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Difficulty</label>
                    <select value={manual.difficulty} onChange={e => setManual({...manual, difficulty: e.target.value})}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                    <select value={manual.category} onChange={e => setManual({...manual, category: e.target.value})}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <option value="ARRAYS">Arrays</option><option value="STRINGS">Strings</option>
                      <option value="LINKED_LISTS">Linked Lists</option><option value="TREES">Trees</option>
                      <option value="GRAPHS">Graphs</option><option value="DYNAMIC_PROGRAMMING">DP</option>
                      <option value="SORTING">Sorting</option><option value="SEARCHING">Searching</option>
                      <option value="SQL">SQL</option><option value="PYTHON">Python</option>
                      <option value="DJANGO">Django</option><option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Function Signature</label>
                    <input type="text" value={manual.function_signature} onChange={e => setManual({...manual, function_signature: e.target.value})}
                      placeholder="def two_sum(nums, target):" className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Starter Code (Python)</label>
                    <textarea value={manual.starter_code_python} onChange={e => setManual({...manual, starter_code_python: e.target.value})}
                      rows={3} className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Sample Input</label>
                    <input type="text" value={manual.sample_input} onChange={e => setManual({...manual, sample_input: e.target.value})}
                      placeholder='["h","e","l","l","o"]' className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Sample Output</label>
                    <input type="text" value={manual.sample_output} onChange={e => setManual({...manual, sample_output: e.target.value})}
                      placeholder='["o","l","l","e","h"]' className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Visible Test Cases (JSON)</label>
                    <textarea value={manual.visible_test_cases} onChange={e => setManual({...manual, visible_test_cases: e.target.value})}
                      rows={2} placeholder='[{"input": "5", "output": "120"}]' className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Source URL (optional)</label>
                    <input type="url" value={manual.source_url} onChange={e => setManual({...manual, source_url: e.target.value})}
                      placeholder="https://leetcode.com/problems/..." className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowImport(false)} className="skeuo-btn skeuo-btn-secondary px-4 py-2 text-sm">Cancel</button>
                  <button onClick={handleManualCreate} disabled={importing} className="skeuo-btn skeuo-btn-primary px-4 py-2 text-sm">
                    {importing ? 'Creating...' : 'Create Challenge'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab: JSON */}
            {importTab === 'json' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center">
                  <FileJson className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Upload a challenge.json file</p>
                  <input type="file" ref={fileInputRef} accept=".json" onChange={handleJsonFileChange} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="skeuo-btn skeuo-btn-secondary text-sm px-4 py-2">
                    <Upload className="w-4 h-4" /> Choose File
                  </button>
                  {jsonFile && <p className="text-xs text-slate-500 mt-2">{jsonFile.name}</p>}
                </div>
                {jsonPreview && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-400">{JSON.stringify(jsonPreview, null, 2).slice(0, 1000)}</pre>
                  </div>
                )}
                <p className="text-[10px] text-slate-400">JSON format: {"{"} "title", "description", "difficulty", "visible_test_cases", ... {"}"}</p>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowImport(false)} className="skeuo-btn skeuo-btn-secondary px-4 py-2 text-sm">Cancel</button>
                  <button onClick={handleJsonImport} disabled={importing || !jsonPreview} className="skeuo-btn skeuo-btn-primary px-4 py-2 text-sm">
                    {importing ? 'Importing...' : 'Import from JSON'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
