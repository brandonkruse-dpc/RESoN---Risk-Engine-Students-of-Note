
import React from 'react';

interface WeightSliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  max?: number;
}

export const WeightSlider: React.FC<WeightSliderProps> = ({ label, value, onChange, max = 100 }) => {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <div className="flex justify-between items-center text-sm font-medium text-slate-600">
        <span>{label}</span>
        <span className="mono text-indigo-600 font-bold">{value}%</span>
      </div>
      <input 
        type="range" 
        min="0" 
        max={max} 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
    </div>
  );
};
