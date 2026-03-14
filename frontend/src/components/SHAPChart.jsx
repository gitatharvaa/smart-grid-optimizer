import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SHAPChart = ({ data = [
    { feature: 'wind_speed', importance: 0.58 },
    { feature: 'hour', importance: 0.15 },
    { feature: 'air_density', importance: 0.12 },
    { feature: 'month', importance: 0.08 },
    { feature: 'temperature', importance: 0.04 },
    { feature: 'pressure', importance: 0.03 }
] }) => {
    return (
        <div>
            <div className="font-mono text-sm font-bold uppercase mb-4 text-dark-text">
                MODEL_EXPLAINABILITY // SHAP VALUES
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D4D0C4" />
                    <XAxis type="number" domain={[0, 1]} stroke="#6B7569" />
                    <YAxis
                        type="category"
                        dataKey="feature"
                        stroke="#6B7569"
                        style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem' }}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#F5F3EC',
                            border: '1px solid #D4D0C4',
                            borderRadius: '8px',
                            fontFamily: 'Inter'
                        }}
                        formatter={(value) => [(value * 100).toFixed(0) + '%', 'Importance']}
                    />
                    <Bar dataKey="importance" fill="#C9A227" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SHAPChart;
