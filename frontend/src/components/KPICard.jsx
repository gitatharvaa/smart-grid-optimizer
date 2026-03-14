import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const KPICard = ({ icon, label, value, unit, trend, accentColor = '#C9A227' }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const numericValue = parseFloat(String(value).replace(/[^0-9.]/g, ''));
        let start = 0;
        const duration = 1500;
        const increment = numericValue / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= numericValue) {
                setDisplayValue(numericValue);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.3 }}
            className="bg-bg-card border border-border rounded-xl p-6 transition-all hover:shadow-lg"
            style={{ borderLeftWidth: '3px', borderLeftColor: accentColor }}
        >
            <div className="flex items-center gap-2 mb-3 font-mono text-[0.7rem] uppercase tracking-wider text-gray-500">
                <span className="text-xl">{icon}</span>
                <span>{label}</span>
            </div>

            <div className="font-mono text-3xl font-bold text-dark-text mb-2">
                {String(value).includes('.') ? displayValue.toFixed(1) : displayValue.toLocaleString()}
                <span className="text-base font-normal text-gray-500 ml-1">{unit}</span>
            </div>

            {trend && (
                <div
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${trend.startsWith('↑')
                            ? 'bg-stable/15 text-stable'
                            : 'bg-unstable/15 text-unstable'
                        }`}
                >
                    {trend}
                </div>
            )}
        </motion.div>
    );
};

export default KPICard;
