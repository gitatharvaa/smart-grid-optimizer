import React, { useState } from 'react';

const PowerFlowAnimation = ({
    node1Status = 'stable',
    node2Status = 'unstable',
    node3Status = 'stable',
    powerGen1 = 12,
    powerGen2 = 27,
    powerGen3 = 21
}) => {
    const [tooltipData, setTooltipData] = useState(null);

    const nodes = [
        { id: 'center', x: 250, y: 200, r: 30, label: 'GEN\nNODE', color: '#C9A227', power: 60 },
        { id: 'node1', x: 250, y: 80, r: 22.5, label: 'NODE_1\n20%', status: node1Status, power: powerGen1 },
        { id: 'node2', x: 150, y: 320, r: 22.5, label: 'NODE_2\n45%', status: node2Status, power: powerGen2 },
        { id: 'node3', x: 350, y: 320, r: 22.5, label: 'NODE_3\n35%', status: node3Status, power: powerGen3 }
    ];

    const getStatusColor = (status) => status === 'stable' ? '#22C55E' : '#EF4444';

    return (
        <div className="relative w-full max-w-[500px] h-[400px] mx-auto">
            <svg width="500" height="400" className="w-full h-full">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Connections */}
                {[1, 2, 3].map(i => (
                    <line
                        key={`line-${i}`}
                        x1={nodes[0].x}
                        y1={nodes[0].y}
                        x2={nodes[i].x}
                        y2={nodes[i].y}
                        stroke="#D4D0C4"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                    >
                        <animate
                            attributeName="stroke-dashoffset"
                            from="0"
                            to="10"
                            dur="1s"
                            repeatCount="indefinite"
                        />
                    </line>
                ))}

                {/* Animated dots */}
                {[1, 2, 3].map(i => {
                    return [0, 0.33, 0.67].map(offset => (
                        <circle
                            key={`dot-${i}-${offset}`}
                            r="3"
                            fill="#C9A227"
                        >
                            <animateMotion
                                dur={`${2 / (nodes[i].power / 15)}s`}
                                repeatCount="indefinite"
                                begin={`${offset * 2}s`}
                                path={`M ${nodes[0].x} ${nodes[0].y} L ${nodes[i].x} ${nodes[i].y}`}
                            />
                        </circle>
                    ));
                })}

                {/* Center node */}
                <g>
                    <circle
                        cx={nodes[0].x}
                        cy={nodes[0].y}
                        r={nodes[0].r}
                        fill={nodes[0].color}
                        filter="url(#glow)"
                    >
                        <animate
                            attributeName="r"
                            values={`${nodes[0].r};${nodes[0].r + 2};${nodes[0].r}`}
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    <text
                        x={nodes[0].x}
                        y={nodes[0].y}
                        textAnchor="middle"
                        fill="white"
                        fontFamily="JetBrains Mono"
                        fontSize="11"
                        fontWeight="700"
                    >
                        <tspan x={nodes[0].x} dy="-5">GEN</tspan>
                        <tspan x={nodes[0].x} dy="12">NODE</tspan>
                    </text>
                </g>

                {/* Distribution nodes */}
                {[1, 2, 3].map(i => (
                    <g
                        key={`node-${i}`}
                        onMouseEnter={() => setTooltipData({
                            node: i,
                            power: nodes[i].power,
                            status: nodes[i].status
                        })}
                        onMouseLeave={() => setTooltipData(null)}
                        className="cursor-pointer"
                    >
                        <circle
                            cx={nodes[i].x}
                            cy={nodes[i].y}
                            r={nodes[i].r}
                            fill={getStatusColor(nodes[i].status)}
                            opacity="0.9"
                        />
                        <text
                            x={nodes[i].x}
                            y={nodes[i].y}
                            textAnchor="middle"
                            fill="white"
                            fontFamily="JetBrains Mono"
                            fontSize="9"
                            fontWeight="700"
                        >
                            <tspan x={nodes[i].x} dy="-5">{`NODE_${i}`}</tspan>
                            <tspan x={nodes[i].x} dy="11">{nodes[i].label.split('\n')[1]}</tspan>
                        </text>
                    </g>
                ))}
            </svg>

            {tooltipData && (
                <div className="absolute top-2 right-2 bg-primary-dark text-white p-3 rounded-lg font-mono text-xs z-10">
                    <div>Power: {tooltipData.power.toFixed(1)} MW</div>
                    <div style={{ color: getStatusColor(tooltipData.status) }}>
                        Status: {tooltipData.status.toUpperCase()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PowerFlowAnimation;
