import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import StabilityGauge from '../components/StabilityGauge';
import ScenarioBuilder from '../components/ScenarioBuilder';
import NodeDistributionDrag from '../components/NodeDistributionDrag';
import { predictPower, predictStability } from '../api/axios';

const Simulator = () => {
    const [windSpeed, setWindSpeed] = useState(7.0);
    const [temperature, setTemperature] = useState(15.0);
    const [pressure, setPressure] = useState(0.982);
    const [predictedPower, setPredictedPower] = useState(31.4);
    const [stability, setStability] = useState('stable');
    const [instabilityPct, setInstabilityPct] = useState(45);
    const [isLoading, setIsLoading] = useState(false);
    const [predictionLog, setPredictionLog] = useState([]);
    const [whatIfMode, setWhatIfMode] = useState(false);

    const debounceTimer = useRef(null);

    const airDensity = ((pressure * 101325) / (287.05 * (temperature + 273.15))).toFixed(3);

    useEffect(() => {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            predictValues();
        }, 300);
    }, [windSpeed, temperature, pressure]);

    const predictValues = async () => {
        setIsLoading(true);
        try {
            const powerRes = await predictPower({
                wind_speed: windSpeed,
                temperature,
                pressure
            });
            const power = powerRes.predicted_power || (windSpeed < 3 ? 0 : Math.pow(windSpeed / 12, 3) * 60);
            setPredictedPower(power);

            const stabilityRes = await predictStability({
                power_gen: power,
                c1: -1.5, c2: -1.8, c3: -1.2,
                p1: 0.8, p2: 0.9, p3: 0.7
            });
            setStability(stabilityRes.stability || (power > 25 ? 'stable' : 'unstable'));
            setInstabilityPct(stabilityRes.instability_percentage || Math.random() * 100);

            setPredictionLog(prev => [{
                time: new Date().toLocaleTimeString(),
                wind: windSpeed.toFixed(1),
                power: power.toFixed(1),
                status: stabilityRes.stability || (power > 25 ? 'stable' : 'unstable')
            }, ...prev.slice(0, 4)]);
        } catch (error) {
            console.error('Prediction error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const applyPreset = (preset) => {
        const presets = {
            perfect: { ws: 12.5, t: 18, p: 0.985 },
            storm: { ws: 18.2, t: 8, p: 0.965 },
            calm: { ws: 2.1, t: 12, p: 0.982 },
            peak: { ws: 6.5, t: 28, p: 0.978 }
        };
        const p = presets[preset];
        setWindSpeed(p.ws);
        setTemperature(p.t);
        setPressure(p.p);
    };

    const handleSimulate = async (config) => {
        console.log('Simulating full day:', config);
    };

    const handleDistributionChange = (node1, node2, node3) => {
        console.log('Distribution changed:', { node1, node2, node3 });
    };

    return (
        <div>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="font-mono text-2xl font-bold text-dark-text">
                    GRID_SIMULATOR // REAL-TIME PREDICTION
                </h1>
                <div className="text-sm text-gray-500 mt-1">
                    Adjust parameters to simulate live grid conditions
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-8">
                {/* LEFT COLUMN - INPUTS */}
                <div className="space-y-6">
                    {/* Scenario Presets */}
                    <div className="flex gap-3">
                        {[
                            { icon: '☀️', label: 'PERFECT_WIND', preset: 'perfect' },
                            { icon: '🌪️', label: 'STORM', preset: 'storm' },
                            { icon: '🌙', label: 'CALM_NIGHT', preset: 'calm' },
                            { icon: '📈', label: 'PEAK_DEMAND', preset: 'peak' }
                        ].map(p => (
                            <button
                                key={p.preset}
                                onClick={() => applyPreset(p.preset)}
                                className="flex-1 px-3 py-2 border-2 border-primary-dark text-primary-dark rounded-full font-mono text-[0.7rem] uppercase hover:bg-amber hover:text-white hover:border-amber transition-all"
                            >
                                {p.icon} {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Wind Speed Slider */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-bg-card p-4 rounded-xl"
                    >
                        <div className="flex justify-between mb-3">
                            <span className="font-mono text-xs uppercase text-gray-500">WIND_SPEED</span>
                            <span className="bg-tag-bg text-tag-text px-3 py-1 rounded-full font-mono text-[0.65rem]">
                                {windSpeed.toFixed(1)} m/s
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="20"
                            step="0.1"
                            value={windSpeed}
                            onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-amber"
                        />
                        <div className="flex justify-between font-mono text-[0.65rem] text-gray-400 mt-1">
                            <span>0 m/s</span>
                            <span>20 m/s</span>
                        </div>
                    </motion.div>

                    {/* Temperature Slider */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-bg-card p-4 rounded-xl"
                    >
                        <div className="flex justify-between mb-3">
                            <span className="font-mono text-xs uppercase text-gray-500">TEMPERATURE</span>
                            <span className="bg-tag-bg text-tag-text px-3 py-1 rounded-full font-mono text-[0.65rem]">
                                {temperature.toFixed(1)} °C
                            </span>
                        </div>
                        <input
                            type="range"
                            min="-10"
                            max="40"
                            step="0.5"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-amber"
                        />
                        <div className="flex justify-between font-mono text-[0.65rem] text-gray-400 mt-1">
                            <span>-10 °C</span>
                            <span>40 °C</span>
                        </div>
                    </motion.div>

                    {/* Pressure Slider */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-bg-card p-4 rounded-xl"
                    >
                        <div className="flex justify-between mb-3">
                            <span className="font-mono text-xs uppercase text-gray-500">PRESSURE</span>
                            <span className="bg-tag-bg text-tag-text px-3 py-1 rounded-full font-mono text-[0.65rem]">
                                {pressure.toFixed(3)} atm
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0.950"
                            max="1.000"
                            step="0.001"
                            value={pressure}
                            onChange={(e) => setPressure(parseFloat(e.target.value))}
                            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-amber"
                        />
                        <div className="flex justify-between font-mono text-[0.65rem] text-gray-400 mt-1">
                            <span>0.950 atm</span>
                            <span>1.000 atm</span>
                        </div>
                    </motion.div>

                    {/* Air Density */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-bg-card p-4 rounded-xl"
                    >
                        <div className="font-mono text-xs uppercase text-gray-500 mb-2">
                            AIR_DENSITY_COMPUTED
                        </div>
                        <div className="font-mono text-2xl font-bold text-dark-text">
                            {airDensity} <span className="text-sm font-normal">kg/m³</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <span title="Derived from pressure & temperature using ideal gas law. Higher density = more turbine power">
                                ℹ️
                            </span>
                            <span>Derived from ideal gas law</span>
                        </div>
                    </motion.div>

                    {/* Divider */}
                    <div className="text-center font-mono text-sm text-amber uppercase">
                        ── DAY_BUILDER ──
                    </div>

                    {/* Scenario Builder */}
                    <ScenarioBuilder onSimulate={handleSimulate} />

                    {/* Node Distribution */}
                    <NodeDistributionDrag
                        currentPower={predictedPower}
                        onDistributionChange={handleDistributionChange}
                    />
                </div>

                {/* RIGHT COLUMN - OUTPUTS */}
                <div className="space-y-6">
                    {/* Predicted Power Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-bg-card border-l-4 border-l-amber p-6 rounded-xl"
                        style={{ opacity: isLoading ? 0.7 : 1 }}
                    >
                        <div className="font-mono text-[0.7rem] text-gray-500 uppercase mb-3">
                            PREDICTED_GENERATION
                        </div>
                        <div className="font-mono text-5xl font-bold text-dark-text mb-4">
                            {predictedPower.toFixed(1)} <span className="text-xl font-normal text-gray-500">MW</span>
                        </div>
                        <div className="h-3 bg-border rounded-lg overflow-hidden mb-2">
                            <motion.div
                                className="h-full bg-amber"
                                initial={{ width: 0 }}
                                animate={{ width: `${(predictedPower / 60) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <div className="font-mono text-xs uppercase text-gray-500">
                            {((predictedPower / 60) * 100).toFixed(1)}% OF RATED CAPACITY
                        </div>
                    </motion.div>

                    {/* Node Cards */}
                    <div className="space-y-3">
                        {[
                            { label: 'NODE_01', pct: 20, color: 'border-amber' },
                            { label: 'NODE_02', pct: 45, color: 'border-primary-dark' },
                            { label: 'NODE_03', pct: 35, color: 'border-tag-text' }
                        ].map((node, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`bg-bg-card p-4 rounded-lg border-l-4 ${node.color} flex justify-between items-center`}
                            >
                                <span className="font-mono text-sm font-bold">
                                    {node.label} // {node.pct}%
                                </span>
                                <span className="font-mono text-xl font-bold" style={{ color: node.color.replace('border-', '') }}>
                                    {(predictedPower * node.pct / 100).toFixed(2)} MW
                                </span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Stability Result */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-6 rounded-xl border-2 text-center ${stability === 'stable'
                                ? 'bg-stable/15 border-stable'
                                : 'bg-unstable/15 border-unstable'
                            }`}
                        style={{ animation: 'pulse 2s infinite' }}
                    >
                        <div className={`font-mono text-xl font-bold uppercase ${stability === 'stable' ? 'text-stable' : 'text-unstable'
                            }`}>
                            {stability === 'stable' ? '✅ GRID_STABLE' : '⚠️ GRID_UNSTABLE'}
                        </div>
                    </motion.div>

                    {/* Stability Gauge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-bg-card p-6 rounded-xl"
                    >
                        <StabilityGauge value={instabilityPct} />
                    </motion.div>

                    {/* Prediction Log */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-bg-card p-6 rounded-xl"
                    >
                        <h4 className="font-mono text-sm uppercase mb-3 text-amber">
                            PREDICTION_LOG // LAST 5
                        </h4>
                        <table className="w-full font-mono text-xs">
                            <thead>
                                <tr className="border-b border-amber text-amber">
                                    <th className="p-2 text-left">TIME</th>
                                    <th className="p-2 text-left">WIND</th>
                                    <th className="p-2 text-left">POWER</th>
                                    <th className="p-2 text-left">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {predictionLog.map((log, idx) => (
                                    <tr key={idx} className="border-b border-border">
                                        <td className="p-2">{log.time}</td>
                                        <td className="p-2">{log.wind} m/s</td>
                                        <td className="p-2">{log.power} MW</td>
                                        <td className={`p-2 ${log.status === 'stable' ? 'text-stable' : 'text-unstable'}`}>
                                            {log.status.toUpperCase()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Simulator;
