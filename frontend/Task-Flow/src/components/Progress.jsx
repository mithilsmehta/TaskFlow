import React from "react";

const Progress = ({ progress, status }) => {
    const getColor = () => {
        switch (status) {
            case 'In Progress':
                return 'bg-cyan-500';
            case 'Completed':
                return 'bg-green-500';
            default:
                return 'bg-violet-500';
        }
    };

    // Ensure progress is a number between 0 and 100
    const safeProgress = Math.min(100, Math.max(0, Number(progress) || 0));

    return (
        <div className="w-full">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{safeProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                    className={`h-full rounded-full ${getColor()} transition-all duration-300 ease-out`}
                    style={{ width: `${safeProgress}%` }}
                    role="progressbar"
                    aria-valuenow={safeProgress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                />
            </div>
        </div>
    );
};

export default Progress;
