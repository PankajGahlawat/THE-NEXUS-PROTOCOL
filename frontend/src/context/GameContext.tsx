/**
 * NEXUS PROTOCOL - Enhanced Game Context
 * Complete game state management with real-time mechanics
 * Version: 2.1.0
 * Last Updated: February 14, 2026
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { MISSIONS } from '../data/missions';

interface Tool {
  id: string;
  name: string;
  category: string;
  cooldown: number;
  traceRisk: string;
  lastUsed?: number;
  isOnCooldown?: boolean;
}

interface Objective {
  id: number;
  description: string;
  reward: number; // mapped from points
  progress: number;
  completed: boolean;
  required: boolean;
  // Enhanced fields
  role?: 'Red Team' | 'Blue Team' | 'Analyst';
  title?: string;
  prompt?: string;
  flag?: string;
  hint?: string;
}

interface Mission {
  id: string;
  name: string;
  duration: number;
  traceThreshold: number;
  objectives: Objective[];
  startTime?: number;
  timeRemaining?: number;
  phase: number;
  maxPhases: number;
}

interface Broadcast {
  id: string;
  message: string;
  type: string;
  timestamp: string;
  expiresAt: string;
}

interface GameState {
  isAuthenticated: boolean;
  currentTeam: string | null;
  selectedAgent: string | null;
  currentMission: Mission | null;
  missionProgress: number;
  traceLevel: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sessionToken: string | null;
  score: number;
  rank: number;
  availableTools: Tool[];
  usedTools: string[];
  missionActive: boolean;
  websocket: WebSocket | null;
  broadcasts: Broadcast[];
}

interface GameContextType {
  gameState: GameState;
  login: (teamName: string, accessCode: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  selectAgent: (agentId: string) => void;
  startMission: (missionId: string) => Promise<void>;
  completeMission: () => void;
  completeObjective: (objectiveId: number) => Promise<void>;
  useTool: (toolId: string, targetData?: any) => Promise<boolean>;
  updateProgress: (progress: number) => void;
  updateTrace: (trace: number) => void;
  calculateScore: () => number;
  getRank: (score: number) => number;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  validateFlag: (objectiveId: number, flag: string) => boolean;
}

const initialGameState: GameState = {
  isAuthenticated: false,
  currentTeam: null,
  selectedAgent: null,
  currentMission: null,
  missionProgress: 0,
  traceLevel: 0,
  threatLevel: 'LOW',
  sessionToken: null,
  score: 0,
  rank: 0,
  availableTools: [],
  usedTools: [],
  missionActive: false,
  websocket: null,
  broadcasts: [],
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const login = useCallback(async (teamName: string, accessCode: string): Promise<{ success: boolean; message?: string }> => {
    // Demo Login Bypass
    if (teamName === 'Ghost' && accessCode === '1234') {
      setGameState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentTeam: teamName,
        sessionToken: 'demo-session-token-2026',
      }));
      return { success: true };
    }

    try {
      const response = await fetch(`http://${window.location.hostname}:3000/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamName, accessCode }),
      });

      if (response.ok) {
        const data = await response.json();
        setGameState(prev => ({
          ...prev,
          isAuthenticated: true,
          currentTeam: teamName,
          sessionToken: data.sessionToken,
        }));
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message || 'Authentication failed' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Optional: Fallback for any other credentials if backend is down? 
      // For now, only explicit demo credentials work without backend.
      return { success: false, message: 'Connection failed. Please check if server is running.' };
    }
  }, []);

  const logout = useCallback(() => {
    setGameState(initialGameState);
  }, []);

  // Poll for Game State (Broadcasts, Threat Level)
  // Poll for Game State (Broadcasts, Threat Level)
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const headers: any = {};
        if (gameState.sessionToken) {
          headers['Authorization'] = `Bearer ${gameState.sessionToken}`;
        }

        const res = await fetch(`http://${window.location.hostname}:3000/api/v1/game/state`, { headers });
        if (res.ok) {
          const response = await res.json();
          if (response.success) {

            // Handle forced logout (Kick)
            if (response.data.forceLogout) {
              logout();
              return;
            }

            setGameState(prev => ({
              ...prev,
              threatLevel: response.data.threatLevel || prev.threatLevel,
              broadcasts: response.data.broadcasts || [],
              // Update other synced fields if available
              missionProgress: response.data.missionProgress ?? prev.missionProgress,
            }));
          }
        }
      } catch (e) { }
    };

    fetchGameState(); // Initial fetch
    const pollInterval = setInterval(fetchGameState, 2000);
    return () => clearInterval(pollInterval);
  }, [gameState.sessionToken, logout]);

  // Mission timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (gameState.missionActive && gameState.currentMission?.timeRemaining && gameState.currentMission.timeRemaining > 0) {
      timer = setInterval(() => {
        setGameState(prev => {
          if (!prev.currentMission || prev.currentMission.timeRemaining! <= 0) {
            return { ...prev, missionActive: false };
          }

          const newTimeRemaining = prev.currentMission.timeRemaining! - 1;

          if (newTimeRemaining <= 0) {
            // Mission failed due to timeout
            return {
              ...prev,
              missionActive: false,
              currentMission: {
                ...prev.currentMission,
                timeRemaining: 0
              }
            };
          }

          return {
            ...prev,
            currentMission: {
              ...prev.currentMission,
              timeRemaining: newTimeRemaining
            }
          };
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState.missionActive, gameState.currentMission?.timeRemaining]);

  // Tool cooldown management
  useEffect(() => {
    const cooldownTimer = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        availableTools: prev.availableTools.map(tool => {
          if (tool.lastUsed && tool.isOnCooldown) {
            const timeSinceUse = Date.now() - tool.lastUsed;
            if (timeSinceUse >= tool.cooldown * 1000) {
              return { ...tool, isOnCooldown: false };
            }
          }
          return tool;
        })
      }));
    }, 1000);

    return () => clearInterval(cooldownTimer);
  }, []);

  const selectAgent = useCallback((agentId: string) => {
    setGameState(prev => ({
      ...prev,
      selectedAgent: agentId,
    }));
  }, []);

  const startMission = useCallback(async (missionId: string) => {
    try {
      // Check local missions first
      const localMission = MISSIONS.find(m => m.id === missionId);

      if (localMission) {
        setGameState(prev => ({
          ...prev,
          currentMission: {
            id: localMission.id,
            name: localMission.name,
            duration: localMission.duration,
            traceThreshold: localMission.traceThreshold,
            objectives: localMission.objectives.map(obj => ({
              id: obj.id,
              description: obj.description,
              reward: obj.points,
              progress: 0,
              completed: false,
              required: obj.required,
              role: obj.role,
              title: obj.title,
              prompt: obj.prompt,
              flag: obj.flag,
              hint: obj.hint
            })),
            startTime: Date.now(),
            timeRemaining: localMission.duration,
            phase: 1,
            maxPhases: localMission.phases
          },
          missionProgress: 0,
          traceLevel: 0,
          threatLevel: 'LOW',
          score: 0,
          rank: 0,
          // Initialize with some default tools if not fetched from backend
          availableTools: prev.availableTools.length > 0 ? prev.availableTools : [
            { id: 'network-scanner', name: 'Network Scanner', category: 'recon', cooldown: 5, traceRisk: 'low', isOnCooldown: false },
            { id: 'data-injector', name: 'Data Injector', category: 'exploit', cooldown: 10, traceRisk: 'high', isOnCooldown: false },
            { id: 'trace-cleaner', name: 'Trace Cleaner', category: 'defense', cooldown: 15, traceRisk: 'none', isOnCooldown: false }
          ],
          usedTools: [],
          missionActive: true,
        }));
        return;
      }

      // Fallback to backend fetch
      const missionResponse = await fetch(`http://${window.location.hostname}:3000/api/v1/missions`);
      const missionsData = await missionResponse.json();
      const mission = missionsData.data.missions.find((m: any) => m.id === missionId);

      if (!mission) {
        throw new Error('Mission not found');
      }

      // Fetch available tools
      const toolsResponse = await fetch(`http://${window.location.hostname}:3000/api/v1/tools`);
      const toolsData = await toolsResponse.json();

      // Start mission on backend
      const startResponse = await fetch(`http://${window.location.hostname}:3000/api/v1/missions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          missionId,
          selectedAgent: gameState.selectedAgent
        }),
      });

      if (startResponse.ok) {
        await startResponse.json();

        setGameState(prev => ({
          ...prev,
          currentMission: {
            id: mission.id,
            name: mission.name,
            duration: mission.duration,
            traceThreshold: mission.traceThreshold,
            objectives: mission.objectives.map((obj: any) => ({
              ...obj,
              completed: false
            })),
            startTime: Date.now(),
            timeRemaining: mission.duration,
            phase: 1,
            maxPhases: mission.phases || 3
          },
          missionProgress: 0,
          traceLevel: 0,
          threatLevel: 'LOW',
          score: 0,
          rank: 0,
          availableTools: Object.values(toolsData.data.tools).map((tool: any) => ({
            ...tool,
            isOnCooldown: false,
            lastUsed: 0
          })),
          usedTools: [],
          missionActive: true,
        }));
      }
    } catch (error) {
      console.error('Failed to start mission:', error);
    }
  }, [gameState.selectedAgent, gameState.availableTools]);

  const completeMission = useCallback(() => {
    const finalScore = calculateScore();
    const finalRank = getRank(finalScore);

    setGameState(prev => ({
      ...prev,
      missionActive: false,
      score: finalScore,
      rank: finalRank,
    }));
  }, []);

  const completeObjective = useCallback(async (objectiveId: number) => {
    try {
      const response = await fetch(`http://${window.location.hostname}:3000/api/v1/missions/objective/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          missionId: gameState.currentMission?.id,
          objectiveId,
          toolsUsed: gameState.usedTools
        }),
      });

      if (response.ok) {
        const data = await response.json();

        setGameState(prev => {
          if (!prev.currentMission) return prev;

          const updatedObjectives = prev.currentMission.objectives.map(obj =>
            obj.id === objectiveId ? { ...obj, completed: true } : obj
          );

          const newProgress = prev.missionProgress + data.data.progressGain;


          // Check if mission is complete
          const requiredObjectives = updatedObjectives.filter(obj => obj.required);
          const completedRequired = requiredObjectives.filter(obj => obj.completed).length;
          const missionComplete = completedRequired === requiredObjectives.length;

          return {
            ...prev,
            currentMission: {
              ...prev.currentMission,
              objectives: updatedObjectives
            },
            missionProgress: Math.min(100, newProgress),
            score: prev.score + data.data.reward,
            missionActive: !missionComplete
          };
        });
      }
    } catch (error) {
      console.error('Failed to complete objective:', error);
    }
  }, [gameState.currentMission?.id, gameState.usedTools]);

  const useTool = useCallback(async (toolId: string, targetData?: any): Promise<boolean> => {
    try {
      const tool = gameState.availableTools.find(t => t.id === toolId);
      if (!tool || tool.isOnCooldown) {
        return false;
      }

      const response = await fetch(`http://${window.location.hostname}:3000/api/v1/tools/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolId,
          missionId: gameState.currentMission?.id,
          targetData
        }),
      });

      if (response.ok) {
        const data = await response.json();

        setGameState(prev => {
          const traceIncrease = data.effects.traceIncrease;
          const newTrace = Math.min(100, prev.traceLevel + traceIncrease);

          let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
          if (newTrace >= 75) threatLevel = 'CRITICAL';
          else if (newTrace >= 50) threatLevel = 'HIGH';
          else if (newTrace >= 25) threatLevel = 'MEDIUM';

          return {
            ...prev,
            traceLevel: newTrace,
            threatLevel,
            missionProgress: Math.min(100, prev.missionProgress + data.effects.progressGain),
            availableTools: prev.availableTools.map(t =>
              t.id === toolId
                ? { ...t, isOnCooldown: true, lastUsed: Date.now() }
                : t
            ),
            usedTools: [...prev.usedTools, toolId]
          };
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to use tool:', error);
      return false;
    }
  }, [gameState.availableTools, gameState.currentMission?.id, gameState.traceLevel, gameState.missionProgress]);

  const updateProgress = useCallback((progress: number) => {
    setGameState(prev => ({
      ...prev,
      missionProgress: Math.max(0, Math.min(100, progress)),
    }));
  }, []);

  const updateTrace = useCallback((trace: number) => {
    setGameState(prev => {
      const newTrace = Math.max(0, Math.min(100, trace));
      let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

      if (newTrace >= 75) threatLevel = 'CRITICAL';
      else if (newTrace >= 50) threatLevel = 'HIGH';
      else if (newTrace >= 25) threatLevel = 'MEDIUM';

      return {
        ...prev,
        traceLevel: newTrace,
        threatLevel,
      };
    });
  }, []);

  const calculateScore = useCallback((): number => {
    return gameState.score;
  }, [gameState.score]);

  const getRank = useCallback((score: number): number => {
    if (score >= 100) return 3;
    if (score >= 70) return 2;
    if (score >= 30) return 1;
    return 0;
  }, []);

  const validateFlag = useCallback((objectiveId: number, flag: string): boolean => {
    if (!gameState.currentMission) return false;

    const objective = gameState.currentMission.objectives.find(o => o.id === objectiveId);
    if (!objective || !objective.flag) return false;

    // Case insensitive check can be good for some flags, but usually flags are exact matches.
    // However, for user friendliness, we might want to trim.
    const isValid = objective.flag === flag.trim();

    if (isValid && !objective.completed) {
      // Auto-complete the objective if valid
      // We don't wait for backend since this is a client-side challenge mode
      completeObjective(objectiveId);
    }

    return isValid;
  }, [gameState.currentMission, completeObjective]);

  const connectWebSocket = useCallback(() => {
    if (gameState.websocket) return;

    try {
      const ws = new WebSocket(`ws://${window.location.hostname}:3000`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setGameState(prev => ({ ...prev, websocket: ws }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Handle real-time updates
        if (data.type === 'mission_update') {
          setGameState(prev => ({
            ...prev,
            missionProgress: data.progress,
            traceLevel: data.traceLevel
          }));
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setGameState(prev => ({ ...prev, websocket: null }));
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [gameState.websocket]);

  const disconnectWebSocket = useCallback(() => {
    if (gameState.websocket) {
      gameState.websocket.close();
      setGameState(prev => ({ ...prev, websocket: null }));
    }
  }, [gameState.websocket]);

  const contextValue: GameContextType = {
    gameState,
    login,
    logout,
    selectAgent,
    startMission,
    completeMission,
    completeObjective,
    useTool,
    updateProgress,
    updateTrace,
    calculateScore,
    getRank,
    connectWebSocket,
    disconnectWebSocket,
    validateFlag,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}