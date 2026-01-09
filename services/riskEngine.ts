
import { Student, RiskWeights, RiskLevel, SubjectGrade } from '../types.ts';

export const calculateRiskScore = (student: Student, weights: RiskWeights): number => {
  // 1. Attendance Risk
  const attRisk = Math.max(0, (95 - student.attendanceRate) / 15) * 100;
  const weightedAtt = (Math.min(100, attRisk) * weights.attendance) / 100;

  // 2. Academic Risk (Summative vs IA)
  const summativeGrades = student.grades.filter(g => g.type === 'Summative');
  const iaGrades = student.grades.filter(g => g.type === 'IA');

  const calcGradeRisk = (grades: SubjectGrade[]) => {
    if (grades.length === 0) return 50; // Neutral if no data
    const avg = grades.reduce((acc, g) => acc + g.grade, 0) / grades.length;
    return ((7 - avg) / 6) * 100;
  };

  const weightedAcad = (calcGradeRisk(summativeGrades) * weights.academics) / 100;
  const weightedIAs = (calcGradeRisk(iaGrades) * weights.ias) / 100;

  // 3. Core Risk
  let eeRisk = 0;
  switch (student.core.ee) {
    case 'Not Started': eeRisk = 100; break;
    case 'Outline': eeRisk = 75; break;
    case 'First Draft': eeRisk = 40; break;
    case 'Final': eeRisk = 10; break;
    case 'Submitted': eeRisk = 0; break;
  }
  const weightedEE = (eeRisk * weights.coreEE) / 100;

  let tokRisk = 0;
  switch (student.core.tok) {
    case 'Developing': tokRisk = 80; break;
    case 'Draft': tokRisk = 40; break;
    case 'Final': tokRisk = 0; break;
  }
  const weightedToK = (tokRisk * weights.coreToK) / 100;

  let casRisk = 0;
  switch (student.core.cas) {
    case 'Behind': casRisk = 100; break;
    case 'On Track': casRisk = 20; break;
    case 'Completed': casRisk = 0; break;
  }
  const weightedCAS = (casRisk * weights.coreCAS) / 100;

  const total = weightedAtt + weightedAcad + weightedIAs + weightedEE + weightedToK + weightedCAS;
  return Math.round(Math.min(100, total));
};

export const getRiskLevel = (score: number, weights: RiskWeights): RiskLevel => {
  if (score >= weights.thresholdHigh) return RiskLevel.HIGH;
  if (score >= weights.thresholdMedium) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
};