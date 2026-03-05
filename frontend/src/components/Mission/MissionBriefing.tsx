import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext.js';
import { useAudio } from '../../context/AudioContext';
import { MISSIONS } from '../../data/missions';

export default function MissionBriefing() {
  const navigate = useNavigate();
  const { startMission, gameState } = useGame();
  const { playSound } = useAudio();

  const handleStartMission = () => {
    playSound('success');
    startMission('college-event-ctf');
    navigate('/mission');
  };

  const mission = MISSIONS[0];
  const currentRole = gameState.teamType === 'red' ? 'Red Team' : 'Blue Team';
  const roleObjectives = mission.objectives.filter(obj => obj.role === currentRole);

  return (
    <div className="min-h-screen bg-arcane-dark p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold font-display text-arcane-teal mb-4">
            MISSION BRIEFING
          </h1>
          <p className="text-xl text-arcane-muted">
            Agent: {gameState.selectedAgent?.toUpperCase()} | Role: <span className="text-theme-primary">{currentRole.toUpperCase()}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Available Operations */}
          <div>
            <h2 className="text-2xl font-bold font-display text-arcane-text mb-6">
              Available Operations
            </h2>

            {/* Mission Card */}
            <div className="bg-arcane-panel border-2 border-theme-primary rounded-lg p-6 relative">
              {/* Selected Badge */}
              <div className="absolute top-4 right-4 bg-green-500 rounded-full w-10 h-10 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-bold font-display text-arcane-text mb-2">
                  {mission.name}
                </h3>
                <p className="text-sm text-arcane-muted mb-1">
                  Level: <span className="text-green-400">{mission.difficulty}</span>
                </p>
              </div>

              <div className="flex items-start mb-4">
                <span className="text-theme-primary mr-2">🎯</span>
                <p className="text-sm text-arcane-muted">
                  {mission.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-arcane-muted text-xs mb-1">Duration:</div>
                  <div className="text-arcane-text font-semibold">{Math.floor(mission.duration / 60)} min</div>
                </div>
                <div>
                  <div className="text-arcane-muted text-xs mb-1">Target:</div>
                  <div className="text-theme-primary font-semibold">{mission.target}</div>
                </div>
                <div>
                  <div className="text-arcane-muted text-xs mb-1">Tasks:</div>
                  <div className="text-arcane-text font-semibold">{roleObjectives.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Operation Details */}
          <div>
            <h2 className="text-2xl font-bold font-display text-arcane-text mb-6">
              Operation Details
            </h2>

            <div className="bg-arcane-panel border border-arcane-border rounded-lg p-6">
              <h3 className="text-2xl font-bold font-display text-theme-primary mb-6">
                {mission.name}
              </h3>

              {/* Objectives */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-arcane-text mb-4">
                  Your Objectives ({currentRole}):
                </h4>
                <div className="space-y-3">
                  {roleObjectives.map((objective, index) => (
                    <div key={index} className="bg-arcane-dark/50 border border-arcane-border rounded p-4">
                      <div className="flex items-start mb-2">
                        <input 
                          type="checkbox" 
                          className="mt-1 mr-3 w-4 h-4 rounded border-theme-primary bg-transparent"
                          disabled
                        />
                        <div className="flex-1">
                          <h5 className="text-theme-primary font-bold mb-1">
                            {objective.title}
                          </h5>
                          <p className="text-sm text-arcane-muted mb-2">
                            {objective.description}
                          </p>
                          <div className="flex gap-2">
                            <span className="text-xs px-2 py-1 bg-arcane-panel border border-arcane-border rounded text-arcane-muted uppercase">
                              {objective.category}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-theme-primary font-bold">+{objective.points} pts</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Infrastructure */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-arcane-text mb-3">
                  Target Infrastructure:
                </h4>
                <div className="bg-arcane-dark/50 border border-arcane-border rounded p-4">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-arcane-muted mb-1">Domain:</div>
                      <div className="text-theme-primary font-mono text-sm">{mission.targetDomain}</div>
                    </div>
                    <div>
                      <div className="text-xs text-arcane-muted mb-1">IP Address:</div>
                      <div className="text-theme-primary font-mono text-sm">{mission.target}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-arcane-muted mb-2">Services:</div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 bg-arcane-panel border border-arcane-border rounded text-arcane-text">
                        HTTP (80)
                      </span>
                      <span className="text-xs px-2 py-1 bg-arcane-panel border border-arcane-border rounded text-arcane-text">
                        SSH (22)
                      </span>
                      <span className="text-xs px-2 py-1 bg-arcane-panel border border-arcane-border rounded text-arcane-text">
                        MySQL (3306)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mission Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-arcane-border">
                <div>
                  <div className="text-xs text-arcane-muted mb-1">Level:</div>
                  <div className="text-arcane-text font-semibold">{mission.difficulty}</div>
                </div>
                <div>
                  <div className="text-xs text-arcane-muted mb-1">Time Limit:</div>
                  <div className="text-arcane-text font-semibold">{Math.floor(mission.duration / 60)} min</div>
                </div>
              </div>

              {/* Win Condition */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-arcane-text mb-2">
                  Win Condition:
                </h4>
                <p className="text-theme-primary text-sm">
                  Complete {roleObjectives.filter(obj => obj.required).length}/{roleObjectives.length} {currentRole} objectives (Detection + Remediation)
                </p>
              </div>

              {/* Launch Button */}
              <button
                onClick={handleStartMission}
                className="w-full bg-theme-primary hover:bg-theme-secondary text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-lg"
                style={{
                  boxShadow: '0 0 20px var(--theme-glow)'
                }}
              >
                <span>🚀</span>
                Launch Mission Terminal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}