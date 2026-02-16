/**
 * NEXUS PROTOCOL - Agent Selection Component
 * Interactive agent selection with theme switching
 * Version: 1.0.0
 * Last Updated: December 20, 2025
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../context/AudioContext';
import type { AgentTheme } from '../../hooks/useTheme';
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
    image: '/assets/card-left-01.webp',
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
    image: '/assets/card-right-01.webp',
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
  const { setTheme } = useTheme();
  const { selectAgent } = useGame();
  const { playSound } = useAudio();

  // Check for preselected character from landing page
  useEffect(() => {
    const preselectedCharacter = sessionStorage.getItem('nexus_preselected_character');
    if (preselectedCharacter && agents[preselectedCharacter as keyof typeof agents]) {
      setSelectedAgent(preselectedCharacter);
      setTheme(preselectedCharacter as AgentTheme);
      // Clear the preselection
      sessionStorage.removeItem('nexus_preselected_character');
    }
  }, [setTheme]);

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    setTheme(agentId as AgentTheme);
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
              className={`agent-card cursor-pointer transition-all duration-500 transform hover:scale-105 ${selectedAgent === agent.id
                ? 'ring-2 ring-theme-primary shadow-2xl shadow-theme-primary/25 pulse-glow'
                : 'hover:shadow-xl hover:shadow-theme-primary/10'
                }`}
            >
              <div className="text-center mb-6">
                {/* Agent Card Image */}
                <div className="agent-card-image w-full h-64 mb-4 cyberpunk-border hologram-effect group">
                  <img
                    src={agent.image}
                    alt={`${agent.name} - ${agent.codeName}`}
                    className="agent-portrait"
                    onError={(e) => {
                      // Fallback to gradient icon if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  {/* Enhanced Fallback gradient icon */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-theme-primary via-theme-accent to-theme-primary rounded-lg flex flex-col items-center justify-center text-white"
                    style={{ display: 'none' }}
                  >
                    <div className="text-6xl font-bold mb-2">{agent.codeName[0]}</div>
                    <div className="text-sm font-mono opacity-75">CLASSIFIED</div>
                    <div className="absolute inset-0 bg-black/20"></div>
                  </div>
                  <img
                    src={agent.image}
                    alt={`${agent.name} - ${agent.codeName}`}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                    onError={(e) => {
                      // Fallback to gradient icon if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  {/* Fallback gradient icon */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-theme-primary to-theme-accent rounded-lg flex items-center justify-center text-6xl font-bold text-white"
                    style={{ display: 'none' }}
                  >
                    {agent.codeName[0]}
                  </div>

                  {/* Cyberpunk overlay effects */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-theme-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Glitch lines effect */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-theme-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 right-0 w-full h-0.5 bg-theme-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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
                      <div className="w-8 h-8 bg-theme-primary rounded-full flex items-center justify-center animate-pulse">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Hover effect border */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-theme-primary/50 rounded-lg transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold font-display text-arcane-text mb-2 glitch-effect" data-text={agent.name}>
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
                        className="h-full bg-gradient-to-r from-theme-primary to-theme-accent transition-all duration-1000 relative"
                        style={{ width: `${value}%` }}
                      >
                        <div className="absolute inset-0 bg-white/10"></div>
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
                  <div key={index} className="text-xs text-arcane-muted flex items-start group">
                    <span className="text-theme-accent mr-2 group-hover:text-theme-primary transition-colors">▶</span>
                    <span className="group-hover:text-arcane-text transition-colors">{ability}</span>
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