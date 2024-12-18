import type React from 'react';

interface ProgressProps {
  text?: string;
  percentage?: number;
}

export const Progress: React.FC<ProgressProps> = ({ text, percentage }) => {
  return (
    <div className="w-full max-w-full">
      {text && <div className="mb-1 text-sm text-gray-600">{text}</div>}
      <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-2.5 rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${Math.round((percentage || 0) * 100)}%` }}
        />
      </div>
    </div>
  );
};
export default Progress;
