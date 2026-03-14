import React, { useState, useRef, useEffect } from 'react';

const ChatInterface = ({ onSendMessage, isLoading }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [showQuery, setShowQuery] = useState({});
    const messagesEndRef = useRef(null);

    const suggestedQuestions = [
        "Which hour is most unstable?",
        "Compare Node 1 vs Node 2",
        "Highest generation week?",
        "Peak instability pattern?",
        "What is the capacity factor?",
        "Most stable period?"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        try {
            const response = await onSendMessage({ message: input, history: messages });
            const aiMessage = {
                role: 'assistant',
                content: response.response || response.message,
                sql_query: response.sql_query,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Error connecting to AI assistant. Please try again.',
                timestamp: new Date()
            }]);
        }
    };

    return (
        <div className="flex flex-col h-[600px]">
            {/* Suggested questions */}
            <div className="flex gap-2 flex-wrap mb-4 p-4 bg-bg-card rounded-xl">
                {suggestedQuestions.map((q, idx) => (
                    <button
                        key={idx}
                        onClick={() => setInput(q)}
                        className="px-4 py-2 rounded-full font-mono text-xs uppercase border-2 border-primary-dark text-primary-dark hover:bg-amber hover:text-white hover:border-amber transition-all"
                    >
                        {q}
                    </button>
                ))}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 bg-bg-card rounded-xl mb-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                        <div className="max-w-[70%]">
                            {msg.role === 'assistant' && (
                                <div className="font-mono text-[0.7rem] text-tag-text mb-1 uppercase">
                                    GRID_AI
                                </div>
                            )}
                            <div
                                className={`${msg.role === 'user' ? 'bg-amber' : 'bg-primary-dark'
                                    } text-white p-3 rounded-xl font-sans text-sm leading-relaxed`}
                            >
                                {msg.content}
                            </div>
                            {msg.sql_query && (
                                <div className="mt-2">
                                    <div
                                        className="font-mono text-[0.7rem] text-tag-text cursor-pointer uppercase"
                                        onClick={() => setShowQuery(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                    >
                                        {showQuery[idx] ? '▼' : '▶'} VIEW_QUERY
                                    </div>
                                    {showQuery[idx] && (
                                        <pre className="bg-primary-deeper text-tag-text p-3 rounded-lg font-mono text-xs mt-2 overflow-auto">
                                            {msg.sql_query}
                                        </pre>
                                    )}
                                </div>
                            )}
                            <div className="font-mono text-[0.65rem] text-gray-500 mt-1">
                                {msg.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-primary-dark text-white p-3 rounded-xl flex gap-1">
                            <span className="animate-pulse">●</span>
                            <span className="animate-pulse delay-75">●</span>
                            <span className="animate-pulse delay-150">●</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="flex gap-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Query grid data..."
                    className="flex-1 px-4 py-3 bg-bg-card border-2 border-primary-dark rounded-full font-mono text-sm outline-none focus:border-amber transition-colors"
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="px-6 py-3 bg-amber text-white rounded-full font-mono text-xs uppercase tracking-wider hover:bg-amber-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    QUERY →
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;
