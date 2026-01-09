
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export type AssessmentType = 'Summative' | 'IA' | 'Formative';

export interface SubjectGrade {
  subject: string;
  grade: number; // 1-7
  type: AssessmentType;
  isSummative: boolean;
  date: string;
}

export interface CoreStatus {
  ee: 'Not Started' | 'Outline' | 'First Draft' | 'Final' | 'Submitted';
  tok: 'Developing' | 'Draft' | 'Final';
  cas: 'Behind' | 'On Track' | 'Completed';
}

export interface Student {
  id: string;
  name: string;
  yearGroup: 12 | 13; // DP1 or DP2
  attendanceRate: number; // 0-100
  grades: SubjectGrade[];
  core: CoreStatus;
  riskScore: number; // Calculated 0-100
  riskLevel: RiskLevel;
  lastUpdated: string;
}

export interface RiskWeights {
  attendance: number;
  academics: number;
  ias: number; // New: Internal Assessment weight
  coreEE: number;
  coreToK: number;
  coreCAS: number;
  thresholdMedium: number;
  thresholdHigh: number;
}

export interface BackendConfig {
  mbApiKey: string;
  mbDomain: string;
  gDriveRawFolder: string;
  gDriveReportFolder: string;
  syncFrequency: 'daily' | 'thrice-weekly' | 'weekly';
  lastSync: string;
}
