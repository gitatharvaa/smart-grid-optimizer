import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ScenarioBuilder = ({ onSimulate }) => {
    const [timeline, setTimeline] = useState(Array(24).fill(null));
    const [resultData, setResultData] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);

    const availableBlocks = [
        { id: 'high-wind', icon: '🌬️', label: 'HIGH WIND', color: 'bg-amber', wind_speed: 14 },
        { id: 'moderate-wind', icon: '🍃', label: 'MODERATE WIND', color: 'bg-green-200', wind_speed: 8 },
        { id: 'low-wind', icon: '😴', label: 'LOW WIND', color: 'bg-gray-200', wind_speed: 2 },
        { id: 'hot-day', icon: '☀️', label: 'HOT DAY', color: 'bg-orange-200', temperature: 35 },
        { id: 'cold-day', icon: '❄️', label: 'COLD DAY', color: 'bg-blue-200', temperature: 5 }
    ];

    const onDragEnd = (result) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;

        if (result.source.droppableId === 'blocks' && result.destination.droppableId === 'timeline') {
            const block = availableBlocks[sourceIndex];
            const newTimeline = [...timeline];
            newTimeline[destIndex] = block;
            setTimeline(newTimeline);
        }
    };

    const handleSimulate = async () => {
        setIsSimulating(true);
        const config = timeline.map((block, hour) => ({
            hour,
            wind_speed: block?.wind_speed || 7,
            temperature: block?.temperature || 15
        }));

        try {
            await onSimulate(config);
            // Generate mock result data
            const mockData = config.map((c, idx) => ({
                hour: idx,
                power: c.wind_speed < 3 ? 0 : Math.pow(c.wind_speed / 12, 3) * 60
            }));
            setResultData(mockData);
        } catch (error) {
            console.error('Simulation error:', error);
        } finally {
            setIsSimulating(false);
        }
    };

    const handleClear = () => {
        setTimeline(Array(24).fill(null));
        setResultData(null);
    };

    const hasBlocks = timeline.some(block => block !== null);

    return (
        <div className="space-y-6">
            <DragDropContext onDragEnd={onDragEnd}>
                {/* Available Blocks */}
                <div>
                    <h3 className="font-mono text-sm uppercase mb-3 text-dark-text">AVAILABLE_BLOCKS</h3>
                    <Droppable droppableId="blocks" direction="horizontal">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="flex gap-2 flex-wrap"
                            >
                                {availableBlocks.map((block, index) => (
                                    <Draggable key={block.id} draggableId={block.id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`${block.color} px-4 py-2 rounded-lg cursor-move font-mono text-xs uppercase flex items-center gap-2`}
                                            >
                                                <span>{block.icon}</span>
                                                <span>{block.label}</span>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>

                {/* Timeline */}
                <div>
                    <h3 className="font-mono text-sm uppercase mb-3 text-dark-text">24_HOUR_TIMELINE</h3>
                    <Droppable droppableId="timeline" direction="horizontal">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="grid grid-cols-12 gap-2"
                            >
                                {timeline.map((block, index) => (
                                    <Draggable key={`slot-${index}`} draggableId={`slot-${index}`} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`h-16 rounded border-2 ${block
                                                        ? `${block.color} border-transparent`
                                                        : 'border-dashed border-border bg-bg-card'
                                                    } flex flex-col items-center justify-center text-xs font-mono`}
                                            >
                                                <div className="text-[0.6rem] text-gray-500">{index.toString().padStart(2, '0')}:00</div>
                                                {block && <div className="text-lg">{block.icon}</div>}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            </DragDropContext>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleSimulate}
                    disabled={!hasBlocks || isSimulating}
                    className="px-6 py-3 bg-amber text-white rounded-full font-mono text-xs uppercase tracking-wider hover:bg-amber-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isSimulating ? 'SIMULATING...' : 'SIMULATE FULL DAY'}
                </button>
                <button
                    onClick={handleClear}
                    className="px-6 py-3 bg-transparent border-2 border-primary-dark text-primary-dark rounded-full font-mono text-xs uppercase tracking-wider hover:bg-primary-dark hover:text-white transition-all"
                >
                    CLEAR ALL
                </button>
            </div>

            {/* Results */}
            {resultData && (
                <div className="bg-bg-card p-6 rounded-xl">
                    <h3 className="font-mono text-sm uppercase mb-4 text-dark-text">SIMULATION_RESULTS</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={resultData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#D4D0C4" />
                            <XAxis
                                dataKey="hour"
                                stroke="#6B7569"
                                tickFormatter={(hour) => `${hour}:00`}
                            />
                            <YAxis stroke="#6B7569" label={{ value: 'MW', angle: -90, position: 'insideLeft' }} />
                            <Tooltip
                                contentStyle={{
                                    background: '#F5F3EC',
                                    border: '1px solid #D4D0C4',
                                    borderRadius: '8px'
                                }}
                            />
                            <Line type="monotone" dataKey="power" stroke="#C9A227" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default ScenarioBuilder;
