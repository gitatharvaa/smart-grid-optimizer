import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import PowerForecast from './pages/PowerForecast';
import GridStability from './pages/GridStability';
import Simulator from './pages/Simulator';
import AIAssistant from './pages/AIAssistant';

function App() {
    return (
        <Router>
            <div className="flex min-h-screen bg-bg-cream">
                <Sidebar />
                <main className="ml-60 flex-1 p-8">
                    <Routes>
                        <Route path="/" element={<Overview />} />
                        <Route path="/forecast" element={<PowerForecast />} />
                        <Route path="/stability" element={<GridStability />} />
                        <Route path="/simulator" element={<Simulator />} />
                        <Route path="/assistant" element={<AIAssistant />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
