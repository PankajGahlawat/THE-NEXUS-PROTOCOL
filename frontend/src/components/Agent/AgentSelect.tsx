/**
 * NEXUS PROTOCOL - Agent Selection Component
 * Interactive agent selection with theme switching
 * Version: 1.0.0
 * Last Updated: December 20, 2025
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../context/AudioContext';
import NexusButton from '../UI/NexusButton';
import NexusCard from '../UI/NexusCard';
import './AgentSelect.css';

const agents = {
  hacker: {
    id: 'hacker',
    name: 'BREACH ARCHITECT',
    codeName: 'CIPHER',
    description: 'System exploitation and digital warfare specialist',
    philosophy: 'Language of systems is code. She writes the lies the Vault reads.',
    image: '/assets/CIPHER-001.webp',
    stats: { hacking: 100, stealth: 60, combat: 40, analysis: 70 },
    abilities: [
      'Cipher Cache: False telemetry echo',
      'Ghost Port: Disable external logs',
      'System Lattice: Backdoor network deployment'
    ]
  },
  infiltrator: {
    id: 'infiltrator',
    name: 'SHADOW LINGUIST',
    codeName: 'GHOST',
    description: 'Social engineering and identity manipulation specialist',
    philosophy: 'People open doors that only words can unlock.',
    image: '/assets/GHOST-002.webp',
    stats: { hacking: 40, stealth: 100, combat: 70, analysis: 60 },
    abilities: [
      'Social Echo: Boost persuasion checks',
      'False Face: Temporary persona overlay',
      'Crowd Scripting: Manipulate public telemetry'
    ]
  }
};

interface AgentSelectProps {
  onAgentSelected?: (agentId: string) => void;
}

export default function AgentSelect({ }: AgentSelectProps) {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const { selectAgent, gameState } = useGame();
  const { playSound } = useAudio();

  // Apply team theme on mount
  useEffect(() => {
    if (gameState.teamType) {
      const root = document.documentElement;
      const teamTheme = gameState.teamType === 'red' ? 'red' : 'blue';
      const colors = gameState.teamType === 'red' ? {
        primary: '#FF1744',
        secondary: '#DC143C',
        accent: '#8B0000',
        highlight: '#FF6B35',
        glow: 'rgba(255, 23, 68, 0.5)'
      } : {
        primary: '#00D4FF',
        secondary: '#0099CC',
        accent: '#0066AA',
        highlight: '#33E0FF',
        glow: 'rgba(0, 212, 255, 0.5)'
      };

      root.setAttribute('data-theme', teamTheme);
      root.style.setProperty('--theme-primary', colors.primary);
      root.style.setProperty('--theme-secondary', colors.secondary);
      root.style.setProperty('--theme-accent', colors.accent);
      root.style.setProperty('--theme-highlight', colors.highlight);
      root.style.setProperty('--theme-glow', colors.glow);
    }
  }, [gameState.teamType]);

  // Check for preselected character from landing page
  useEffect(() => {
    const preselectedCharacter = sessionStorage.getItem('nexus_preselected_character');
    if (preselectedCharacter && agents[preselectedCharacter as keyof typeof agents]) {
      setSelectedAgent(preselectedCharacter);
      // Clear the preselection
      sessionStorage.removeItem('nexus_preselected_character');
    }
  }, []);

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    playSound('click');
  };

  const handleConfirm = () => {
    if (selectedAgent) {
      playSound('success');
      selectAgent(selectedAgent);
      navigate('/mission-briefing');
    }
  };

  return (
    <div className="min-h-screen bg-arcane-dark p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold font-display text-arcane-teal mb-4">
            SELECT YOUR AGENT
          </h1>
          <p className="text-xl text-arcane-muted">
            Choose your specialization for the mission
          </p>
        </div>

        {/* Updated grid to 2 columns and centered */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
          {Object.values(agents).map((agent) => (
            <NexusCard
              key={agent.id}
              variant="agent"
              interactive
              selected={selectedAgent === agent.id}
              onClick={() => handleAgentSelect(agent.id)}
              className={`agent-card cursor-pointer transition-all duration-300 ${selectedAgent === agent.id
                ? 'ring-2 ring-theme-primary shadow-2xl shadow-theme-primary/25'
                : 'hover:shadow-xl hover:shadow-theme-primary/10'
                }`}
            >
              <div className="text-center mb-6">
                {/* Agent Card Image */}
                <div className="agent-card-image w-full h-64 mb-4 cyberpunk-border">
                  <img
                    src={agent.image}
                    alt={`${agent.name} - ${agent.codeName}`}
                    className="agent-portrait"
                  />

                  {/* Cyberpunk overlay effects */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Agent code name overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-white font-display font-bold text-xl mb-1">
                      {agent.codeName}
                    </div>
                    <div className="text-theme-primary text-sm font-mono">
                      ID: {agent.id.toUpperCase()}-001
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {selectedAgent === agent.id && (
                    <div className="absolute top-4 right-4">
                      <div className="w-10 h-10 bg-theme-primary rounded-full flex items-center justify-center shadow-lg" style={{
                        boxShadow: '0 0 20px var(--theme-glow)'
                      }}>
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold font-display text-arcane-text mb-2">
                  {agent.name}
                </h3>
                <div className="flex items-center justify-center mb-2">
                  <div className="w-2 h-2 bg-theme-primary rounded-full mr-2 animate-pulse"></div>
                  <p className="text-sm text-theme-primary font-mono">
                    {agent.description}
                  </p>
                </div>
                <div className="text-xs text-arcane-muted mb-4 px-4 py-2 bg-arcane-panel/50 rounded border border-arcane-border/50">
                  <span className="text-theme-accent">CLEARANCE:</span> CLASSIFIED
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-semibold text-arcane-text uppercase mb-3 flex items-center">
                  <span className="w-2 h-2 bg-theme-accent rounded-full mr-2"></span>
                  Combat Statistics
                </h4>
                {Object.entries(agent.stats).map(([stat, value]) => (
                  <div key={stat} className="flex items-center group">
                    <span className="w-20 text-xs text-arcane-muted uppercase group-hover:text-theme-primary transition-colors">
                      {stat}
                    </span>
                    <div className="flex-1 mx-3 h-2 bg-arcane-border rounded-full overflow-hidden stat-bar">
                      <div
                        className="h-full bg-gradient-to-r from-theme-primary to-theme-accent transition-all duration-1000"
                        style={{ width: `${value}%` }}
                      >
                      </div>
                    </div>
                    <span className="w-8 text-xs text-arcane-text text-right font-mono">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-arcane-text uppercase flex items-center">
                  <span className="w-2 h-2 bg-theme-primary rounded-full mr-2"></span>
                  Specialized Abilities
                </h4>
                {agent.abilities.map((ability, index) => (
                  <div key={index} className="text-xs text-arcane-muted flex items-start">
                    <span className="text-theme-accent mr-2">▶</span>
                    <span>{ability}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-arcane-border">
                <div className="bg-arcane-panel/30 p-3 rounded border border-theme-primary/20">
                  <p className="text-xs italic text-theme-primary leading-relaxed">
                    "{agent.philosophy}"
                  </p>
                </div>
              </div>
            </NexusCard>
          ))}
        </div>

        <div className="text-center">
          <NexusButton
            variant="primary"
            size="lg"
            onClick={handleConfirm}
            disabled={!selectedAgent}
          >
            Confirm Agent Selection
          </NexusButton>
        </div>
      </div>
    </div>
  );
}