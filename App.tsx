
import React, { useState, useEffect, useMemo } from 'react';
import { Student, RiskWeights, RiskLevel, BackendConfig } from './types.ts';
import { DEFAULT_WEIGHTS, Icons } from './constants.tsx';
import { MOCK_STUDENTS } from './services/mockData.ts';
import { calculateRiskScore, getRiskLevel } from './services/riskEngine.ts';
import { syncFromManageBac, fetchLatestFromDrive, BRIDGE_CODE_TEMPLATE } from './services/managebacSync.ts';
import { RiskBadge } from './components/RiskBadge.tsx';
import { WeightSlider } from './components/WeightSlider.tsx';
import { generateStudentRiskSummary, generateBatchReport } from './services/geminiService.ts';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';

type Tab = 'dashboard' | 'students' | 'settings' | 'reports' | 'backend';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [weights, setWeights] = useState<RiskWeights>(DEFAULT_WEIGHTS);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [bridgeUrl, setBridgeUrl] = useState<string>(localStorage.getItem('reson_bridge_url') || '');
  const [showBridgeCode, setShowBridgeCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Backend Config State
  const [backendConfig, setBackendConfig] = useState<BackendConfig>({
    mbApiKey: localStorage.getItem('reson_mb_key') || '',
    mbDomain: localStorage.getItem('reson_mb_domain') || 'yourschool.managebac.com',
    gDriveRawFolder: localStorage.getItem('reson_drive_folder') || '',
    gDriveReportFolder: '',
    syncFrequency: 'thrice-weekly',
    lastSync: new Date().toISOString()
  });

  // Persist Settings
  useEffect(() => {
    localStorage.setItem('reson_bridge_url', bridgeUrl);
    localStorage.setItem('reson_mb_key', backendConfig.mbApiKey);
    localStorage.setItem('reson_mb_domain', backendConfig.mbDomain);
    localStorage.setItem('reson_drive_folder', backendConfig.gDriveRawFolder);
  }, [bridgeUrl, backendConfig]);

  // Load Latest Data on Start
  useEffect(() => {
    const initFetch = async () => {
      if (bridgeUrl && backendConfig.gDriveRawFolder) {
        try {
          const latest = await fetchLatestFromDrive(bridgeUrl, backendConfig.gDriveRawFolder);
          if (latest && latest.length > 0) {
            console.log("Latest data fetched from Cloud Storage");
          }
        } catch (e) {
          console.log("No previous cloud data found. Using local cache.");
        }
      }
    };
    initFetch();
  }, []);

  useEffect(() => {
    const updated = students.map(s => {
      const score = calculateRiskScore(s, weights);
      return { ...s, riskScore: score, riskLevel: getRiskLevel(score, weights) };
    });
    setStudents(updated);
  }, [weights, students.length]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const dp1Students = useMemo(() => students.filter(s => s.yearGroup === 12), [students]);
  const dp2Students = useMemo(() => students.filter(s => s.yearGroup === 13), [students]);

  const handleManualSync = async () => {
    if (!bridgeUrl) {
      alert("Please configure your RE:SoN Bridge URL in the Sync Engine tab first.");
      return;
    }
    setIsSyncing(true);
    try {
      const freshData = await syncFromManageBac(bridgeUrl, backendConfig);
      if (freshData && freshData.length > 0) {
        setBackendConfig({ ...backendConfig, lastSync: new Date().toISOString() });
        alert(`Sync Successful! Retrieved ${freshData.length} records. Cloud archive updated.`);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(BRIDGE_CODE_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student);
    setIsLoadingAi(true);
    const summary = await generateStudentRiskSummary(student);
    setAiSummary(summary);
    setIsLoadingAi(false);
  };

  const formatYear = (year: number) => year === 12 ? 'DP1 (Y11)' : 'DP2 (Y12)';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-950 text-indigo-100 flex flex-col shadow-xl z-20">
        <div className="p-6 text-center">
          <h1 className="text-2xl font-black tracking-tighter text-white flex items-center justify-center gap-2">
            <span className="bg-white text-indigo-900 px-2 py-0.5 rounded italic">RE</span>
            <span>SoN</span>
          </h1>
          <p className="text-[10px] text-indigo-400 mt-1 uppercase tracking-widest font-bold italic">Student Risk Engine</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-800 text-white shadow-lg' : 'hover:bg-indigo-900/50'}`}>
            <Icons.Dashboard />
            <span className="font-medium text-sm">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('students')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'students' ? 'bg-indigo-800 text-white shadow-lg' : 'hover:bg-indigo-900/50'}`}>
            <Icons.Students />
            <span className="font-medium text-sm">Tracking</span>
          </button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-indigo-800 text-white shadow-lg' : 'hover:bg-indigo-900/50'}`}>
            <Icons.Report />
            <span className="font-medium text-sm">Reports</span>
          </button>
          <div className="h-px bg-indigo-900/50 my-2 mx-4"></div>
          <button onClick={() => setActiveTab('backend')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'backend' ? 'bg-amber-600 text-white shadow-lg' : 'hover:bg-indigo-900/50'}`}>
            <Icons.Cloud />
            <span className="font-medium text-sm">Sync Engine</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-indigo-800 text-white shadow-lg' : 'hover:bg-indigo-900/50'}`}>
            <Icons.Settings />
            <span className="font-medium text-sm">Risk Weights</span>
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-indigo-900/50">
          <div className="flex items-center gap-3 p-3 bg-indigo-900/40 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">DC</div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate text-left">DP Coordinator</p>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${bridgeUrl ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                <p className={`text-[10px] font-bold uppercase tracking-tighter ${bridgeUrl ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {bridgeUrl ? 'Bridge Live' : 'Bridge Offline'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 z-10 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
            {activeTab.replace('-', ' ')}
          </h2>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></span>
            <input 
              type="text" 
              placeholder="Query student..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 bg-indigo-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                   <div className="relative z-10">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Live Status</p>
                    <p className="text-4xl font-black">{students.length}</p>
                    <p className="text-[10px] text-indigo-300 mt-2 font-bold uppercase tracking-tighter">Total Students</p>
                   </div>
                   <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-l-indigo-500">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DP1 Avg Risk</p>
                  <p className="text-3xl font-black text-slate-800">{dp1Students.length ? Math.round(dp1Students.reduce((a, b) => a + b.riskScore, 0) / dp1Students.length) : 0}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-l-purple-500">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DP2 Avg Risk</p>
                  <p className="text-3xl font-black text-slate-800">{dp2Students.length ? Math.round(dp2Students.reduce((a, b) => a + b.riskScore, 0) / dp2Students.length) : 0}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 border-l-4 border-l-rose-500">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical</p>
                  <p className="text-3xl font-black text-rose-600">{students.filter(s => s.riskLevel === RiskLevel.HIGH).length}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-[400px]">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Year Group Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Low', DP1: dp1Students.filter(s => s.riskLevel === 'LOW').length, DP2: dp2Students.filter(s => s.riskLevel === 'LOW').length },
                      { name: 'Med', DP1: dp1Students.filter(s => s.riskLevel === 'MEDIUM').length, DP2: dp2Students.filter(s => s.riskLevel === 'MEDIUM').length },
                      { name: 'High', DP1: dp1Students.filter(s => s.riskLevel === 'HIGH').length, DP2: dp2Students.filter(s => s.riskLevel === 'HIGH').length },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '700'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                      <Legend verticalAlign="top" align="right" iconType="circle" />
                      <Bar dataKey="DP1" fill="#6366f1" radius={[4, 4, 0, 0]} name="DP1 (Y11)" />
                      <Bar dataKey="DP2" fill="#a855f7" radius={[4, 4, 0, 0]} name="DP2 (Y12)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 overflow-y-auto max-h-[400px]">
                  <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-6">Immediate Attention</h3>
                  <div className="space-y-4">
                    {students.filter(s => s.riskLevel === 'HIGH').map(s => (
                      <div key={s.id} onClick={() => handleStudentSelect(s)} className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 cursor-pointer hover:bg-rose-100 transition-all flex justify-between items-center">
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-800">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{formatYear(s.yearGroup)}</p>
                        </div>
                        <span className="text-xs font-black text-rose-600 mono">{s.riskScore}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Level</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">{student.name}</span>
                          <span className="text-[10px] text-slate-400 mono">{formatYear(student.yearGroup)}</span>
                        </div>
                      </td>
                      <td className="p-5 text-center font-black text-sm text-slate-600">{student.riskScore}</td>
                      <td className="p-5"><RiskBadge level={student.riskLevel} /></td>
                      <td className="p-5 text-right">
                        <button onClick={() => handleStudentSelect(student)} className="text-indigo-600 hover:text-indigo-800 font-black text-xs uppercase tracking-tighter">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'backend' && (
            <div className="max-w-5xl mx-auto space-y-12">
              <div className="bg-indigo-50 border border-indigo-200 p-8 rounded-[2rem] flex gap-6 items-start shadow-sm text-left">
                 <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200"><Icons.Cloud /></div>
                 <div className="flex-1">
                    <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-2">Google Cloud Sync Engine v2</h3>
                    <p className="text-xs text-indigo-800 leading-relaxed mb-6">
                      RE:SoN uses a <strong>Bridge Proxy</strong> to securely talk to ManageBac.
                    </p>
                    <div className="flex gap-4">
                       <button onClick={() => setShowBridgeCode(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all">
                         View Bridge Code
                       </button>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">1. Connection</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Bridge URL</label>
                      <input type="text" value={bridgeUrl} onChange={e => setBridgeUrl(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm focus:border-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">MB Subdomain</label>
                      <input type="text" value={backendConfig.mbDomain} onChange={e => setBackendConfig({...backendConfig, mbDomain: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-sm focus:border-indigo-500 outline-none" />
                    </div>
                    <button onClick={handleManualSync} disabled={isSyncing || !bridgeUrl} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all">
                      {isSyncing ? "Syncing..." : "Run ManageBac Sync"}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl">
                  <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-8 text-center">2. Security</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest text-center">Admin API Token</label>
                      <input type="password" value={backendConfig.mbApiKey} onChange={e => setBackendConfig({...backendConfig, mbApiKey: e.target.value})} className="w-full bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm mono text-indigo-100 focus:ring-2 focus:ring-indigo-500 outline-none text-center" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest text-center">Drive Folder ID</label>
                      <input type="text" value={backendConfig.gDriveRawFolder} onChange={e => setBackendConfig({...backendConfig, gDriveRawFolder: e.target.value})} className="w-full bg-slate-800 border-none rounded-2xl px-5 py-3 text-xs text-indigo-100 focus:ring-2 focus:ring-indigo-500 outline-none text-center" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-12">
               <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 text-left">
                  <h3 className="text-lg font-black text-slate-800 mb-10 flex items-center gap-3">
                    <Icons.Settings /> RE:SoN Weighting Logic
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                       <WeightSlider label="Attendance Threshold" value={weights.attendance} onChange={(v) => setWeights({...weights, attendance: v})} />
                       <WeightSlider label="Academic Average" value={weights.academics} onChange={(v) => setWeights({...weights, academics: v})} />
                    </div>
                    <div className="space-y-8">
                       <WeightSlider label="EE Status" value={weights.coreEE} onChange={(v) => setWeights({...weights, coreEE: v})} />
                       <WeightSlider label="ToK Progress" value={weights.coreToK} onChange={(v) => setWeights({...weights, coreToK: v})} />
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'reports' && (
             <div className="max-w-3xl mx-auto space-y-8 text-left">
                <div className="bg-indigo-900 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Cohort Risk Report</h2>
                    <p className="text-indigo-200 text-sm mb-10 leading-relaxed max-w-md">Generate an executive summary of high-risk students.</p>
                    <button onClick={async () => {
                      const report = await generateBatchReport(students);
                      alert(report);
                    }} className="bg-white text-indigo-900 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all active:scale-95">
                      Generate PDF Report
                    </button>
                  </div>
                </div>
             </div>
          )}
        </div>
      </main>

      {/* Bridge Code Modal */}
      {showBridgeCode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="text-left">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Bridge Proxy Setup</h3>
                <p className="text-xs text-slate-500 font-medium tracking-tight">Paste this into a new Google Apps Script project</p>
              </div>
              <button onClick={() => setShowBridgeCode(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-all">
                <Icons.Alert />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8">
               <div className="relative group">
                <div className="absolute top-4 right-4 z-10">
                   <button onClick={copyToClipboard} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white hover:bg-black'}`}>
                     {copied ? 'Copied!' : 'Copy to Clipboard'}
                   </button>
                </div>
                <div className="bg-slate-900 rounded-3xl p-8 overflow-x-auto text-left">
                  <pre className="text-indigo-300 text-[11px] mono leading-relaxed">
                    {BRIDGE_CODE_TEMPLATE}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-8">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 text-left">
            <div className={`p-12 text-white flex justify-between items-start bg-gradient-to-r ${selectedStudent.yearGroup === 12 ? 'from-indigo-600 to-indigo-800' : 'from-purple-600 to-purple-800'}`}>
              <div>
                <h3 className="text-4xl font-black tracking-tight mb-2">{selectedStudent.name}</h3>
                <p className="text-indigo-100/70 text-sm font-bold uppercase tracking-widest">{selectedStudent.id} • {formatYear(selectedStudent.yearGroup)}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-12 space-y-10">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Index</h4>
                  <p className="text-3xl font-black text-indigo-600">{selectedStudent.riskScore}</p>
                </div>
                <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grades</h4>
                   <div className="grid grid-cols-2 gap-3">
                     {selectedStudent.grades.map((g, i) => (
                       <div key={i} className="p-4 rounded-2xl border bg-slate-50 border-slate-100 text-center">
                         <p className="text-xl font-black text-slate-700">{g.grade}</p>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
              <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 relative">
                <div className="absolute -top-3 left-8 bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">AI Insights</div>
                {isLoadingAi ? <div className="animate-pulse py-2">Analyzing Profile...</div> : <p className="text-sm text-indigo-950 font-medium italic">"{aiSummary}"</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
