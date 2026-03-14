import React, { useState, useEffect } from 'react';

const NodeDistributionDrag = ({ currentPower = 60, onDistributionChange }) => {
    const [whatIfMode, setWhatIfMode] = useState(false);
    const [node1, setNode1] = useState(20);
    const [node2, setNode2] = useState(45);
    const [node3, setNode3] = useState(35);
    const [stabilityImpact, setStabilityImpact] = useState(0);

    useEffect(() => {
        const newNode3 = 100 - node1 - node2;
        setNode3(Math.max(0, newNode3));

        // Calculate stability impact (mock calculation)
        const originalBalance = Math.abs(20 - 45) + Math.abs(45 - 35) + Math.abs(35 - 20);
        const newBalance = Math.abs(node1 - node2) + Math.abs(node2 - newNode3) + Math.abs(newNode3 - node1);
        const impact = ((originalBalance - newBalance) / originalBalance) * 100;
        setStabilityImpact(impact);

        if (onDistributionChange) {
            onDistributionChange(node1, node2, newNode3);
        }
    }, [node1, node2]);

    const hasError = node1 + node2 + node3 > 100;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id="whatif-mode"
                    checked={whatIfMode}
                    onChange={(e) => setWhatIfMode(e.target.checked)}
                    className="w-4 h-4"
                />
                <label
                    htmlFor="whatif-mode"
                    className="font-mono text-sm uppercase cursor-pointer"
                >
                    WHAT-IF MODE
                </label>
            </div>

            {whatIfMode && (
                <div className="space-y-4">
                    {/* Node 1 Slider */}
                    <div className="bg-bg-card p-4 rounded-lg">
                        <div className="flex justify-between mb-2 font-mono text-xs text-gray-500">
                            <span>NODE_1 ALLOCATION</span>
                            <span className="bg-tag-bg text-tag-text px-2 py-1 rounded">{node1}%</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="60"
                            value={node1}
                            onChange={(e) => setNode1(parseInt(e.target.value))}
                            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-amber"
                        />
                        <div className="flex justify-between font-mono text-[0.65rem] text-gray-400 mt-1">
                            <span>5%</span>
                            <span>60%</span>
                        </div>
                    </div>

                    {/* Node 2 Slider */}
                    <div className="bg-bg-card p-4 rounded-lg">
                        <div className="flex justify-between mb-2 font-mono text-xs text-gray-500">
                            <span>NODE_2 ALLOCATION</span>
                            <span className="bg-tag-bg text-tag-text px-2 py-1 rounded">{node2}%</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="70"
                            value={node2}
                            onChange={(e) => setNode2(parseInt(e.target.value))}
                            className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-amber"
                        />
                        <div className="flex justify-between font-mono text-[0.65rem] text-gray-400 mt-1">
                            <span>5%</span>
                            <span>70%</span>
                        </div>
                    </div>

                    {/* Node 3 Display (Locked) */}
                    <div className="bg-bg-card p-4 rounded-lg">
                        <div className="flex justify-between mb-2 font-mono text-xs text-gray-500">
                            <span>NODE_3 ALLOCATION 🔒</span>
                            <span className="bg-tag-bg text-tag-text px-2 py-1 rounded">{node3}%</span>
                        </div>
                        <div className="h-2 bg-border rounded-lg overflow-hidden">
                            <div
                                className="h-full bg-tag-text transition-all duration-300"
                                style={{ width: `${node3}%` }}
                            />
                        </div>
                        <div className="text-[0.65rem] text-gray-400 mt-1 italic">
                            Auto-calculated: 100% - Node1 - Node2
                        </div>
                    </div>

                    {/* Error Message */}
                    {hasError && (
                        <div className="bg-unstable/15 border border-unstable text-unstable p-3 rounded-lg font-mono text-xs text-center">
                            ⚠️ ALLOCATION_ERROR: Exceeds 100%
                        </div>
                    )}

                    {/* Distribution Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'NODE_01', pct: node1, power: (currentPower * node1 / 100).toFixed(2), color: 'border-amber' },
                            { label: 'NODE_02', pct: node2, power: (currentPower * node2 / 100).toFixed(2), color: 'border-primary-dark' },
                            { label: 'NODE_03', pct: node3, power: (currentPower * node3 / 100).toFixed(2), color: 'border-tag-text' }
                        ].map((node, idx) => (
                            <div key={idx} className={`bg-bg-card p-3 rounded-lg border-l-4 ${node.color}`}>
                                <div className="font-mono text-[0.7rem] uppercase text-gray-500 mb-1">
                                    {node.label}
                                </div>
                                <div className="font-mono text-lg font-bold text-dark-text">
                                    {node.power} MW
                                </div>
                                <div className="font-mono text-xs text-gray-400">
                                    {node.pct}%
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Stability Impact */}
                    {!hasError && (
                        <div className={`p-4 rounded-lg border-2 ${stabilityImpact >= 0
                                ? 'bg-stable/15 border-stable'
                                : 'bg-unstable/15 border-unstable'
                            }`}>
                            <div className="font-mono text-xs uppercase text-gray-500 mb-2">
                                STABILITY_IMPACT
                            </div>
                            <div className={`font-mono text-xl font-bold ${stabilityImpact >= 0 ? 'text-stable' : 'text-unstable'
                                }`}>
                                {stabilityImpact >= 0 ? '↑' : '↓'} {Math.abs(stabilityImpact).toFixed(1)}%
                                {stabilityImpact >= 0 ? ' stability improvement' : ' stability decline'}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NodeDistributionDrag;
