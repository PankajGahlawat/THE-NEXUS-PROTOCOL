/**
 * NEXUS PROTOCOL - Leaderboard Context
 * Tracks vulnerability completions and awards difficulty-based points.
 * Persisted in localStorage so data survives page refresh.
 *
 * Points:  Beginner = 15 | Intermediate = 30 | Advanced = 100
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

/* ── Types ── */
export type VulnLevel = 'beginner' | 'intermediate' | 'advanced';

export interface CompletedVuln {
  vulnId: string;
  vulnName: string;
  level: VulnLevel;
  points: number;
  branch: string;       // e.g. "Branch A — Andheri"
  round: number;        // 1 or 2
  completedAt: string;  // ISO timestamp
}

export interface PlayerScore {
  teamName: string;
  totalPoints: number;
  completedVulns: CompletedVuln[];
}

interface LeaderboardContextType {
  /** All completed vulns for the current player */
  completedVulns: CompletedVuln[];
  /** Total points for Round 1 */
  round1Total: number;
  /** Mark a vuln as completed and award points */
  markVulnCompleted: (vulnId: string, vulnName: string, level: VulnLevel, branch: string, round: number) => void;
  /** Check if a vuln is already completed */
  isVulnCompleted: (vulnId: string) => boolean;
  /** Get breakdown for a specific round */
  getPointsBreakdown: (round: number) => CompletedVuln[];
  /** Get subtotals per difficulty for a round */
  getDifficultySubtotals: (round: number) => { level: VulnLevel; count: number; points: number }[];
  /** Clear all data for a round */
  resetRound: (round: number) => void;
  /** Current team name */
  teamName: string;
}

/* ── Point values per difficulty ── */
const POINTS_MAP: Record<VulnLevel, number> = {
  beginner: 15,
  intermediate: 30,
  advanced: 100,
};

/* ── localStorage key ── */
const STORAGE_KEY = 'nexus-leaderboard';

/* ── Helpers ── */
function loadFromStorage(): CompletedVuln[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(vulns: CompletedVuln[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vulns));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

/* ── Context ── */
const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined);

export function LeaderboardProvider({ children }: { children: ReactNode }) {
  const [completedVulns, setCompletedVulns] = useState<CompletedVuln[]>(loadFromStorage);

  // Derive team name from GameContext if available, fallback to localStorage
  const [teamName] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('nexus-team-name');
      return raw || 'Agent';
    } catch {
      return 'Agent';
    }
  });

  // Persist on every change
  useEffect(() => {
    saveToStorage(completedVulns);
  }, [completedVulns]);

  const markVulnCompleted = useCallback(
    (vulnId: string, vulnName: string, level: VulnLevel, branch: string, round: number) => {
      setCompletedVulns((prev) => {
        if (prev.some((v) => v.vulnId === vulnId)) return prev; // already done
        return [
          ...prev,
          {
            vulnId,
            vulnName,
            level,
            points: POINTS_MAP[level],
            branch,
            round,
            completedAt: new Date().toISOString(),
          },
        ];
      });
    },
    []
  );

  const isVulnCompleted = useCallback(
    (vulnId: string) => completedVulns.some((v) => v.vulnId === vulnId),
    [completedVulns]
  );

  const getPointsBreakdown = useCallback(
    (round: number) => completedVulns.filter((v) => v.round === round),
    [completedVulns]
  );

  const getDifficultySubtotals = useCallback(
    (round: number): { level: VulnLevel; count: number; points: number }[] => {
      const roundVulns = completedVulns.filter((v) => v.round === round);
      const levels: VulnLevel[] = ['beginner', 'intermediate', 'advanced'];
      return levels.map((level) => {
        const matched = roundVulns.filter((v) => v.level === level);
        return {
          level,
          count: matched.length,
          points: matched.reduce((sum, v) => sum + v.points, 0),
        };
      });
    },
    [completedVulns]
  );

  const resetRound = useCallback((round: number) => {
    setCompletedVulns((prev) => prev.filter((v) => v.round !== round));
  }, []);

  const round1Total = completedVulns
    .filter((v) => v.round === 1)
    .reduce((sum, v) => sum + v.points, 0);

  return (
    <LeaderboardContext.Provider
      value={{
        completedVulns,
        round1Total,
        markVulnCompleted,
        isVulnCompleted,
        getPointsBreakdown,
        getDifficultySubtotals,
        resetRound,
        teamName,
      }}
    >
      {children}
    </LeaderboardContext.Provider>
  );
}

export function useLeaderboard() {
  const ctx = useContext(LeaderboardContext);
  if (!ctx) throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  return ctx;
}
