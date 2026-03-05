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
import MissionTerminal from './MissionTerminal';
import { gsap } from '../../lib/gsap';

export default function MissionUI() {
  const { gameState, completeObjective, useTool, calculateScore, getRank, connectWebSocket, validateFlag } = useGame();

  const [showToolsInterface, setShowToolsInterface] = useState(false);
  const [showQuickReference, setShowQuickReference] = useState(false);
  const [terminalFullscreen, setTerminalFullscreen] = useState(false);
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

  // Terminal Fullscreen View
  if (terminalFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-arcane-dark">
        <div className="h-full flex flex-col">
          <div className="bg-arcane-panel border-b border-arcane-border p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-arcane-teal">Mission Terminal - Fullscreen</h2>
            <button
              onClick={() => setTerminalFullscreen(false)}
              className="px-4 py-2 bg-theme-primary text-white rounded hover:bg-theme-secondary transition-colors"
            >
              Exit Fullscreen
            </button>
          </div>
          <div className="flex-1">
            <MissionTerminal />
          </div>
        </div>
      </div>
    );
  }

  const openLogsInNewTab = () => {
    const logsWindow = window.open('', '_blank');
    if (logsWindow) {
      logsWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>System Logs - Nexus Protocol</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: #0a0a0a;
              color: #00ff00;
              font-family: 'Courier New', monospace;
              font-size: 14px;
            }
            h1 {
              color: #0ac8b9;
              border-bottom: 2px solid #0ac8b9;
              padding-bottom: 10px;
            }
            .log-entry {
              padding: 10px;
              margin: 5px 0;
              border-radius: 4px;
              border: 1px solid #333;
            }
            .log-success {
              color: #10b981;
              background: rgba(16, 185, 129, 0.1);
              border-color: rgba(16, 185, 129, 0.3);
            }
            .log-warning {
              color: #f59e0b;
              background: rgba(245, 158, 11, 0.1);
              border-color: rgba(245, 158, 11, 0.3);
            }
            .log-error {
              color: #ef4444;
              background: rgba(239, 68, 68, 0.1);
              border-color: rgba(239, 68, 68, 0.3);
            }
            .log-info {
              color: #888;
              background: rgba(136, 136, 136, 0.1);
              border-color: #333;
            }
            .timestamp {
              opacity: 0.7;
            }
          </style>
        </head>
        <body>
          <h1>NEXUS PROTOCOL - System Logs</h1>
          <div id="logs">
            ${systemLogs.map(log => `
              <div class="log-entry log-${log.type}">
                <span class="timestamp">[${log.time}]</span> ${log.message}
              </div>
            `).join('')}
          </div>
        </body>
        </html>
      `);
      logsWindow.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-arcane-dark">
      {/* Enhanced Header */}
      <div className="bg-arcane-panel border-b border-arcane-border p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
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

      {/* Full Page Terminal with Fullscreen Button */}
      <div className="relative h-[calc(100vh-120px)]">
        <button
          onClick={() => setTerminalFullscreen(true)}
          className="absolute top-4 right-4 z-10 px-3 py-2 bg-theme-primary/80 hover:bg-theme-primary text-white rounded text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Fullscreen
        </button>
        <MissionTerminal />
      </div>

      {/* System Logs - Blue Team Only - Fixed at bottom with Fullscreen Button */}
      {gameState.teamType === 'blue' && (
        <div className="fixed bottom-0 left-0 right-0 bg-arcane-panel border-t border-arcane-border p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold text-arcane-text">
                System Logs
              </h4>
              <button
                onClick={openLogsInNewTab}
                className="px-3 py-1 bg-theme-primary/80 hover:bg-theme-primary text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in New Tab
              </button>
            </div>
            <div className="space-y-1 text-xs font-mono max-h-24 overflow-y-auto">
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
          </div>
        </div>
      )}
    </div>
  );
}
