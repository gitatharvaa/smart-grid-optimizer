import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ChatInterface from '../components/ChatInterface';
import { generateNarrative, sendChatMessage } from '../api/axios';

const AIAssistant = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState('');
    const [displayedReport, setDisplayedReport] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const generateReport = async () => {
        setIsGenerating(true);
        setDisplayedReport('');
        try {
            const response = await generateNarrative();
            setReport(response.narrative);

            // Typewriter effect
            let index = 0;
            const text = response.narrative;
            const timer = setInterval(() => {
                if (index < text.length) {
                    setDisplayedReport(text.substring(0, index + 1));
                    index++;
                } else {
                    clearInterval(timer);
                    setIsGenerating(false);
                }
            }, 20);
        } catch (error) {
            setIsGenerating(false);
            console.error('Report generation error:', error);
        }
    };

    const copyReport = () => {
        navigator.clipboard.writeText(report);
        alert('Report copied to clipboard!');
    };

    const handleChatMessage = async (data) => {
        setIsChatLoading(true);
        try {
            const response = await sendChatMessage(data);
            return response;
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <div>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="font-mono text-2xl font-bold text-dark-text">
                    AI_ASSISTANT // GRID INTELLIGENCE
                </h1>
                <div className="text-sm text-gray-500 mt-1">
                    Powered by Groq LLaMA 3.3 · LangChain SQL Agent
                </div>
            </div>

            {/* Report Generator Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-bg-card border border-border rounded-xl p-6 mb-8 max-w-3xl mx-auto"
            >
                <div className="font-mono text-sm uppercase mb-2 text-dark-text font-bold">
                    INSIGHT_REPORT_GENERATOR
                </div>
                <div className="text-sm text-gray-500 mb-6 leading-relaxed">
                    Generate a comprehensive AI analysis of your grid's Q1 2024 performance using live database data.
                </div>

                {!report ? (
                    <button
                        onClick={generateReport}
                        disabled={isGenerating}
                        className="w-52 h-12 bg-amber text-white rounded-full font-mono text-sm uppercase tracking-wider hover:bg-amber-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all mx-auto flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <span>ANALYZING</span>
                                <span className="animate-pulse">...</span>
                            </>
                        ) : (
                            <>⚡ GENERATE_REPORT</>
                        )}
                    </button>
                ) : null}

                {isGenerating && (
                    <div className="flex justify-center gap-2 mt-4">
                        {[0, 0.2, 0.4].map((delay, idx) => (
                            <div
                                key={idx}
                                className="w-2 h-2 rounded-full bg-primary-dark"
                                style={{ animation: `pulse 1.5s infinite ${delay}s` }}
                            />
                        ))}
                    </div>
                )}

                {displayedReport && (
                    <div>
                        <div className="bg-primary-dark text-bg-cream p-8 rounded-xl font-mono text-xs leading-loose whitespace-pre-wrap mb-4">
                            {displayedReport}
                            {isGenerating && <span className="animate-pulse">▊</span>}
                        </div>

                        {!isGenerating && (
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={copyReport}
                                    className="px-6 py-3 border-2 border-primary-dark text-primary-dark rounded-full font-mono text-xs uppercase hover:bg-primary-dark hover:text-white transition-all"
                                >
                                    📋 COPY_REPORT
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-6 py-3 border-2 border-primary-dark text-primary-dark rounded-full font-mono text-xs uppercase hover:bg-primary-dark hover:text-white transition-all"
                                >
                                    ↓ DOWNLOAD_PDF
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Chat Interface Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-bg-card border border-border rounded-xl p-6"
            >
                <ChatInterface onSendMessage={handleChatMessage} isLoading={isChatLoading} />
            </motion.div>
        </div>
    );
};

export default AIAssistant;
