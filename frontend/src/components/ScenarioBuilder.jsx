import React, { useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const availableBlocks = [
    { id: 'high-wind', icon: '🌬️', label: 'HIGH WIND', color: 'bg-amber', textColor: 'text-white', wind_speed: 14 },
    { id: 'moderate-wind', icon: '🍃', label: 'MODERATE WIND', color: 'bg-green-200', textColor: 'text-green-800', wind_speed: 8 },
    { id: 'low-wind', icon: '😴', label: 'LOW WIND', color: 'bg-gray-200', textColor: 'text-gray-700', wind_speed: 2 },
    { id: 'hot-day', icon: '☀️', label: 'HOT DAY', color: 'bg-orange-200', textColor: 'text-orange-800', temperature: 35 },
    { id: 'cold-day', icon: '❄️', label: 'COLD DAY', color: 'bg-blue-200', textColor: 'text-blue-800', temperature: 5 }
];

const ScenarioBuilder = ({ onSimulate }) => {
    const [timeline, setTimeline] = useState(Array(24).fill(null));
    const [selected, setSelected] = useState(null);
    const [resultData, setResultData] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);

    const handleBlockClick = (block) => {
        // Toggle selection — click same block again to deselect
        setSelected(prev => prev?.id === block.id ? null : block);
    };

    const handleSlotClick = (index) => {
        if (!selected) return;
        const newTimeline = [...timeline];
        // If slot already has this block, clear it; otherwise place block
        newTimeline[index] = timeline[index]?.id === selected.id ? null : selected;
        setTimeline(newTimeline);
    };

    const handleClearSlot = (e, index) => {
        // Right click or double click to remove single slot
        e.preventDefault();
        const newTimeline = [...timeline];
        newTimeline[index] = null;
        setTimeline(newTimeline);
    };

    const handleSimulate = async () => {
        setIsSimulating(true);
        const config = timeline.map((block, hour) => ({
            hour,
            wind_speed: block?.wind_speed ?? 7,
            temperature: block?.temperature ?? 15
        }));
        try {
            await onSimulate(config);
            const mockData = config.map((c, idx) => ({
                hour: idx,
                power: c.wind_speed < 3
                    ? 0
                    : Math.pow(c.wind_speed / 12, 3) * 60
            }));
            setResultData(mockData);
        } catch (err) {
            console.error('Simulation error:', err);
        } finally {
            setIsSimulating(false);
        }
    };

    const handleClearAll = () => {
        setTimeline(Array(24).fill(null));
        setResultData(null);
        setSelected(null);
    };

    const hasBlocks = timeline.some(Boolean);

    return (
        <div className="space-y-6">

            {/* ── Available Blocks ── */}
            <div>
                <h3 className="font-mono text-sm uppercase mb-3 text-dark-text">
                    AVAILABLE_BLOCKS
                    {selected && (
                        <span className="ml-3 text-amber normal-case text-xs">
                            ← now click any hour slot
                        </span>
                    )}
                </h3>

                <div className="flex gap-2 flex-wrap">
                    {availableBlocks.map((block) => (
                        <button
                            key={block.id}
                            onClick={() => handleBlockClick(block)}
                            className={`
                                ${block.color} ${block.textColor}
                                px-4 py-2 rounded-lg font-mono text-xs uppercase
                                flex items-center gap-2 transition-all duration-200
                                ${selected?.id === block.id
                                    ? 'ring-4 ring-amber ring-offset-2 scale-105 shadow-lg'
                                    : 'hover:scale-105 hover:shadow-md opacity-80 hover:opacity-100'
                                }
                            `}
                        >
                            <span>{block.icon}</span>
                            <span>{block.label}</span>
                            {selected?.id === block.id && (
                                <span className="ml-1">✓</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Instruction hint */}
                <p className="font-mono text-[0.65rem] text-gray-400 mt-2 uppercase tracking-wide">
                    {selected
                        ? `"${selected.label}" selected — click slots to place · right-click slot to remove`
                        : 'Click a block to select it · then click hour slots to place it'
                    }
                </p>
            </div>

            {/* ── 24-Hour Timeline ── */}
            <div>
                <h3 className="font-mono text-sm uppercase mb-3 text-dark-text">
                    24_HOUR_TIMELINE
                </h3>

                <div className="grid grid-cols-12 gap-1.5">
                    {timeline.map((block, index) => (
                        <div
                            key={index}
                            onClick={() => handleSlotClick(index)}
                            onContextMenu={(e) => handleClearSlot(e, index)}
                            title={block
                                ? `${index.toString().padStart(2, '0')}:00 — ${block.label} (right-click to remove)`
                                : selected
                                    ? `Click to place ${selected.label} at ${index.toString().padStart(2, '0')}:00`
                                    : `${index.toString().padStart(2, '0')}:00 — empty`
                            }
                            className={`
                                h-16 rounded border-2 transition-all duration-150
                                flex flex-col items-center justify-center
                                select-none
                                ${block
                                    ? `${block.color} border-transparent shadow-sm`
                                    : selected
                                        ? 'border-dashed border-amber bg-amber/5 cursor-pointer hover:bg-amber/20 hover:border-amber'
                                        : 'border-dashed border-border bg-bg-card hover:border-gray-400'
                                }
                                ${selected && !block ? 'cursor-pointer' : ''}
                                ${block ? 'cursor-context-menu' : ''}
                            `}
                        >
                            <div className="text-[0.55rem] text-gray-500 font-mono leading-none mb-0.5">
                                {index.toString().padStart(2, '0')}:00
                            </div>
                            {block
                                ? <div className="text-base leading-none">{block.icon}</div>
                                : selected
                                    ? <div className="text-[0.6rem] text-amber font-mono">+</div>
                                    : null
                            }
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-2 font-mono text-[0.6rem] text-gray-400 uppercase">
                    <span>Left click → place selected block</span>
                    <span>·</span>
                    <span>Right click → remove block</span>
                    <span>·</span>
                    <span>{timeline.filter(Boolean).length}/24 slots filled</span>
                </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex gap-3">
                <button
                    onClick={handleSimulate}
                    disabled={!hasBlocks || isSimulating}
                    className="px-6 py-3 bg-amber text-white rounded-full font-mono text-xs uppercase tracking-wider hover:bg-amber-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    {isSimulating ? 'SIMULATING...' : 'SIMULATE FULL DAY'}
                </button>
                <button
                    onClick={handleClearAll}
                    className="px-6 py-3 bg-transparent border-2 border-primary-dark text-primary-dark rounded-full font-mono text-xs uppercase tracking-wider hover:bg-primary-dark hover:text-white transition-all"
                >
                    CLEAR ALL
                </button>
            </div>

            {/* ── Simulation Results ── */}
            {resultData && (
                <div className="bg-bg-card p-6 rounded-xl">
                    <h3 className="font-mono text-sm uppercase mb-4 text-dark-text">
                        SIMULATION_RESULTS // 24H POWER FORECAST
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={resultData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#D4D0C4" />
                            <XAxis
                                dataKey="hour"
                                stroke="#6B7569"
                                tickFormatter={(h) => `${h}:00`}
                                style={{ fontSize: '0.65rem' }}
                            />
                            <YAxis
                                stroke="#6B7569"
                                label={{ value: 'MW', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#F5F3EC',
                                    border: '1px solid #D4D0C4',
                                    borderRadius: '8px',
                                    fontFamily: 'monospace'
                                }}
                                formatter={(val) => [`${val.toFixed(1)} MW`, 'Power']}
                                labelFormatter={(h) => `Hour ${h}:00`}
                            />
                            <Line
                                type="monotone"
                                dataKey="power"
                                stroke="#C9A227"
                                strokeWidth={2}
                                dot={{ fill: '#C9A227', r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default ScenarioBuilder;