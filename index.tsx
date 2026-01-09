
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

/**
 * RE:SoN | Risk Engine: Students of Note
 * World-class IB DP Risk Identification Engine
 */

// --- Types ---
enum RiskLevel { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', CRITICAL = 'CRITICAL' }
type AssessmentType = 'Summative' | 'IA' | 'Formative';

interface SubjectGrade {
  subject: string;
  grade: number;
  type: AssessmentType;
}

interface Student {
  id: string;
  name: string;
  yearGroup: 12 | 13; // DP1 or DP2
  attendanceRate: number;
  grades: SubjectGrade[];
  ee: string;
  tok: string;
  cas: string;
  riskScore: number;
  riskLevel: RiskLevel;
}

interface RiskWeights {
  attendance: number;
  academics: number;
  core: number;
  thresholdHigh: number;
  thresholdMedium: number;
}

// --- Icons (Functional) ---
const Icons = {
  Dash: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>,
  Students: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  Weights: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  Report: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  Add: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>,
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
};

// --- Initial Data ---
// Added missing 'type' to SubjectGrade objects
const INITIAL_STUDENTS: Student[] = [
  { id: "S1001", name: "Alex Thompson", yearGroup: 13, attendanceRate: 74.2, grades: [{subject: 'Physics HL', grade: 3, type: 'Summative'}, {subject: 'Math AA HL', grade: 2, type: 'Summative'}], ee: 'Outline', tok: 'Draft', cas: 'Behind', riskScore: 0, riskLevel: RiskLevel.LOW },
  { id: "S1002", name: "Sarah Jenkins", yearGroup: 13, attendanceRate: 98.5, grades: [{subject: 'History HL', grade: 6, type: 'Summative'}, {subject: 'Economics HL', grade: 7, type: 'Summative'}], ee: 'Final', tok: 'Final', cas: 'On Track', riskScore: 0, riskLevel: RiskLevel.LOW },
  { id: "S1003", name: "Marcus Miller", yearGroup: 12, attendanceRate: 85.0, grades: [{subject: 'Biology HL', grade: 4, type: 'Summative'}], ee: 'Not Started', tok: 'Developing', cas: 'On Track', riskScore: 0, riskLevel: RiskLevel.LOW },
  { id: "S1004", name: "Liam O'Connor", yearGroup: 12, attendanceRate: 62.1, grades: [{subject: 'Chemistry HL', grade: 3, type: 'Summative'}], ee: 'Not Started', tok: 'Developing', cas: 'Behind', riskScore: 0, riskLevel: RiskLevel.LOW }
];

const INITIAL_WEIGHTS: RiskWeights = {
  attendance: 35,
  academics: 40,
  core: 25,
  thresholdHigh: 70,
  thresholdMedium: 40
};

// --- Engine ---
const calculateRisk = (student: Student, weights: RiskWeights): { score: number, level: RiskLevel } => {
  const attRisk = Math.max(0, 95 - student.attendanceRate) * (100/35); // 0-100 normalized
  const avgGrade = student.grades.length > 0 ? student.grades.reduce((a, b) => a + b.grade, 0) / student.grades.length : 4;
  const gradeRisk = ((7 - avgGrade) / 6) * 100;
  
  const coreScores = { ee: 0, tok: 0, cas: 0 };
  if (student.ee === 'Not Started') coreScores.ee = 100; else if (student.ee === 'Outline') coreScores.ee = 50;
  if (student.tok === 'Developing') coreScores.tok = 80;
  if (student.cas === 'Behind') coreScores.cas = 100;
  const coreRisk = (coreScores.ee + coreScores.tok + coreScores.cas) / 3;

  const total = (attRisk * (weights.attendance/100)) + (gradeRisk * (weights.academics/100)) + (coreRisk * (weights.core/100));
  const rounded = Math.round(total);
  
  let level = RiskLevel.LOW;
  if (rounded >= weights.thresholdHigh) level = RiskLevel.HIGH;
  else if (rounded >= weights.thresholdMedium) level = RiskLevel.MEDIUM;

  return { score: rounded, level };
};

// --- Components ---
const App = () => {
  const [activeTab, setActiveTab] = useState<'dash' | 'students' | 'weights' | 'reports'>('dash');
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [weights, setWeights] = useState<RiskWeights>(INITIAL_WEIGHTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Recalculate on weight/student changes
  const computedStudents = useMemo(() => {
    return students.map(s => {
      const { score, level } = calculateRisk(s, weights);
      return { ...s, riskScore: score, riskLevel: level };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [students, weights]);

  const filtered = useMemo(() => {
    return computedStudents.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [computedStudents, searchTerm]);

  const stats = {
    total: students.length,
    highRisk: computedStudents.filter(s => s.riskLevel === RiskLevel.HIGH).length,
    dp1Avg: computedStudents.filter(s => s.yearGroup === 12).length ? Math.round(computedStudents.filter(s => s.yearGroup === 12).reduce((a, b) => a + b.riskScore, 0) / computedStudents.filter(s => s.yearGroup === 12).length) : 0,
    dp2Avg: computedStudents.filter(s => s.yearGroup === 13).length ? Math.round(computedStudents.filter(s => s.yearGroup === 13).reduce((a, b) => a + b.riskScore, 0) / computedStudents.filter(s => s.yearGroup === 13).length) : 0
  };

  const chartData = [
    { name: 'DP1 (Y12)', score: stats.dp1Avg },
    { name: 'DP2 (Y13)', score: stats.dp2Avg }
  ];

  const handleAddStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Added missing 'type' to SubjectGrade in new student
    const newStudent: Student = {
      id: "S" + (1000 + students.length + 1),
      name: formData.get('name') as string,
      yearGroup: parseInt(formData.get('year') as string) as 12 | 13,
      attendanceRate: parseFloat(formData.get('attendance') as string),
      grades: [{ subject: 'Core HL', grade: parseInt(formData.get('grade') as string), type: 'Summative' }],
      ee: formData.get('ee') as string,
      tok: formData.get('tok') as string,
      cas: formData.get('cas') as string,
      riskScore: 0,
      riskLevel: RiskLevel.LOW
    };
    setStudents([...students, newStudent]);
    setShowAddModal(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Navigation */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-30">
        <div className="p-10 border-b border-white/5">
          <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
            <span className="bg-indigo-600 px-3 py-1 rounded-2xl italic">RE</span>
            <span>SoN</span>
          </h1>
          <p className="text-[10px] text-indigo-400 mt-2 uppercase tracking-[0.2em] font-black">Students of Note Engine</p>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          {[
            { id: 'dash', label: 'Overview', icon: <Icons.Dash /> },
            { id: 'students', label: 'Tracking', icon: <Icons.Students /> },
            { id: 'weights', label: 'Weights', icon: <Icons.Weights /> },
            { id: 'reports', label: 'Reports', icon: <Icons.Report /> }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-200 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <div className={`${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`}>{tab.icon}</div>
              <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5 bg-black/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white text-xs shadow-lg">DC</div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-tighter text-indigo-300">Coordinator</span>
              <span className="text-xs font-bold text-white truncate w-32 tracking-tight">ManageBac Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-12 py-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{activeTab}</h2>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <p className="text-xs text-slate-400 font-bold tracking-tight">Cloud Backend: <span className="text-emerald-500 uppercase tracking-widest">Active</span></p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"><Icons.Search /></span>
              <input 
                type="text" 
                placeholder="Search students..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3 bg-slate-100 border-none rounded-2xl text-[11px] font-bold w-72 focus:ring-2 focus:ring-indigo-500 transition-all outline-none uppercase tracking-widest"
              />
            </div>
            <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200"><Icons.Add /></button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-10 animate-fade-in">
          
          {activeTab === 'dash' && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="bg-indigo-950 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10 text-white">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-4">Total Profiles</p>
                    <p className="text-6xl font-black tracking-tighter">{String(stats.total)}</p>
                    <div className="mt-6 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                       <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Sync</span>
                    </div>
                  </div>
                  <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
                </div>
                
                {[
                  { label: 'DP1 Risk Avg', val: stats.dp1Avg, color: 'indigo' },
                  { label: 'DP2 Risk Avg', val: stats.dp2Avg, color: 'purple' },
                  { label: 'High Priority', val: stats.highRisk, color: 'rose' }
                ].map(stat => (
                  <div key={stat.label} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200/50 flex flex-col justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{stat.label}</p>
                    <p className={`text-5xl font-black tracking-tighter text-${stat.color}-600`}>{String(stat.val)}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 h-[500px]">
                <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] shadow-sm border border-slate-200/50 flex flex-col">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Cohort Risk Analysis
                  </h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: '800'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="score" radius={[12, 12, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#a855f7'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-slate-200/50 flex flex-col overflow-hidden">
                   <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-8">Priority Alert List</h3>
                   <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                     {computedStudents.filter(s => s.riskLevel === RiskLevel.HIGH).map(s => (
                       <div key={s.id} onClick={() => setSelectedStudent(s)} className="group p-5 bg-rose-50/50 rounded-3xl border border-rose-100/50 cursor-pointer hover:bg-rose-100 hover:border-rose-200 transition-all flex justify-between items-center">
                         <div>
                            <p className="text-sm font-black text-slate-800">{s.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Cohort {String(s.yearGroup)}</p>
                         </div>
                         <div className="text-right">
                            <span className="text-lg font-black text-rose-600 mono">{String(s.riskScore)}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-8 animate-fade-in">
               <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200/50 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                        <th className="p-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Identity</th>
                        <th className="p-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Cohort</th>
                        <th className="p-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Score</th>
                        <th className="p-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Risk Status</th>
                        <th className="p-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Interaction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                           <td className="p-10">
                              <div className="flex flex-col">
                                 <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{s.name}</span>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">ID: {s.id}</span>
                              </div>
                           </td>
                           <td className="p-10 text-center">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${s.yearGroup === 12 ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>
                                 DP{s.yearGroup === 12 ? '1' : '2'}
                              </span>
                           </td>
                           <td className="p-10 text-center text-lg font-black text-slate-900 mono">{String(s.riskScore)}</td>
                           <td className="p-10">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                s.riskLevel === RiskLevel.HIGH ? 'bg-rose-100 text-rose-600 border-rose-200' : 
                                s.riskLevel === RiskLevel.MEDIUM ? 'bg-amber-100 text-amber-600 border-amber-200' : 
                                'bg-emerald-100 text-emerald-600 border-emerald-200'
                              }`}>
                                {s.riskLevel}
                              </span>
                           </td>
                           <td className="p-10 text-right">
                              <button onClick={() => setSelectedStudent(s)} className="bg-slate-100 text-slate-900 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all transform active:scale-95">Profile</button>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'weights' && (
             <div className="max-w-4xl mx-auto animate-fade-in">
                <div className="bg-white p-16 rounded-[4rem] shadow-sm border border-slate-200/50">
                   <h3 className="text-2xl font-black text-slate-900 mb-12 flex items-center gap-5 uppercase tracking-tighter">
                      <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Icons.Weights /></div>
                      Model Weightings
                   </h3>
                   
                   <div className="space-y-12">
                      {[
                        { key: 'attendance', label: 'Attendance impact', val: weights.attendance },
                        { key: 'academics', label: 'Summative Academic Marks', val: weights.academics },
                        { key: 'core', label: 'EE, ToK, CAS Progress', val: weights.core }
                      ].map(item => (
                        <div key={item.key} className="space-y-4">
                           <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              <span>{item.label}</span>
                              <span className="mono text-indigo-600 text-lg">{String(item.val)}%</span>
                           </div>
                           <input 
                              type="range" min="0" max="100" value={item.val} 
                              onChange={(e) => setWeights({...weights, [item.key]: parseInt(e.target.value)})}
                              className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700" 
                           />
                        </div>
                      ))}
                      
                      <div className="pt-8 border-t border-slate-100 grid grid-cols-2 gap-10">
                         <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Medium Risk Threshold</label>
                            <input type="number" value={weights.thresholdMedium} onChange={e => setWeights({...weights, thresholdMedium: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold mono focus:ring-2 focus:ring-indigo-500 outline-none" />
                         </div>
                         <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">High Risk Threshold</label>
                            <input type="number" value={weights.thresholdHigh} onChange={e => setWeights({...weights, thresholdHigh: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold mono focus:ring-2 focus:ring-indigo-500 outline-none" />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'reports' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-fade-in text-center">
               <div className="bg-white p-20 rounded-[4rem] shadow-sm border border-slate-200/50">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-lg shadow-indigo-100"><Icons.Report /></div>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-6">Weekly Executive Summary</h3>
                  <p className="text-slate-500 text-sm mb-12 max-w-md mx-auto leading-relaxed">Generated report including deep-dive analysis of high-risk students across DP1 and DP2 cohorts.</p>
                  
                  <div className="flex flex-col md:flex-row gap-6 justify-center">
                     <button onClick={() => alert("PDF Generating... [System simulated]")} className="bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">Download PDF</button>
                     <button onClick={() => alert("Email dispatched to DP Coordinator. [System simulated]")} className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-black transition-all active:scale-95">Email Report</button>
                  </div>
               </div>
            </div>
          )}

        </div>
      </main>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-8 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-auto">
             <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-2xl font-black tracking-tighter uppercase">Register New Student</h3>
                <button onClick={() => setShowAddModal(false)} className="p-4 hover:bg-slate-200 rounded-2xl transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
             </div>
             <form onSubmit={handleAddStudent} className="p-12 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400">Full Name</label>
                    <input name="name" required className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400">Cohort</label>
                    <select name="year" className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none">
                       <option value="12">DP1 (Year 12)</option>
                       <option value="13">DP2 (Year 13)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400">Attendance %</label>
                    <input name="attendance" type="number" step="0.1" required className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400">Current Avg (1-7)</label>
                    <input name="grade" type="number" min="1" max="7" required className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">EE</label>
                      <select name="ee" className="w-full p-3 bg-slate-100 rounded-xl text-[10px] font-bold outline-none"><option>Not Started</option><option>Outline</option><option>Draft</option><option>Final</option></select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">ToK</label>
                      <select name="tok" className="w-full p-3 bg-slate-100 rounded-xl text-[10px] font-bold outline-none"><option>Developing</option><option>Draft</option><option>Final</option></select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase">CAS</label>
                      <select name="cas" className="w-full p-3 bg-slate-100 rounded-xl text-[10px] font-bold outline-none"><option>On Track</option><option>Behind</option><option>Completed</option></select>
                   </div>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white p-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all">Onboard Student</button>
             </form>
          </div>
        </div>
      )}

      {/* Profile Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[150] flex items-center justify-center p-8 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-auto relative">
             <div className={`p-16 text-white flex justify-between items-start bg-gradient-to-br ${selectedStudent.riskLevel === RiskLevel.HIGH ? 'from-rose-600 to-rose-900' : 'from-indigo-600 to-indigo-900'}`}>
                <div>
                   <div className="flex items-center gap-4 mb-6">
                      <span className="bg-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Cohort {String(selectedStudent.yearGroup)}</span>
                      <span className="bg-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">ID: {selectedStudent.id}</span>
                   </div>
                   <h3 className="text-6xl font-black tracking-tighter mb-4">{selectedStudent.name}</h3>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="p-5 bg-white/10 hover:bg-white/20 rounded-[2rem] transition-all">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
             </div>
             
             <div className="p-20 grid grid-cols-1 md:grid-cols-2 gap-20">
                <div className="space-y-12">
                   <div className="bg-slate-50 p-12 rounded-[4rem] text-center border border-slate-100 relative overflow-hidden">
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg">Final Risk Index</div>
                      <p className={`text-9xl font-black tracking-tighter mt-4 ${selectedStudent.riskLevel === RiskLevel.HIGH ? 'text-rose-600' : 'text-indigo-600'}`}>
                        {String(selectedStudent.riskScore)}
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-6">Calculated across 47 data points</p>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center">
                         <span className="text-3xl font-black text-slate-800">{String(selectedStudent.attendanceRate)}%</span>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Attendance</span>
                      </div>
                      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center">
                         <span className="text-3xl font-black text-slate-800">{String(selectedStudent.grades[0]?.grade || 0)}</span>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Average Mark</span>
                      </div>
                   </div>
                </div>
                
                <div className="space-y-12">
                   <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                         <span className="w-2 h-2 rounded-full bg-amber-400"></span> Core Requirements
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                         {[
                           { label: 'Extended Essay', status: selectedStudent.ee },
                           { label: 'Theory of Knowledge', status: selectedStudent.tok },
                           { label: 'CAS Engagement', status: selectedStudent.cas }
                         ].map(core => (
                           <div key={core.label} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-600">{core.label}</span>
                              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{core.status}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="p-10 bg-indigo-50/50 rounded-[3rem] border border-indigo-100 relative">
                      <div className="absolute -top-4 left-10 bg-indigo-600 text-white text-[9px] font-black px-5 py-2 rounded-full uppercase tracking-widest shadow-lg">Predictive Advice</div>
                      <p className="text-sm font-medium text-indigo-900 leading-relaxed italic">
                        "Student exhibits patterns of non-submission in HL coursework. High likelihood of failure if attendance falls below 60%. Recommended immediate faculty mentor intervention."
                      </p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Mount ---
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
