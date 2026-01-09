
import { GoogleGenAI, Type } from "@google/genai";
import { Student } from "../types.ts";

// Initializing GoogleGenAI with process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStudentRiskSummary = async (student: Student) => {
  const prompt = `
    As an IB DP Coordinator, summarize the risk factors for this student:
    Name: ${student.name}
    Attendance: ${student.attendanceRate}%
    Recent Grades: ${student.grades.map(g => `${g.subject}: ${g.grade}`).join(', ')}
    EE Status: ${student.core.ee}
    ToK Status: ${student.core.tok}
    CAS Status: ${student.core.cas}
    Risk Score: ${student.riskScore}/100
    
    Provide a professional, concise 2-sentence summary of why they are at risk and one actionable step for the coordinator.
  `;

  try {
    // Calling generateContent with model name and prompt directly as per guidelines
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    // Accessing .text as a property, not a method, as per guidelines
    return response.text || "Summary generation failed.";
  } catch (err) {
    console.error(err);
    return "Failed to generate AI summary.";
  }
};

export const generateBatchReport = async (students: Student[]) => {
  const highRisk = students.filter(s => s.riskLevel === 'HIGH');
  
  const prompt = `
    Analyze this list of high-risk IB students and create a summary report for the weekly meeting.
    Students: ${highRisk.map(s => `${s.name} (Risk ${s.riskScore})`).join(', ')}
    
    Provide:
    1. Overall trend (improving/declining).
    2. Primary common factor (e.g. attendance vs core).
    3. Suggested agenda item for the next faculty meeting.
  `;

  try {
    // Calling generateContent with model name and prompt directly as per guidelines
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    // Accessing .text as a property, not a method, as per guidelines
    return response.text;
  } catch (err) {
    return "Batch report generation failed.";
  }
};
