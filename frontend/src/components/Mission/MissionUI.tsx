/**
 * NEXUS PROTOCOL - Enhanced Mission UI Component
 * Real-time mission gameplay interface with actual game mechanics
 * Version: 3.0.0
 * Last Updated: February 5, 2026
 */

import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import NexusButton from '../UI/NexusButton';
import NexusCard from '../UI/NexusCard';
import ToolsInterface from './ToolsInterface';
import ToolsQuickReference from './ToolsQuickReference';
import { gsap } from '../../lib/gsap';

export default function MissionUI() {
  const { gameState, completeObjective, useTool, calculateScore, getRank, connectWebSocket, validateFlag } = useGame();

  const [showToolsInterface, setShowToolsInterface] = useState(false);
  const [showQuickReference, setShowQuickReference] = useState(false);
  const [systemLogs, setSystemLogs] = useState<{ time: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }[]>([
    { time: new Date().toLocaleTimeString(), message: 'Mission initialized', type: 'success' },
    { time: new Date().toLocaleTimeString(), message: 'Scanning network topology...', type: 'info' },
    { time: new Date().toLocaleTimeString(), message: 'Establishing secure connection...', type: 'info' }
  ]);

  const [toolCooldowns, setToolCooldowns] = useState<Record<string, number>>({});

  const progressBarRef = useRef<HTMLDivElement>(null);
  const traceBarRef = useRef<HTMLDivElement>(null);
  const objectiveRefs = useRef<Record<number, HTMLDivElement>>({});

  // Connect WebSocket on mount
  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  // Animate progress and trace bars
  useEffect(() => {
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: `${gameState.missionProgress}%`,
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  }, [gameState.missionProgress]);

  useEffect(() => {
    if (traceBarRef.current) {
      const color = gameState.traceLevel < 25 ? '#10b981' :
        gameState.traceLevel < 50 ? '#f59e0b' :
          gameState.traceLevel < 75 ? '#f97316' : '#ef4444';

      gsap.to(traceBarRef.current, {
        width: `${gameState.traceLevel}%`,
        backgroundColor: color,
        duration: 0.6,
        ease: 'power2.out'
      });
    }
  }, [gameState.traceLevel]);

  // Tool cooldown management
  useEffect(() => {
    const interval = setInterval(() => {
      setToolCooldowns(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(toolId => {
          if (updated[toolId] > 0) {
            updated[toolId] -= 1;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addSystemLog = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const newLog = {
      time: new Date().toLocaleTimeString(),
      message,
      type
    };
    setSystemLogs(prev => [newLog, ...prev.slice(0, 9)]);
  };

  const handleFlagSubmit = async (objectiveId: number, flag: string) => {
    const isValid = validateFlag(objectiveId, flag);

    if (isValid) {
      addSystemLog(`Flag accepted! Authorization granted.`, 'success');
      // Animate objective completion
      const objectiveElement = objectiveRefs.current[objectiveId];
      if (objectiveElement) {
        gsap.to(objectiveElement, {
          scale: 1.05,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut'
        });
      }
    } else {
      addSystemLog(`Invalid flag submitted. Access denied.`, 'error');
      // Shake animation for error
      const objectiveElement = objectiveRefs.current[objectiveId];
      if (objectiveElement) {
        gsap.to(objectiveElement, {
          x: 10,
          duration: 0.1,
          yoyo: true,
          repeat: 5,
          ease: 'power2.inOut'
        });
      }
    }
  };

  const handleObjectiveComplete = async (objectiveId: number) => {
    try {
      await completeObjective(objectiveId);

      // Animate objective completion
      const objectiveElement = objectiveRefs.current[objectiveId];
      if (objectiveElement) {
        gsap.to(objectiveElement, {
          scale: 1.05,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut'
        });
      }

      addSystemLog(`Objective completed: ${gameState.currentMission?.objectives.find(o => o.id === objectiveId)?.description}`, 'success');
    } catch (error) {
      addSystemLog('Failed to complete objective', 'error');
    }
  };

  const handleToolUse = async (toolId: string) => {
    if (toolCooldowns[toolId] > 0) {
      addSystemLog(`Tool ${toolId} is on cooldown`, 'warning');
      return;
    }

    const success = await useTool(toolId);
    if (success) {
      const tool = gameState.availableTools.find(t => t.id === toolId);
      if (tool) {
        setToolCooldowns(prev => ({ ...prev, [toolId]: tool.cooldown }));
        addSystemLog(`Tool "${tool.name}" executed successfully`, 'success');

        // Visual feedback for tool usage
        const toolButton = document.querySelector(`[data-tool-id="${toolId}"]`);
        if (toolButton) {
          gsap.fromTo(toolButton,
            { scale: 1, boxShadow: '0 0 0px rgba(10, 200, 185, 0)' },
            {
              scale: 1.1,
              boxShadow: '0 0 20px rgba(10, 200, 185, 0.8)',
              duration: 0.3,
              yoyo: true,
              repeat: 1,
              ease: 'power2.inOut'
            }
          );
        }
      }
    } else {
      addSystemLog(`Failed to use tool ${toolId}`, 'error');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTraceColor = () => {
    if (gameState.traceLevel < 25) return 'text-green-400';
    if (gameState.traceLevel < 50) return 'text-yellow-400';
    if (gameState.traceLevel < 75) return 'text-orange-400';
    return 'text-red-400';
  };

  const getCurrentScore = () => {
    return calculateScore();
  };

  const getCurrentRank = () => {
    return getRank(getCurrentScore());
  };

  // If quick reference is active, render it
  if (showQuickReference) {
    return (
      <ToolsQuickReference
        onClose={() => setShowQuickReference(false)}
      />
    );
  }

  // If tools interface is active, render it
  if (showToolsInterface) {
    return (
      <ToolsInterface
        onToolUse={handleToolUse}
        onClose={() => setShowToolsInterface(false)}
      />
    );
  }

  if (!gameState.currentMission) {
    return (
      <div className="min-h-screen bg-arcane-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-theme-primary mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-arcane-text mb-4">No Active Mission</h2>
          <p className="text-arcane-muted">Please select a mission to begin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-arcane-dark">
      {/* Enhanced Header */}
      <div className="bg-arcane-panel border-b border-arcane-border p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-display text-arcane-teal">
              {gameState.currentMission.name}
            </h1>
            <p className="text-sm text-arcane-muted">
              Agent: {gameState.selectedAgent?.toUpperCase()} | Team: {gameState.currentTeam} | Phase: {gameState.currentMission.phase}/{gameState.currentMission.maxPhases}
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-xs text-arcane-muted">Time Remaining</div>
              <div className={`text-lg font-mono ${gameState.currentMission.timeRemaining && gameState.currentMission.timeRemaining < 300 ? 'text-red-400' : 'text-arcane-text'}`}>
                {gameState.currentMission.timeRemaining ? formatTime(gameState.currentMission.timeRemaining) : '--:--'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-arcane-muted">Score</div>
              <div className="text-lg font-mono text-theme-primary">
                {getCurrentScore().toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-arcane-muted">Rank</div>
              <div className={`text-lg font-bold ${getCurrentRank() === 3 ? 'text-yellow-400' :
                getCurrentRank() === 2 ? 'text-green-400' :
                  getCurrentRank() === 1 ? 'text-blue-400' : 'text-red-400'}`}>
                RANK {getCurrentRank()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Mission Status */}
          <div className="space-y-6">
            <NexusCard>
              <h3 className="text-lg font-bold font-display text-arcane-text mb-4">
                Mission Status
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-arcane-muted">Progress</span>
                    <span className="text-arcane-text">{Math.round(gameState.missionProgress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-arcane-border rounded-full overflow-hidden">
                    <div
                      ref={progressBarRef}
                      className="h-full bg-gradient-to-r from-theme-primary to-theme-accent transition-all duration-500"
                      style={{ width: '0%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-arcane-muted">Trace Level</span>
                    <span className={getTraceColor()}>{Math.round(gameState.traceLevel)}%</span>
                  </div>
                  <div className="w-full h-2 bg-arcane-border rounded-full overflow-hidden">
                    <div
                      ref={traceBarRef}
                      className="h-full transition-all duration-500"
                      style={{ width: '0%' }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-arcane-border">
                  <div className="text-xs text-arcane-muted mb-1">Threat Level</div>
                  <div className={`text-sm font-semibold ${gameState.threatLevel === 'LOW' ? 'text-green-400' :
                    gameState.threatLevel === 'MEDIUM' ? 'text-yellow-400' :
                      gameState.threatLevel === 'HIGH' ? 'text-orange-400' : 'text-red-400'
                    }`}>
                    {gameState.threatLevel}
                  </div>
                </div>
              </div>
            </NexusCard>

            <NexusCard>
              <h3 className="text-lg font-bold font-display text-arcane-text mb-4">
                Phase Objectives
              </h3>

              <div className="space-y-3">
                {gameState.currentMission.objectives
                  .filter(objective => {
                    const agentRole =
                      gameState.selectedAgent === 'hacker' ? 'Red Team' :
                        gameState.selectedAgent === 'infiltrator' ? 'Blue Team' : 'Red Team';
                    return objective.role === agentRole;
                  })
                  .map((objective) => (
                    <div
                      key={objective.id}
                      ref={el => { if (el) objectiveRefs.current[objective.id] = el; }}
                      className={`flex flex-col p-4 rounded-lg border transition-all duration-300 ${objective.completed
                        ? 'border-green-500/30 bg-green-500/10'
                        : 'border-arcane-border bg-arcane-panel/50 hover:border-theme-primary/50'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div
                            className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center transition-all duration-300 ${objective.completed
                              ? 'border-green-500 bg-green-500'
                              : 'border-arcane-border'
                              }`}
                          >
                            {objective.completed && (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h4 className={`text-base font-bold ${objective.completed ? 'text-green-400' : 'text-arcane-text'}`}>
                              {objective.title || objective.description.substring(0, 30)}
                            </h4>
                            {objective.role && (
                              <span className={`text-xs px-2 py-0.5 rounded border ${objective.role === 'Red Team' ? 'border-red-500/50 text-red-400 bg-red-500/10' :
                                objective.role === 'Blue Team' ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' :
                                  'border-purple-500/50 text-purple-400 bg-purple-500/10'
                                }`}>
                                {objective.role.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-arcane-muted font-mono">
                          +{objective.reward} PTS
                        </div>
                      </div>

                      <div className="pl-9 space-y-3">
                        <p className="text-sm text-arcane-muted">
                          {objective.description}
                        </p>

                        {objective.prompt && (
                          <div className="bg-black/30 p-3 rounded border border-arcane-border/50 font-mono text-sm text-gray-300">
                            <span className="text-theme-primary opacity-70 block mb-1">COMMAND //</span>
                            {objective.prompt}
                          </div>
                        )}

                        {!objective.completed && objective.flag && (
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter Flag (e.g. CTF{...})"
                              className="bg-arcane-bg border border-arcane-border rounded px-3 py-1.5 text-sm text-arcane-text focus:border-theme-primary focus:outline-none w-full font-mono"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  // Find the button and click it, or just call handler if we extracted it
                                  const val = e.currentTarget.value;
                                  if (val) handleFlagSubmit(objective.id, val);
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                            <NexusButton
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                // Need to traverse to find input or use state. 
                                // Using simple DOM traversal for this quick implementation or controlled state (preferred but needs refactor)
                                // Let's rely on the onKeyDown or make this button find the previous sibling input
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                if (input && input.value) {
                                  handleFlagSubmit(objective.id, input.value);
                                  input.value = '';
                                }
                              }}
                            >
                              Submit
                            </NexusButton>
                          </div>
                        )}

                        {!objective.completed && !objective.flag && (
                          <NexusButton
                            variant="tool"
                            size="sm"
                            onClick={() => handleObjectiveComplete(objective.id)}
                          >
                            Execute
                          </NexusButton>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </NexusCard>
          </div>

          {/* Center Panel - Main Interface */}
          <div className="lg:col-span-2">
            <NexusCard className="h-96 mb-6">
              <div className="text-center py-20">
                <div className="text-6xl text-theme-primary mb-4">
                  🎯
                </div>
                <h3 className="text-2xl font-bold font-display text-arcane-text mb-4">
                  Mission Interface Active
                </h3>
                <p className="text-arcane-muted mb-8">
                  Execute objectives to progress through the mission phases.
                  Monitor your trace level to avoid detection.
                </p>

                <div className="grid grid-cols-5 gap-3 max-w-2xl mx-auto">
                  <NexusButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowToolsInterface(true)}
                  >
                    🛠️ Tools
                  </NexusButton>
                  <NexusButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowQuickReference(true)}
                  >
                    📋 Guide
                  </NexusButton>
                  <NexusButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToolUse('network-scanner')}
                    disabled={toolCooldowns['network-scanner'] > 0}
                  >
                    📡 Scan {toolCooldowns['network-scanner'] > 0 && `(${toolCooldowns['network-scanner']}s)`}
                  </NexusButton>
                  <NexusButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToolUse('data-injector')}
                    disabled={toolCooldowns['data-injector'] > 0}
                  >
                    💾 Extract {toolCooldowns['data-injector'] > 0 && `(${toolCooldowns['data-injector']}s)`}
                  </NexusButton>
                  <NexusButton
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToolUse('trace-cleaner')}
                    disabled={toolCooldowns['trace-cleaner'] > 0}
                  >
                    🔒 Clean {toolCooldowns['trace-cleaner'] > 0 && `(${toolCooldowns['trace-cleaner']}s)`}
                  </NexusButton>
                </div>
              </div>
            </NexusCard>

            <div className="grid grid-cols-2 gap-6">
              <NexusCard>
                <h4 className="text-sm font-semibold text-arcane-text mb-3">
                  System Logs
                </h4>
                <div className="space-y-1 text-xs font-mono max-h-32 overflow-y-auto">
                  {systemLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`${log.type === 'success' ? 'text-green-400' :
                        log.type === 'warning' ? 'text-yellow-400' :
                          log.type === 'error' ? 'text-red-400' :
                            'text-arcane-muted'
                        }`}
                    >
                      [{log.time}] {log.message}
                    </div>
                  ))}
                </div>
              </NexusCard>

              <NexusCard>
                <h4 className="text-sm font-semibold text-arcane-text mb-3">
                  Quick Tools
                </h4>
                <div className="space-y-2">
                  {gameState.availableTools.slice(0, 3).map((tool) => (
                    <NexusButton
                      key={tool.id}
                      variant="tool"
                      size="sm"
                      fullWidth
                      onClick={() => handleToolUse(tool.id)}
                      disabled={tool.isOnCooldown || toolCooldowns[tool.id] > 0}
                      data-tool-id={tool.id}
                    >
                      {tool.name} {(tool.isOnCooldown || toolCooldowns[tool.id] > 0) &&
                        `(${toolCooldowns[tool.id] || Math.ceil((tool.cooldown * 1000 - (Date.now() - (tool.lastUsed || 0))) / 1000)}s)`}
                    </NexusButton>
                  ))}
                </div>
              </NexusCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}