import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import DashboardView from './views/DashboardView';
import HistoryView from './views/HistoryView';
import AnalyticsView from './views/AnalyticsView';
import CylindersView from './views/CylindersView';
import SettingsView from './views/SettingsView';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/history" element={<HistoryView />} />
            <Route path="/analytics" element={<AnalyticsView />} />
            <Route path="/cylinders" element={<CylindersView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;