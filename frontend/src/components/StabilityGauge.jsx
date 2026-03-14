import React, { useState, useEffect } from 'react';

const StabilityGauge = ({ value = 65, label = "INSTABILITY_INDEX" }) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedValue(value), 100);
        return () => clearTimeout(timer);
    }, [value]);

    const rotation = (animatedValue / 100) * 180 - 90;

    return (
        <div className="w-full max-w-[280px] mx-auto">
            <svg width="280" height="160" viewBox="0 0 280 160" className="w-full">
                {/* Arc zones */}
                <path
                    d="M 40 140 A 100 100 0 0 1 100 40"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="20"
                    opacity="0.3"
                />
                <path
                    d="M 100 40 A 100 100 0 0 1 180 40"
                    fill="none"
                    stroke="#EAB308"
                    strokeWidth="20"
                    opacity="0.3"
                />
                <path
                    d="M 180 40 A 100 100 0 0 1 240 140"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="20"
                    opacity="0.3"
                />

                {/* Needle */}
                <line
                    x1="140"
                    y1="140"
                    x2="140"
                    y2="50"
                    stroke="#1A2E1A"
                    strokeWidth="3"
                    strokeLinecap="round"
                    style={{
                        transformOrigin: '140px 140px',
                        transform: `rotate(${rotation}deg)`,
                        transition: 'transform 1s ease-out'
                    }}
                />
                <circle cx="140" cy="140" r="6" fill="#C9A227" />
            </svg>

            <div className="text-center mt-4">
                <div className="font-mono text-2xl font-bold text-dark-text">
                    {animatedValue.toFixed(0)}%
                </div>
                <div className="font-mono text-[0.7rem] uppercase text-gray-500 tracking-wider">
                    {label}
                </div>
            </div>
        </div>
    );
};

export default StabilityGauge;
