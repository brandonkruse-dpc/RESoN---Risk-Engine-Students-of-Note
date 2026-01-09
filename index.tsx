
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// ==========================================
// 1. TYPES & CONSTANTS
// ==========================================

enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

type AssessmentType = 'Summative' | 'IA' | 'Formative';

interface SubjectGrade {
  subject: string;
  grade: number;
  type: AssessmentType;
  isSummative: boolean;
  date: string;
}

interface CoreStatus {
  ee: 'Not Started' | 'Outline' | 'First Draft' | 'Final' | 'Submitted';
  tok: 'Developing' | 'Draft' | 'Final';
  cas: 'Behind' | 'On Track' | 'Completed';
}

interface Student {
  id: string;
  name: string;
  yearGroup: 12 | 13;
  attendanceRate: number;
  grades: SubjectGrade[];
  core: CoreStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  lastUpdated: string;
}

interface RiskWeights {
  attendance: number;
  academics: number;
  ias: number;
  coreEE: number;
  coreToK: number;
  coreCAS: number;
  thresholdMedium: number;
  thresholdHigh: number;
}

const DEFAULT_WEIGHTS: RiskWeights = {
  attendance: 20, 
  academics: 30,  
  ias: 20,       
  coreEE: 10,     
  coreToK: 10,    
  coreCAS: 10,    
  thresholdMedium: 40,
  thresholdHigh: 70
};

// Icon Components to ensure they are valid React types
const DashboardIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>;
const StudentsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const ReportIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const CloudIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19A5.5 5.5 0 0 0 18 8.02a1 1 0 0 1-.87-.44 9.1 9.1 0 0 0-16.7 4.1 1 1 0 0 1-.74.95 5 5 0 0 0 0 9.76 1 1 0 0 1 .5.16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="m16 16-4-4-4 4"/></svg>;

// ==========================================
// 2. MOCK DATA & ENGINE
// ==========================================

const MOCK_STUDENTS: Student[] = [
  {
    id: "MB1001", name: "Alex Thompson", yearGroup: 13, attendanceRate: 72.5,
    grades: [
      { subject: "Math AA HL", grade: 2, type: 'IA', isSummative: true, date: "2024-03-01" },
      { subject: "Physics HL", grade: 3, type: 'Summative', isSummative: true, date: "2024-02-15" }
    ],
    core: { ee: "Outline", tok: "Developing", cas: "Behind" },
    riskScore: 82, riskLevel: RiskLevel.HIGH, lastUpdated: new Date().toISOString()
  },
  {
    id: "MB1002", name: "Sarah Jenkins", yearGroup: 13, attendanceRate: 98.2,
    grades: [
      { subject: "History HL", grade: 6, type: 'IA', isSummative: true, date: "2024-03-01" },
      { subject: "Economics HL", grade: 7, type: 'Summative', isSummative: true, date: "2024-02-15" }
    ],
    core: { ee: "Final", tok: "Final", cas: "On Track" },
    riskScore: 12, riskLevel: RiskLevel.LOW, lastUpdated: new Date().toISOString()
  },
  {
    id: "MB1003", name: "Marcus Miller", yearGroup: 12, attendanceRate: 85.0,
    grades: [{ subject: "Biology HL", grade: 4, type: 'Summative', isSummative: true, date: "2024-03-10" }],
    core: { ee: "Not Started", tok: "Developing", cas: "On Track" },
    riskScore: 45, riskLevel: RiskLevel.MEDIUM, lastUpdated: new Date().toISOString()
  }
];

const calculateRiskScore = (student: Student, weights: RiskWeights): number => {
  const attRisk = Math.max(0, (95 - student.attendanceRate) / 15) * 100;
  const weightedAtt = (Math.min(100, attRisk) * weights.attendance) / 100;
  const summativeGrades = student.grades.filter(g => g.type === 'Summative');
  const avg = summativeGrades.length ? summativeGrades.reduce((acc, g) => acc + g.grade, 0) / summativeGrades.length : 4;
  const weightedAcad = (((7 - avg) / 6) * 100 * weights.academics) / 100;
  let eeRisk = student.core.ee === 'Not Started' ? 100 : student.core.ee === 'Outline' ? 60 : 0;
  const weightedEE = (eeRisk * weights.coreEE) / 100;
  return Math.round(Math.min(100, weightedAtt + weightedAcad + weightedEE));
};

const getRiskLevel = (score: number, weights: RiskWeights): RiskLevel => {
  if (score >= weights.thresholdHigh) return RiskLevel.HIGH;
  if (score >= weights.thresholdMedium) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
};

// ==========================================
// 3. COMPONENTS
// ==========================================

const RiskBadge = ({ level }: { level: RiskLevel }) => {
  const styles = {
    [RiskLevel.LOW]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [RiskLevel.MEDIUM]: 'bg-amber-100 text-amber-700 border-amber-200',
    [RiskLevel.HIGH]: 'bg-rose-100 text-rose-700 border-rose-200',
    [RiskLevel.CRITICAL]: 'bg-red-200 text-red-800 border-red-300 font-bold animate-pulse'
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[level] || styles[RiskLevel.LOW]}`}>{level}</span>;
};

const WeightSlider = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
  <div className="flex flex-col gap-2 mb-6 text-left">
    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
      <span>{label}</span>
      <span className="mono text-indigo-600 font-bold">{String(value)}%</span>
    </div>
    <input 
      type="range" 
      min="0" 
      max="100" 
      value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))} 
      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
    />
  </div>
);

// ==========================================
// 4. MAIN APP
// ==========================================

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [weights, setWeights] = useState<RiskWeights>(DEFAULT_WEIGHTS);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Re-calculate scores locally when weights change
  useEffect(() => {
    setStudents(prev => prev.map(s => {
      const score = calculateRiskScore(s, weights);
      return { ...s, riskScore: score, riskLevel: getRiskLevel(score, weights) };
    }));
  }, [weights]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [students, searchTerm]);

  const dp1Students = useMemo(() => students.filter(s => s.yearGroup === 12), [students]);
  const dp2Students = useMemo(() => students.filter(s => s.yearGroup === 13), [students]);

  const stats = {
    total: students.length,
    highRisk: students.filter(s => s.riskLevel === RiskLevel.HIGH).length,
    dp1Avg: dp1Students.length ? Math.round(dp1Students.reduce((a, b) => a + b.riskScore, 0) / dp1Students.length) : 0,
    dp2Avg: dp2Students.length ? Math.round(dp2Students.reduce((a, b) => a + b.riskScore, 0) / dp2Students.length) : 0,
  };

  const chartData = [
    { name: 'Low', DP1: dp1Students.filter(s => s.riskLevel === 'LOW').length, DP2: dp2Students.filter(s => s.riskLevel === 'LOW').length },
    { name: 'Med', DP1: dp1Students.filter(s => s.riskLevel === 'MEDIUM').length, DP2: dp2Students.filter(s => s.riskLevel === 'MEDIUM').length },
    { name: 'High', DP1: dp1Students.filter(s => s.riskLevel === 'HIGH').length, DP2: dp2Students.filter(s => s.riskLevel === 'HIGH').length },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-left">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 text-center border-b border-white/5">
          <h1 className="text-2xl font-black tracking-tighter text-white flex items-center justify-center gap-2">
            <span className="bg-indigo-600 px-2 py-0.5 rounded italic">RE</span>
            <span>SoN</span>
          </h1>
          <p className="text-[10px] text-indigo-400 mt-2 uppercase tracking-[0.2em] font-black italic">Student Risk Engine</p>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2">
          {[
            { id: 'dashboard', Icon: DashboardIcon },
            { id: 'students', Icon: StudentsIcon },
            { id: 'reports', Icon: ReportIcon },
            { id: 'backend', Icon: CloudIcon },
            { id: 'settings', Icon: SettingsIcon }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <div className="opacity-70"><tab.Icon /></div>
              <span className="font-black text-[11px] uppercase tracking-widest">{tab.id}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5 bg-black/20 mt-auto">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white text-xs shadow-inner">DC</div>
              <div className="overflow-hidden">
                 <p className="text-[10px] font-black text-white uppercase tracking-tighter">DP Coordinator</p>
                 <div className="flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                   <span className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">Online</span>
                 </div>
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full bg-slate-50 relative">
        <header className="bg-white border-b border-slate-200 px-10 py-6 flex justify-between items-center z-10">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{activeTab}</h2>
          <div className="relative group text-left">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-all"><SearchIcon /></span>
            <input type="text" placeholder="Query student name/ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 pr-6 py-3 bg-slate-100 border-none rounded-2xl text-[11px] font-bold w-72 focus:ring-2 focus:ring-indigo-500 transition-all outline-none uppercase tracking-tight" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar text-left">
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                  <div className="bg-indigo-950 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                     <div className="relative z-10 text-white">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Live Roster</p>
                        <p className="text-5xl font-black tracking-tighter">{String(stats.total)}</p>
                        <p className="text-[10px] font-black text-indigo-500 uppercase mt-4">Active Profiles</p>
                     </div>
                     <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 border-l-8 border-l-indigo-500 text-left">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-left">DP1 Avg Risk</p>
                     <p className="text-4xl font-black text-slate-900 tracking-tighter text-left">{String(stats.dp1Avg)}</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 border-l-8 border-l-purple-500 text-left">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-left">DP2 Avg Risk</p>
                     <p className="text-4xl font-black text-slate-900 tracking-tighter text-left">{String(stats.dp2Avg)}</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 border-l-8 border-l-rose-500 text-left">
                     <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 text-left">Critical Alerts</p>
                     <p className="text-4xl font-black text-rose-600 tracking-tighter text-left">{String(stats.highRisk)}</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                  <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 h-[450px]">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Risk Distribution</h3>
                     <div className="w-full h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '800'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                            <Legend verticalAlign="top" align="right" iconType="circle" />
                            <Bar dataKey="DP1" fill="#6366f1" radius={[8, 8, 0, 0]} name="DP1 (Y11)" />
                            <Bar dataKey="DP2" fill="#a855f7" radius={[8, 8, 0, 0]} name="DP2 (Y12)" />
                          </BarChart>
                      </ResponsiveContainer>
                     </div>
                  </div>
                  <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col text-left">
                     <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] mb-8 text-left">Priority Attention</h3>
                     <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar text-left">
                        {students.filter(s => s.riskLevel === RiskLevel.HIGH).map(s => (
                           <div key={s.id} onClick={() => setSelectedStudent(s)} className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100/50 cursor-pointer hover:bg-rose-100 transition-all flex justify-between items-center group text-left">
                              <div className="text-left">
                                 <p className="text-sm font-black text-slate-800 text-left">{s.name}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter text-left">ID: {s.id} • {s.yearGroup === 12 ? 'DP1' : 'DP2'}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-lg font-black text-rose-600 mono font-bold">{String(s.riskScore)}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden text-left">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                     <tr>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">Student Profile</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Cohort</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Score</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">Risk Level</th>
                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Review</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-left">
                     {filteredStudents.map(student => (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                           <td className="p-8 text-left">
                              <div className="flex flex-col text-left">
                                 <span className="font-black text-slate-800 text-sm text-left">{student.name}</span>
                                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight text-left">{student.id}</span>
                              </div>
                           </td>
                           <td className="p-8 text-center text-xs font-black text-slate-500 uppercase">{student.yearGroup === 12 ? 'DP1' : 'DP2'}</td>
                           <td className="p-8 text-center font-black text-lg text-slate-900 mono font-bold">{String(student.riskScore)}</td>
                           <td className="p-8 text-left"><RiskBadge level={student.riskLevel} /></td>
                           <td className="p-8 text-right">
                              <button onClick={() => setSelectedStudent(student)} className="bg-slate-100 text-slate-900 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95">Profile</button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          )}

          {activeTab === 'settings' && (
             <div className="max-w-4xl mx-auto text-left">
                <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-sm border border-slate-100 text-left">
                   <h3 className="text-xl font-black text-slate-900 mb-12 flex items-center gap-4 uppercase tracking-tighter text-left">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><SettingsIcon /></div> 
                      Risk Parameters
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12 text-left">
                      <div className="space-y-4 text-left">
                         <WeightSlider label="Attendance" value={weights.attendance} onChange={(v) => setWeights({...weights, attendance: v})} />
                         <WeightSlider label="Academics" value={weights.academics} onChange={(v) => setWeights({...weights, academics: v})} />
                         <WeightSlider label="IAs" value={weights.ias} onChange={(v) => setWeights({...weights, ias: v})} />
                      </div>
                      <div className="space-y-4 text-left">
                         <WeightSlider label="EE" value={weights.coreEE} onChange={(v) => setWeights({...weights, coreEE: v})} />
                         <WeightSlider label="ToK" value={weights.coreToK} onChange={(v) => setWeights({...weights, coreToK: v})} />
                         <WeightSlider label="CAS" value={weights.coreCAS} onChange={(v) => setWeights({...weights, coreCAS: v})} />
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'backend' && (
            <div className="max-w-3xl mx-auto text-center space-y-8 text-left">
              <div className="bg-indigo-900 p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden text-center">
                <div className="relative z-10 text-center">
                   <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 text-center"><CloudIcon /></div>
                   <h3 className="text-3xl font-black mb-4 tracking-tighter uppercase text-center">Sync Engine</h3>
                   <p className="text-indigo-200 text-xs mb-8 text-center">ManageBac and Google Workspace Integration</p>
                   <button className="bg-white text-indigo-950 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl text-center">Manual Synchronization</button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'reports' && (
            <div className="max-w-3xl mx-auto text-center space-y-8 text-left">
              <div className="bg-white p-16 rounded-[4rem] shadow-sm border border-slate-200 text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 text-center"><ReportIcon /></div>
                <h3 className="text-3xl font-black mb-4 tracking-tighter uppercase text-slate-900 text-center">Weekly Summary</h3>
                <p className="text-slate-500 text-xs mb-8 max-w-xs mx-auto text-center">Generate a high-level PDF report for meeting agendas.</p>
                <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl text-center">Generate PDF</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-auto text-left">
              <div className={`p-10 md:p-16 text-white flex justify-between items-start bg-gradient-to-br ${selectedStudent.riskLevel === 'HIGH' ? 'from-rose-600 to-rose-900' : 'from-indigo-600 to-indigo-900'}`}>
                 <div className="text-left">
                    <div className="flex flex-wrap items-center gap-4 mb-4 text-left">
                       <span className="bg-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-left">{selectedStudent.yearGroup === 12 ? 'DP1' : 'DP2'}</span>
                       <span className="bg-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-left">ID: {selectedStudent.id}</span>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-left">{selectedStudent.name}</h3>
                 </div>
                 <button onClick={() => setSelectedStudent(null)} className="p-4 bg-white/10 hover:bg-white/20 rounded-[1.5rem] transition-all">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                 </button>
              </div>
              <div className="p-10 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
                 <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden text-center">
                    <div className="absolute top-4 left-6 bg-indigo-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Risk Index</div>
                    <p className="text-8xl font-black text-indigo-600 tracking-tighter mb-4 text-center">{String(selectedStudent.riskScore)}</p>
                    <RiskBadge level={selectedStudent.riskLevel} />
                 </div>
                 <div className="space-y-6 text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-left">Subject Grades</p>
                    <div className="grid grid-cols-2 gap-4 text-left">
                       {selectedStudent.grades.map((g, i) => (
                          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-left">
                             <span className="text-3xl font-black text-slate-800 mb-1 text-center font-bold">{String(g.grade)}</span>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">{g.subject}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 5. BOOTSTRAP
// ==========================================

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
