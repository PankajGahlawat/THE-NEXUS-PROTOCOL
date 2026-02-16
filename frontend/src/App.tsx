/**
 * NEXUS PROTOCOL - Main Application Component
 * Root component with React Router for proper routing
 * Version: 2.1.0
 * Last Updated: February 14, 2026
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { GameProvider } from './context/GameContext';
import { AudioProvider } from './context/AudioContext';
import ErrorBoundary from './components/UI/ErrorBoundary';
import AudioControls from './components/UI/AudioControls';
import BroadcastOverlay from './components/UI/BroadcastOverlay';
import LandingPage from './components/Landing/LandingPage';
import TrailerSequence from './components/Trailer/TrailerSequence';
import LoginScreen from './components/Auth/LoginScreen';
import AgentSelect from './components/Agent/AgentSelect';
import MissionBriefing from './components/Mission/MissionBriefing';
import MissionUI from './components/Mission/MissionUI';
import AdminDashboard from './components/Admin/AdminDashboard';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AudioProvider>
            <GameProvider>
              <div className="min-h-screen bg-arcane-dark text-arcane-text">
                <Routes>
                  {/* Landing Page Route */}
                  <Route path="/" element={<LandingPage />} />

                  {/* Trailer Route */}
                  <Route path="/trailer" element={<TrailerSequence />} />

                  {/* Login Route */}
                  <Route path="/login" element={<LoginScreen />} />

                  {/* Agent Selection Route */}
                  <Route path="/agent-select" element={<AgentSelect />} />

                  {/* Mission Briefing Route */}
                  <Route path="/mission-briefing" element={<MissionBriefing />} />

                  {/* Mission Active Route */}
                  <Route path="/mission" element={<MissionUI />} />

                  {/* Admin Route */}
                  <Route path="/admin" element={<AdminDashboard />} />

                  {/* Catch all - redirect to landing */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                {/* Global Overlays */}
                <BroadcastOverlay />

                {/* Global Audio Controls */}
                <AudioControls />
              </div>
            </GameProvider>
          </AudioProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;