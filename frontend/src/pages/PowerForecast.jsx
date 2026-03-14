import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import SHAPChart from '../components/SHAPChart';

const PowerForecast = () => {
    const [monthFilter, setMonthFilter] = useState('ALL Q1');
    const [showActual, setShowActual] = useState(true);

    // Generate mock hourly data
    const hourlyData = useMemo(() => {
        const data = [];
        const startDate = new Date('2024-01-01');
        for (let i = 0; i < 90 * 24; i += 3) {
            const date = new Date(startDate.getTime() + i * 60 * 60 * 1000);
            const hour = date.getHours();
            const windSpeed = Math.max(0, 7 + Math.sin(hour / 3.8) * 5 + (Math.random() - 0.5) * 8);
            const power = windSpeed < 3 ? 0 : Math.pow(windSpeed / 12, 3) * 60 + (Math.random() - 0.5) * 5;
            const predicted = Math.max(0, power + (Math.random() - 0.5) * 4);

            data.push({
                date: date.toLocaleDateString(),
                time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                predicted: predicted,
                actual: Math.max(0, power),
                upper: predicted + predicted * 0.15,
                lower: Math.max(0, predicted - predicted * 0.15)
            });
        }
        return data;
    }, []);

    return (
        <div>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="font-mono text-2xl font-bold text-dark-text">POWER_FORECAST</h1>
                <div className="text-sm text-gray-500 mt-1">ML-powered generation predictions</div>
            </div>

            {/* Month Filter */}
            <div className="flex gap-2 mb-8">
                {['ALL Q1', 'JAN', 'FEB', 'MAR'].map(filter => (
                    <button
                        key={filter}
                        onClick={() => setMonthFilter(filter)}
                        className={`px-4 py-2 rounded-full font-mono text-xs uppercase transition-all ${monthFilter === filter
                                ? 'bg-amber text-white'
                                : 'border-2 border-primary-dark text-primary-dark hover:bg-amber hover:text-white hover:border-amber'
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Main Forecast Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-card border border-border rounded-xl p-6 mb-8"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-mono text-sm uppercase">
                        PREDICTED vs ACTUAL POWER OUTPUT
                    </h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showActual}
                            onChange={(e) => setShowActual(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span className="font-mono text-xs">SHOW ACTUAL</span>
                    </label>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#D4D0C4" />
                        <XAxis dataKey="date" stroke="#6B7569" style={{ fontSize: '0.7rem' }} />
                        <YAxis stroke="#6B7569" label={{ value: 'MW', angle: -90, position: 'insideLeft' }} />
                        <Tooltip
                            contentStyle={{ background: '#F5F3EC', border: '1px solid #D4D0C4', borderRadius: '8px' }}
                            formatter={(value, name) => {
                                if (name === 'predicted') return [value.toFixed(2) + ' MW', 'Predicted'];
                                if (name === 'actual') return [value.toFixed(2) + ' MW', 'Actual'];
                                return [value.toFixed(2), name];
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="upper"
                            stroke="none"
                            fill="#C9A227"
                            fillOpacity={0.2}
                            stackId="confidence"
                        />
                        <Area
                            type="monotone"
                            dataKey="predicted"
                            stroke="#C9A227"
                            fill="#C9A227"
                            fillOpacity={0.4}
                            strokeWidth={2}
                        />
                        {showActual && (
                            <Line
                                type="monotone"
                                dataKey="actual"
                                stroke="#1C2E1C"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Model Performance Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'RMSE', value: '3.91', unit: 'MW', desc: 'Root Mean Square Error' },
                    { label: 'R² SCORE', value: '0.90', unit: '', desc: 'Variance Explained' },
                    { label: 'vs BASELINE', value: '+57', unit: '%', desc: 'vs Persistence Model' }
                ].map((metric, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-bg-card border border-border rounded-xl p-6 border-l-4 border-l-amber"
                    >
                        <div className="font-mono text-[0.7rem] text-gray-500 uppercase mb-3">
                            {metric.label}
                        </div>
                        <div className="font-mono text-3xl font-bold text-dark-text mb-2">
                            {metric.value} <span className="text-base font-normal text-gray-500">{metric.unit}</span>
                        </div>
                        <div className="text-sm text-gray-500">{metric.desc}</div>
                    </motion.div>
                ))}
            </div>

            {/* SHAP Chart and Zero Power Analysis */}
            <div className="grid grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-bg-card border border-border rounded-xl p-6"
                >
                    <SHAPChart />
                    <div className="text-sm text-gray-500 mt-4 italic">
                        Each bar shows how much that feature contributes to power predictions on average
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-bg-card border border-border rounded-xl p-6"
                >
                    <h3 className="font-mono text-sm uppercase mb-4">
                        ZERO_POWER_ANALYSIS
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Generating', value: 74.7 },
                                    { name: 'Zero Output', value: 25.3 }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            >
                                <Cell fill="#C9A227" />
                                <Cell fill="#D4D0C4" />
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="text-sm text-gray-500 mt-4 text-center">
                        25.3% of hours: zero generation due to insufficient wind speed (&lt;3 m/s)
                    </div>
                </motion.div>
            </div>

            {/* Export Button */}
            <div className="mt-6 text-right">
                <button
                    onClick={() => window.print()}
                    className="px-6 py-3 bg-amber text-white rounded-full font-mono text-xs uppercase tracking-wider hover:bg-amber-hover transition-all"
                >
                    ↓ EXPORT_CHART
                </button>
            </div>
        </div>
    );
};

export default PowerForecast;
