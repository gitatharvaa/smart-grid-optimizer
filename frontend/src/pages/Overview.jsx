import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import KPICard from '../components/KPICard';
import PowerFlowAnimation from '../components/PowerFlowAnimation';
import WindParticles from '../components/WindParticles';
import { getInsightsSummary } from '../api/axios';

const Overview = () => {
    const [dateFilter, setDateFilter] = useState('ALL Q1');
    const [kpiData, setKpiData] = useState(null);

    useEffect(() => {
        getInsightsSummary()
            .then(response => {
                const d = response.data;
                setKpiData({
                    total_generation: d.total_predicted_power_mw,
                    stability_rate: d.stable_percentage,
                    peak_generation: d.avg_hourly_power_mw.toFixed(1),
                    peak_hour: `${String(d.peak_instability_hour).padStart(2, '0')}:00`,
                    critical_hours: Math.round(
                        (d.unstable_percentage / 100) * 2184
                    )
                });
            })
            .catch(() => {
                setKpiData({
                    total_generation: 18432,
                    stability_rate: 34.94,
                    peak_generation: 20.57,
                    peak_hour: "19:00",
                    critical_hours: 847
                });
            });
    }, []);

    // Generate mock hourly data
    const hourlyData = useMemo(() => {
        const data = [];
        const startDate = new Date('2024-01-01');
        for (let i = 0; i < 90 * 24; i += 6) {
            const date = new Date(startDate.getTime() + i * 60 * 60 * 1000);
            const hour = date.getHours();
            const windSpeed = Math.max(0, 7 + Math.sin(hour / 3.8) * 5 + (Math.random() - 0.5) * 8);
            const power = windSpeed < 3 ? 0 : Math.pow(windSpeed / 12, 3) * 60 + (Math.random() - 0.5) * 5;
            data.push({
                date: date.toLocaleDateString(),
                power: Math.max(0, power)
            });
        }
        return data;
    }, []);

    return (
        <div className="relative">
            <WindParticles />

            <div className="relative z-10">
                {/* Page Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="font-mono text-2xl font-bold text-dark-text">GRID_OS // OVERVIEW</h1>
                        <div className="text-sm text-gray-500 mt-1">Real-time grid performance monitoring</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2">
                            {['ALL Q1', 'JAN', 'FEB', 'MAR'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setDateFilter(filter)}
                                    className={`px-4 py-2 rounded-full font-mono text-xs uppercase transition-all ${dateFilter === filter
                                        ? 'bg-amber text-white'
                                        : 'border-2 border-primary-dark text-primary-dark hover:bg-amber hover:text-white hover:border-amber'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-tag-bg">
                            <span className="text-stable text-xs">●</span>
                            <span className="font-mono text-tag-text text-xs uppercase tracking-wider">
                                SYS_OPERATIONAL
                            </span>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                {kpiData ? (
                    <div className="grid grid-cols-4 gap-6 mb-8">
                        <KPICard
                            icon="⚡"
                            label="TOTAL_GENERATION"
                            value={kpiData.total_generation}
                            unit="MW"
                            accentColor="#C9A227"
                        />
                        <KPICard
                            icon="🛡️"
                            label="STABILITY_RATE"
                            value={kpiData.stability_rate}
                            unit="%"
                            accentColor={kpiData.stability_rate > 50 ? '#22C55E' : '#EF4444'}
                            trend="↓ 0.3%"
                        />
                        <KPICard
                            icon="📊"
                            label="PEAK_GENERATION"
                            value={`${kpiData.peak_generation} @ ${kpiData.peak_hour}`}
                            unit="MW"
                            accentColor="#C9A227"
                        />
                        <KPICard
                            icon="⚠️"
                            label="CRITICAL_HOURS"
                            value={kpiData.critical_hours}
                            unit=""
                            accentColor="#EF4444"
                            trend="↑ 12"
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-6 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="loading-skeleton h-32" />
                        ))}
                    </div>
                )}

                {/* Power Flow */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-bg-card border border-border rounded-xl p-6 mb-8"
                >
                    <h3 className="font-mono text-base uppercase mb-2">
                        POWER_FLOW // REAL-TIME DISTRIBUTION
                    </h3>
                    <div className="text-sm text-gray-500 mb-6">
                        4-Node Star Architecture — Generation to Consumption
                    </div>
                    <PowerFlowAnimation />
                </motion.div>

                {/* Charts Row */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-bg-card border border-border rounded-xl p-6"
                    >
                        <h3 className="font-mono text-sm uppercase mb-4">
                            GENERATION_TIMELINE // Q1 2024
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={hourlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#D4D0C4" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#6B7569"
                                    style={{ fontSize: '0.7rem' }}
                                />
                                <YAxis
                                    stroke="#6B7569"
                                    label={{ value: 'MW', angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#F5F3EC',
                                        border: '1px solid #D4D0C4',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="power"
                                    stroke="#C9A227"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-bg-card border border-border rounded-xl p-6"
                    >
                        <h3 className="font-mono text-sm uppercase mb-4">
                            NODE_DISTRIBUTION
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'NODE_1', value: 20 },
                                        { name: 'NODE_2', value: 45 },
                                        { name: 'NODE_3', value: 35 }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    dataKey="value"
                                >
                                    {[0, 1, 2].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#C9A227', '#1C2E1C', '#7BAE7B'][index]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="text-center font-mono text-xl font-bold -mt-16">
                            60 MW<br />
                            <span className="text-xs text-gray-500">TOTAL</span>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-2 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-bg-card border border-border rounded-xl p-6"
                    >
                        <h3 className="font-mono text-sm uppercase mb-4">
                            STABILITY_BY_MONTH
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={[
                                { month: 'January', stable: 35, unstable: 65 },
                                { month: 'February', stable: 34, unstable: 66 },
                                { month: 'March', stable: 35, unstable: 65 }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#D4D0C4" />
                                <XAxis dataKey="month" stroke="#6B7569" />
                                <YAxis stroke="#6B7569" />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="stable" fill="#22C55E" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="unstable" fill="#EF4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-bg-card border border-border rounded-xl p-6"
                    >
                        <h3 className="font-mono text-sm uppercase mb-4">
                            KEY_METRICS
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'AVG_WIND_SPEED', value: '6.96 m/s' },
                                { label: 'PEAK_INSTABILITY', value: '19:00 hrs' },
                                { label: 'CAPACITY_FACTOR', value: '34.3%' },
                                { label: 'MOST_STABLE', value: 'February' }
                            ].map((metric, idx) => (
                                <div key={idx} className="p-4 bg-bg-cream rounded-lg">
                                    <div className="font-mono text-[0.7rem] text-gray-500 uppercase mb-2">
                                        {metric.label}
                                    </div>
                                    <div className="font-mono text-lg font-bold">
                                        {metric.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
