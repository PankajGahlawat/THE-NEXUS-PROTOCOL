import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext.js';
import { useAudio } from '../../context/AudioContext';
import NexusButton from '../UI/NexusButton.js';
import NexusCard from '../UI/NexusCard.js';
import { MISSIONS } from '../../data/missions';

export default function MissionBriefing() {
  const navigate = useNavigate();
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const { startMission, gameState } = useGame();
  const { playSound } = useAudio();

  const handleMissionSelect = (missionId: string) => {
    playSound('click');
    setSelectedMission(missionId);
  };

  const handleStartMission = () => {
    if (selectedMission) {
      playSound('success');
      startMission(selectedMission);
      navigate('/mission');
    }
  };

  const selectedMissionData = MISSIONS.find(m => m.id === selectedMission);

  // Helper to get the relevant role for the selected agent
  const getAgentRole = (agentId: string | null) => {
    switch (agentId) {
      case 'hacker': return 'Red Team'; // Cipher
      case 'infiltrator': return 'Blue Team'; // Ghost
      default: return 'Red Team';
    }
  };

  const currentRole = getAgentRole(gameState.selectedAgent);

  return (
    <div className="min-h-screen bg-arcane-dark p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold font-display text-arcane-teal mb-4">
            MISSION BRIEFING
          </h1>
          <p className="text-xl text-arcane-muted">
            Agent: {gameState.selectedAgent?.toUpperCase()} | Role: <span className="text-theme-primary">{currentRole.toUpperCase()}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mission Selection */}
          <div>
            <h2 className="text-2xl font-bold font-display text-arcane-text mb-6">
              Available Operations
            </h2>
            <div className="space-y-4">
              {MISSIONS.map((mission) => (
                <NexusCard
                  key={mission.id}
                  interactive
                  selected={selectedMission === mission.id}
                  onClick={() => handleMissionSelect(mission.id)}
                  className="cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold font-display text-arcane-text">
                        {mission.name}
                      </h3>
                      <p className="text-sm text-arcane-muted">
                        Target: {mission.difficulty} Access
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded text-xs font-semibold ${mission.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      mission.difficulty === 'Hard' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                      {mission.difficulty}
                    </div>
                  </div>

                  <p className="text-sm text-arcane-muted mb-3">
                    {mission.description}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-arcane-muted">Duration:</span>
                      <div className="text-arcane-text">{Math.floor(mission.duration / 60)} min</div>
                    </div>
                    <div>
                      <span className="text-arcane-muted">Trace Limit:</span>
                      <div className="text-arcane-text">{mission.traceThreshold}%</div>
                    </div>
                    <div>
                      <span className="text-arcane-muted">Phases:</span>
                      <div className="text-arcane-text">{mission.phases}</div>
                    </div>
                  </div>
                </NexusCard>
              ))}
            </div>
          </div>

          {/* Mission Details */}
          <div>
            <h2 className="text-2xl font-bold font-display text-arcane-text mb-6">
              Operation Details
            </h2>

            {selectedMissionData ? (
              <NexusCard>
                <h3 className="text-xl font-bold font-display text-theme-primary mb-4">
                  {selectedMissionData.name}
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="text-sm font-semibold text-arcane-text mb-2">
                      Your Objective ({currentRole}):
                    </h4>
                    <div className="p-4 bg-arcane-panel/50 rounded border border-arcane-border">
                      {selectedMissionData.objectives
                        .filter(obj => obj.role === currentRole)
                        .map((objective, index) => (
                          <div key={index}>
                            <h5 className="text-theme-primary font-bold mb-1">{objective.title}</h5>
                            <p className="text-sm text-arcane-muted mb-2">{objective.description}</p>
                            <div className="text-xs font-mono text-arcane-text opacity-75">
                              Reward: {objective.points} PTS
                            </div>
                          </div>
                        ))}
                      {selectedMissionData.objectives.filter(obj => obj.role === currentRole).length === 0 && (
                        <div className="text-sm text-red-400">
                          No specific objectives available for your class in this mission.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-arcane-border">
                    <div>
                      <span className="text-xs text-arcane-muted">Risk Level:</span>
                      <div className="text-sm text-arcane-text">{selectedMissionData.difficulty}</div>
                    </div>
                    <div>
                      <span className="text-xs text-arcane-muted">Time Limit:</span>
                      <div className="text-sm text-arcane-text">{Math.floor(selectedMissionData.duration / 60)} min</div>
                    </div>
                  </div>
                </div>

                <NexusButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleStartMission}
                >
                  Initiate Mission
                </NexusButton>
              </NexusCard>
            ) : (
              <NexusCard>
                <div className="text-center py-12">
                  <div className="text-arcane-muted mb-4">
                    Select a mission to view details
                  </div>
                  <div className="w-16 h-16 mx-auto border-2 border-dashed border-arcane-border rounded-lg flex items-center justify-center">
                    <span className="text-2xl text-arcane-muted">?</span>
                  </div>
                </div>
              </NexusCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}