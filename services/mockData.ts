
import { Student, RiskLevel } from '../types.ts';

export const MOCK_STUDENTS: Student[] = [
  {
    id: "MB1001",
    name: "Alex Thompson",
    yearGroup: 13,
    attendanceRate: 72.5,
    grades: [
      { subject: "Math AA HL", grade: 2, type: 'IA', isSummative: true, date: "2024-03-01" },
      { subject: "Physics HL", grade: 3, type: 'Summative', isSummative: true, date: "2024-02-15" },
      { subject: "English L&L SL", grade: 5, type: 'Summative', isSummative: true, date: "2024-03-05" }
    ],
    core: { ee: "Outline", tok: "Developing", cas: "Behind" },
    riskScore: 82,
    riskLevel: RiskLevel.HIGH,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "MB1002",
    name: "Sarah Jenkins",
    yearGroup: 13,
    attendanceRate: 98.2,
    grades: [
      { subject: "History HL", grade: 6, type: 'IA', isSummative: true, date: "2024-03-01" },
      { subject: "Economics HL", grade: 7, type: 'Summative', isSummative: true, date: "2024-02-15" },
      { subject: "French B SL", grade: 6, type: 'IA', isSummative: true, date: "2024-03-05" }
    ],
    core: { ee: "Final", tok: "Final", cas: "On Track" },
    riskScore: 12,
    riskLevel: RiskLevel.LOW,
    lastUpdated: new Date().toISOString()
  }
];