import React, { useState } from 'react';

const StabilityHeatmap = ({ data, onCellClick }) => {
    const [tooltip, setTooltip] = useState(null);

    const cellWidth = 10;
    const cellHeight = 20;

    return (
        <div className="relative overflow-x-auto">
            <svg width={cellWidth * 90} height={cellHeight * 24 + 60}>
                {/* Hour labels */}
                {[0, 4, 8, 12, 16, 20].map(hour => (
                    <text
                        key={`hour-${hour}`}
                        x="-10"
                        y={hour * cellHeight + cellHeight / 2 + 40}
                        textAnchor="end"
                        fontSize="10"
                        fontFamily="JetBrains Mono"
                        fill="#6B7569"
                    >
                        {hour.toString().padStart(2, '0')}:00
                    </text>
                ))}

                {/* Day labels */}
                {[0, 15, 30, 45, 60, 75].map(day => (
                    <text
                        key={`day-${day}`}
                        x={day * cellWidth + cellWidth / 2}
                        y="20"
                        textAnchor="middle"
                        fontSize="10"
                        fontFamily="JetBrains Mono"
                        fill="#6B7569"
                    >
                        {new Date(2024, 0, day + 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </text>
                ))}

                {/* Heatmap cells */}
                <g transform="translate(0, 30)">
                    {data.map((cell, idx) => {
                        const color = cell.stability === 'stable' ? '#22C55E' : '#EF4444';
                        const opacity = cell.confidence;
                        return (
                            <rect
                                key={idx}
                                x={cell.day * cellWidth}
                                y={cell.hour * cellHeight}
                                width={cellWidth - 1}
                                height={cellHeight - 1}
                                fill={color}
                                opacity={opacity}
                                className="cursor-pointer"
                                onMouseEnter={(e) => {
                                    const rect = e.target.getBoundingClientRect();
                                    setTooltip({
                                        x: rect.left + cellWidth / 2,
                                        y: rect.top,
                                        data: cell
                                    });
                                }}
                                onMouseLeave={() => setTooltip(null)}
                                onClick={() => onCellClick && onCellClick(cell)}
                            />
                        );
                    })}
                </g>
            </svg>

            {tooltip && (
                <div
                    className="fixed bg-primary-dark text-white p-2 rounded font-mono text-xs z-[1000] pointer-events-none whitespace-nowrap"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y - 60,
                        transform: 'translateX(-50%)'
                    }}
                >
                    <div>{tooltip.data.date}, {tooltip.data.time}</div>
                    <div style={{ color: tooltip.data.stability === 'stable' ? '#22C55E' : '#EF4444' }}>
                        {tooltip.data.stability.toUpperCase()}
                    </div>
                    <div>{(tooltip.data.confidence * 100).toFixed(0)}% confidence</div>
                </div>
            )}
        </div>
    );
};

export default StabilityHeatmap;
