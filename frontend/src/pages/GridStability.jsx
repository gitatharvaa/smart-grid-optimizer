import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StabilityHeatmap from '../components/StabilityHeatmap';

const GridStability = () => {
    const [filter, setFilter] = useState('ALL');
    const [selectedCell, setSelectedCell] = useState(null);

    // Generate mock heatmap data
    const heatmapData = useMemo(() => {
        const data = [];
        const startDate = new Date('2024-01-01');
        for (let day = 0; day < 90; day++) {
            for (let hour = 0; hour < 24; hour++) {
                const date = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
                date.setHours(hour);
                const isUnstable = (hour >= 17 && hour <= 21) || Math.random() > 0.35;
                data.push({
                    datetime: date.toISOString(),
                    day,
                    hour,
                    date: date.toLocaleDateString(),
                    time: `${hour.toString().padStart(2, '0')}:00`,
                    stability: isUnstable ? 'unstable' : 'stable',
                    confidence: 0.7 + Math.random() * 0.25,
                    c1: (Math.random() - 1.5) * 2,
                    c2: (Math.random() - 1.5) * 2,
                    c3: (Math.random() - 1.5) * 2,
                    p1: Math.random(),
                    p2: Math.random(),
                    p3: Math.random()
                });
            }
        }
        return data;
    }, []);

    const filteredData = useMemo(() => {
        if (filter === 'STABLE_ONLY') return heatmapData.filter(d => d.stability === 'stable');
        if (filter === 'UNSTABLE_ONLY') return heatmapData.filter(d => d.stability === 'unstable');
        if (filter === 'CRITICAL_RISK') return heatmapData.filter(d => d.stability === 'unstable' && d.confidence > 0.85);
        return heatmapData;
    }, [heatmapData, filter]);

    const criticalEvents = useMemo(() => {
        return heatmapData
            .filter(d => d.stability === 'unstable')
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 10);
    }, [heatmapData]);

    return (
        <div>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="font-mono text-2xl font-bold text-dark-text">GRID_STABILITY</h1>
                <div className="text-sm text-gray-500 mt-1">Hour-by-hour stability monitoring</div>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 mb-8">
                {['ALL', 'STABLE_ONLY', 'UNSTABLE_ONLY', 'CRITICAL_RISK'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full font-mono text-xs uppercase transition-all ${filter === f
                                ? 'bg-amber text-white'
                                : 'border-2 border-primary-dark text-primary-dark hover:bg-amber hover:text-white hover:border-amber'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Heatmap Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-card border border-border rounded-xl p-6 mb-8 relative"
            >
                <h3 className="font-mono text-sm uppercase mb-2">
                    STABILITY_MAP // HOUR × DATE MATRIX
                </h3>
                <div className="text-sm text-gray-500 mb-4">
                    Click any cell for detailed breakdown
                </div>
                <StabilityHeatmap data={filteredData} onCellClick={setSelectedCell} />
            </motion.div>

            {/* Detail Panel */}
            <AnimatePresence>
                {selectedCell && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed right-8 top-24 w-80 bg-primary-dark text-white p-6 rounded-xl z-50 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-mono text-sm uppercase">CELL_DETAIL</h4>
                            <button
                                onClick={() => setSelectedCell(null)}
                                className="text-amber text-xl hover:text-amber-hover transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        <div className="font-mono text-xs leading-relaxed space-y-3">
                            <div>
                                <strong>DATETIME:</strong><br />
                                {selectedCell.date}, {selectedCell.time}
                            </div>
                            <div>
                                <strong>STATUS:</strong>{' '}
                                <span style={{ color: selectedCell.stability === 'stable' ? '#22C55E' : '#EF4444' }}>
                                    {selectedCell.stability.toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <strong>CONFIDENCE:</strong> {(selectedCell.confidence * 100).toFixed(0)}%
                            </div>

                            <div className="border-t border-white/20 pt-3">
                                <strong>NODE_DATA:</strong>
                            </div>
                            <div className="text-[0.7rem] text-tag-text">
                                C1: {selectedCell.c1.toFixed(2)} MW | P1: {selectedCell.p1.toFixed(2)}<br />
                                C2: {selectedCell.c2.toFixed(2)} MW | P2: {selectedCell.p2.toFixed(2)}<br />
                                C3: {selectedCell.c3.toFixed(2)} MW | P3: {selectedCell.p3.toFixed(2)}
                            </div>

                            <div className="border-t border-white/20 pt-3">
                                <strong>PRIMARY_CAUSE:</strong>
                                <div className="mt-2 text-gray-300">
                                    {selectedCell.stability === 'unstable'
                                        ? 'High consumption combined with low generation during peak demand period'
                                        : 'Balanced generation-consumption ratio with adequate wind speed'
                                    }
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Monthly Breakdown */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                    { month: 'JANUARY_2024', unstable: 65.1 },
                    { month: 'FEBRUARY_2024', unstable: 66.2 },
                    { month: 'MARCH_2024', unstable: 64.8 }
                ].map((m, idx) => (
                    <motion.div
                        key={m.month}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-bg-card border border-border rounded-xl p-6"
                    >
                        <div className="font-mono text-[0.7rem] text-gray-500 uppercase mb-3">
                            {m.month}
                        </div>
                        <div className="font-mono text-3xl font-bold text-unstable mb-3">
                            {m.unstable.toFixed(1)}% <span className="text-base font-normal text-gray-500">UNSTABLE</span>
                        </div>
                        <div className="h-2 bg-border rounded overflow-hidden">
                            <div
                                className="h-full bg-stable transition-all"
                                style={{ width: `${100 - m.unstable}%` }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Critical Events Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-card border border-border rounded-xl p-6"
            >
                <h3 className="font-mono text-sm uppercase mb-4">
                    CRITICAL_EVENTS // TOP 10 HIGH-RISK HOURS
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full font-mono text-xs">
                        <thead>
                            <tr className="border-b-2 border-amber">
                                <th className="p-3 text-left uppercase">DATE</th>
                                <th className="p-3 text-left uppercase">TIME</th>
                                <th className="p-3 text-left uppercase">RISK_SCORE</th>
                                <th className="p-3 text-left uppercase">CAUSE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {criticalEvents.map((event, idx) => (
                                <tr
                                    key={idx}
                                    className="border-b border-border border-l-4 border-l-unstable cursor-pointer hover:bg-bg-cream transition-colors"
                                    onClick={() => setSelectedCell(event)}
                                >
                                    <td className="p-3">{event.date}</td>
                                    <td className="p-3">{event.time}</td>
                                    <td className="p-3 text-unstable">
                                        {(event.confidence * 100).toFixed(0)}%
                                    </td>
                                    <td className="p-3 text-gray-500">
                                        {event.hour >= 17 && event.hour <= 21
                                            ? 'Peak demand period'
                                            : 'Low generation output'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Node Balance Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-card border border-border rounded-xl p-6 mt-8"
            >
                <h3 className="font-mono text-sm uppercase mb-4">
                    NODE_BALANCE // SUPPLY vs DEMAND
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                        { node: 'Node 1', generation: 12, consumption: 14 },
                        { node: 'Node 2', generation: 27, consumption: 29 },
                        { node: 'Node 3', generation: 21, consumption: 17 }
                    ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#D4D0C4" />
                        <XAxis dataKey="node" stroke="#6B7569" />
                        <YAxis stroke="#6B7569" label={{ value: 'MW', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="generation" fill="#C9A227" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="consumption" fill="#1C2E1C" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>
        </div>
    );
};

export default GridStability;
