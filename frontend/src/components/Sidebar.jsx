import React from 'react';
import { NavLink } from 'react-router-dom';
import { Zap, TrendingUp, Activity, Gamepad2, Bot } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { id: 'overview', icon: Zap, label: 'Overview', path: '/' },
        { id: 'forecast', icon: TrendingUp, label: 'Power Forecast', path: '/forecast' },
        { id: 'stability', icon: Activity, label: 'Grid Stability', path: '/stability' },
        { id: 'simulator', icon: Gamepad2, label: 'Simulator', path: '/simulator' },
        { id: 'assistant', icon: Bot, label: 'AI Assistant', path: '/assistant' }
    ];

    return (
        <div className="fixed left-0 top-0 h-screen w-60 bg-primary-dark flex flex-col z-50">
            {/* Logo Section */}
            <div className="p-6 border-b border-white/10">
                <div className="text-amber text-2xl mb-2">⚡</div>
                <div className="font-mono text-amber font-bold text-xl mb-1">GRID_OS</div>
                <div className="font-mono text-tag-text text-[0.65rem] uppercase tracking-wider">
                    v1.0 // OPTIMIZER
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 text-white transition-all duration-200 border-l-3 ${isActive
                                    ? 'bg-tag-bg border-l-amber text-amber'
                                    : 'border-l-transparent hover:bg-tag-bg'
                                }`
                            }
                        >
                            <Icon className="mr-3" size={20} />
                            <span className="text-sm">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-stable rounded-full animate-pulse"></div>
                    <span className="font-mono text-tag-text text-[0.7rem] uppercase tracking-wider">
                        API_ONLINE
                    </span>
                </div>
                <div className="font-mono text-white/30 text-[0.65rem] uppercase">
                    SGO // BUILD_2024
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
