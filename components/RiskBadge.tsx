
import React from 'react';
import { RiskLevel } from '../types.ts';

interface RiskBadgeProps {
  level: RiskLevel;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  const styles = {
    [RiskLevel.LOW]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [RiskLevel.MEDIUM]: 'bg-amber-100 text-amber-700 border-amber-200',
    [RiskLevel.HIGH]: 'bg-rose-100 text-rose-700 border-rose-200',
    [RiskLevel.CRITICAL]: 'bg-red-200 text-red-800 border-red-300 font-bold animate-pulse'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[level]}`}>
      {level}
    </span>
  );
};