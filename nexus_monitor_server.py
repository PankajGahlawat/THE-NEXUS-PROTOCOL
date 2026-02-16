#!/usr/bin/env python3
"""
NEXUS PROTOCOL - Monitoring & Analytics Server
A comprehensive server for tracking progress, leaderboard, and analytics
for the Nexus Protocol cyber-heist simulation game.
"""

import asyncio
import json
import logging
import sqlite3
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import statistics

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ============================================================================
# CONFIGURATION & ENUMS
# ============================================================================

class AgentRole(str, Enum):
    HACKER = "hacker"
    INFILTRATOR = "infiltrator" 
    ANALYST = "analyst"

class ThreatLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class MissionPhase(str, Enum):
    BEACHHEAD = "PHASE_01_BEACHHEAD"
    PENETRATION = "PHASE_02_PENETRATION"
    EXTRACTION = "PHASE_03_EXTRACTION"

class MissionRank(str, Enum):
    S_RANK = "S-RANK"  # ≥5000 points (Ghost Protocol)
    A_RANK = "A-RANK"  # ≥4000 points (Elite Operative)
    B_RANK = "B-RANK"  # ≥3000 points (Skilled Agent)
    C_RANK = "C-RANK"  # ≥2000 points (Competent)
    D_RANK = "D-RANK"  # ≥1000 points (Rookie)
    F_RANK = "F-RANK"  # <1000 points (Mission Failed)

class DifficultyMode(str, Enum):
    CASUAL = "CASUAL"
    TACTICAL = "TACTICAL"
    HARDENED = "HARDENED"


# ============================================================================
# DATA MODELS
# ============================================================================

@dataclass
class PlayerSession:
    session_id: str
    team_name: str
    selected_agent: AgentRole
    agent_color: str
    authenticated: bool
    mission_progress: float  # 0-100
    threat_level: ThreatLevel
    objectives_completed: List[int]
    time_remaining: int  # seconds
    stealth_rating: float  # 0-100
    trace_level: float  # 0-100
    current_phase: MissionPhase
    difficulty_mode: DifficultyMode
    start_time: datetime
    last_activity: datetime

@dataclass
class MissionObjective:
    id: int
    name: str
    description: str
    phase: MissionPhase
    reward_progress: float
    reward_points: int
    threat_penalty: float
    time_limit: int  # seconds
    required_roles: List[AgentRole]
    completed: bool = False
    completion_time: Optional[datetime] = None

@dataclass
class PerformanceMetrics:
    session_id: str
    technical_precision: float  # 0-100
    creative_adaptation: float  # 0-100
    operative_performance: float  # 0-100
    speed_efficiency: float  # 0-100
    overall_score: float  # 0-100
    final_rank: MissionRank
    hex_shards_earned: int
    xp_earned: int
    achievements_unlocked: List[str]

class SessionUpdate(BaseModel):
    session_id: str
    mission_progress: Optional[float] = None
    threat_level: Optional[ThreatLevel] = None
    objectives_completed: Optional[List[int]] = None
    time_remaining: Optional[int] = None
    stealth_rating: Optional[float] = None
    trace_level: Optional[float] = None
    current_phase: Optional[MissionPhase] = None

class LeaderboardEntry(BaseModel):
    rank: int
    team_name: str
    agent_role: AgentRole
    final_score: float
    mission_rank: MissionRank
    completion_time: str
    stealth_rating: float
    trace_level: float
    difficulty_mode: DifficultyMode


# ============================================================================
# NEXUS PROTOCOL MONITORING SERVER
# ============================================================================

class NexusMonitorServer:
    def __init__(self):
        self.app = FastAPI(title="Nexus Protocol Monitor", version="1.0.0")
        self.setup_cors()
        self.setup_routes()
        
        # In-memory storage (use Redis/database in production)
        self.active_sessions: Dict[str, PlayerSession] = {}
        self.completed_sessions: List[PerformanceMetrics] = []
        self.websocket_connections: List[WebSocket] = []
        
        # Initialize database
        self.init_database()
        
        # Mission objectives configuration
        self.mission_objectives = self._initialize_objectives()
        
        # Analytics data
        self.analytics_cache = {
            'total_sessions': 0,
            'active_sessions': 0,
            'completion_rate': 0.0,
            'average_score': 0.0,
            'popular_roles': {},
            'difficulty_distribution': {},
            'phase_completion_times': {}
        }
        
        # Background tasks will be started when the app starts
        self.background_tasks_started = False

    def setup_cors(self):
        """Configure CORS for web client access"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Configure appropriately for production
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def init_database(self):
        """Initialize SQLite database for persistent storage"""
        self.conn = sqlite3.connect('nexus_protocol.db', check_same_thread=False)
        cursor = self.conn.cursor()
        
        # Sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                team_name TEXT,
                selected_agent TEXT,
                agent_color TEXT,
                mission_progress REAL,
                threat_level TEXT,
                objectives_completed TEXT,
                time_remaining INTEGER,
                stealth_rating REAL,
                trace_level REAL,
                current_phase TEXT,
                difficulty_mode TEXT,
                start_time TEXT,
                end_time TEXT,
                final_score REAL,
                mission_rank TEXT,
                hex_shards_earned INTEGER,
                xp_earned INTEGER
            )
        ''')
        
        # Analytics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                metric_name TEXT,
                metric_value TEXT,
                session_id TEXT
            )
        ''')
        
        self.conn.commit()

    def _initialize_objectives(self) -> Dict[int, MissionObjective]:
        """Initialize mission objectives based on documentation"""
        objectives = {
            # Phase 01: Beachhead
            1: MissionObjective(1, "Establish secure connection", "Connect to OmniCorp network", 
                              MissionPhase.BEACHHEAD, 15.0, 150, 0.0, 1800, [AgentRole.HACKER]),
            2: MissionObjective(2, "Create false identity", "Generate fake credentials", 
                              MissionPhase.BEACHHEAD, 20.0, 200, -10.0, 1800, [AgentRole.INFILTRATOR]),
            3: MissionObjective(3, "Map security systems", "Scan network topology", 
                              MissionPhase.BEACHHEAD, 15.0, 150, 0.0, 1800, [AgentRole.ANALYST]),
            
            # Phase 02: Penetration
            4: MissionObjective(4, "Bypass biometric gateway", "Forge biometric data", 
                              MissionPhase.PENETRATION, 25.0, 250, 0.0, 1680, [AgentRole.INFILTRATOR, AgentRole.HACKER]),
            5: MissionObjective(5, "Escalate privileges", "Gain Tier-5 access", 
                              MissionPhase.PENETRATION, 20.0, 200, 0.0, 1680, [AgentRole.HACKER, AgentRole.ANALYST]),
            6: MissionObjective(6, "Disable alarm systems", "Deploy countermeasures", 
                              MissionPhase.PENETRATION, 15.0, 150, -20.0, 1680, [AgentRole.HACKER]),
            
            # Phase 03: Extraction
            7: MissionObjective(7, "Locate Project Chimera", "Access vault database", 
                              MissionPhase.EXTRACTION, 20.0, 200, 0.0, 1800, [AgentRole.ANALYST]),
            8: MissionObjective(8, "Extract data fragments", "Download 5 fragments", 
                              MissionPhase.EXTRACTION, 30.0, 300, 0.0, 1800, [AgentRole.HACKER, AgentRole.ANALYST]),
            9: MissionObjective(9, "Exfiltrate safely", "Clear traces and escape", 
                              MissionPhase.EXTRACTION, 20.0, 200, 0.0, 1800, [AgentRole.INFILTRATOR])
        }
        return objectives

    def setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.on_event("startup")
        async def startup_event():
            """Start background tasks when the app starts"""
            if not self.background_tasks_started:
                asyncio.create_task(self.analytics_updater())
                asyncio.create_task(self.session_monitor())
                self.background_tasks_started = True
        
        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            await self.handle_websocket(websocket)

        @self.app.post("/api/session/start")
        async def start_session(session_data: dict):
            return await self.start_session(session_data)

        @self.app.put("/api/session/update")
        async def update_session(update: SessionUpdate):
            return await self.update_session(update)

        @self.app.post("/api/session/complete")
        async def complete_session(session_id: str, performance_data: dict):
            return await self.complete_session(session_id, performance_data)

        @self.app.get("/api/leaderboard")
        async def get_leaderboard(limit: int = 50, difficulty: Optional[DifficultyMode] = None):
            return await self.get_leaderboard(limit, difficulty)

        @self.app.get("/api/analytics")
        async def get_analytics():
            return await self.get_analytics()

        @self.app.get("/api/session/{session_id}")
        async def get_session(session_id: str):
            return await self.get_session_data(session_id)

        @self.app.get("/api/objectives")
        async def get_objectives():
            return {obj_id: asdict(obj) for obj_id, obj in self.mission_objectives.items()}

        @self.app.get("/api/health")
        async def health_check():
            return {
                "status": "operational",
                "active_sessions": len(self.active_sessions),
                "websocket_connections": len(self.websocket_connections),
                "timestamp": datetime.now().isoformat()
            }

    async def handle_websocket(self, websocket: WebSocket):
        """Handle WebSocket connections for real-time updates"""
        await websocket.accept()
        self.websocket_connections.append(websocket)
        
        try:
            while True:
                # Keep connection alive and handle incoming messages
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message.get('type') == 'ping':
                    await websocket.send_text(json.dumps({'type': 'pong'}))
                elif message.get('type') == 'subscribe':
                    session_id = message.get('session_id')
                    if session_id in self.active_sessions:
                        session_data = asdict(self.active_sessions[session_id])
                        await websocket.send_text(json.dumps({
                            'type': 'session_update',
                            'data': session_data
                        }))
                        
        except WebSocketDisconnect:
            self.websocket_connections.remove(websocket)

    async def broadcast_update(self, message: dict):
        """Broadcast updates to all connected WebSocket clients"""
        if self.websocket_connections:
            disconnected = []
            for websocket in self.websocket_connections:
                try:
                    await websocket.send_text(json.dumps(message))
                except:
                    disconnected.append(websocket)
            
            # Remove disconnected clients
            for ws in disconnected:
                self.websocket_connections.remove(ws)

    async def start_session(self, session_data: dict) -> dict:
        """Start a new player session"""
        session_id = session_data.get('session_id')
        
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        session = PlayerSession(
            session_id=session_id,
            team_name=session_data.get('team_name', 'Unknown Team'),
            selected_agent=AgentRole(session_data.get('selected_agent', 'analyst')),
            agent_color=session_data.get('agent_color', '#0AC8B9'),
            authenticated=session_data.get('authenticated', False),
            mission_progress=0.0,
            threat_level=ThreatLevel.LOW,
            objectives_completed=[],
            time_remaining=5280,  # 88 minutes total
            stealth_rating=100.0,
            trace_level=0.0,
            current_phase=MissionPhase.BEACHHEAD,
            difficulty_mode=DifficultyMode(session_data.get('difficulty_mode', 'TACTICAL')),
            start_time=datetime.now(),
            last_activity=datetime.now()
        )
        
        self.active_sessions[session_id] = session
        
        # Store in database
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO sessions (session_id, team_name, selected_agent, agent_color, 
                                mission_progress, threat_level, objectives_completed, 
                                time_remaining, stealth_rating, trace_level, current_phase, 
                                difficulty_mode, start_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            session.session_id, session.team_name, session.selected_agent.value,
            session.agent_color, session.mission_progress, session.threat_level.value,
            json.dumps(session.objectives_completed), session.time_remaining,
            session.stealth_rating, session.trace_level, session.current_phase.value,
            session.difficulty_mode.value, session.start_time.isoformat()
        ))
        self.conn.commit()
        
        # Broadcast session start
        await self.broadcast_update({
            'type': 'session_started',
            'session_id': session_id,
            'team_name': session.team_name,
            'agent_role': session.selected_agent.value
        })
        
        logging.info(f"Session started: {session_id} - {session.team_name} ({session.selected_agent.value})")
        
        return {"status": "success", "session_id": session_id}

    async def update_session(self, update: SessionUpdate) -> dict:
        """Update an active session"""
        session_id = update.session_id
        
        if session_id not in self.active_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = self.active_sessions[session_id]
        session.last_activity = datetime.now()
        
        # Update fields if provided
        if update.mission_progress is not None:
            session.mission_progress = update.mission_progress
        if update.threat_level is not None:
            session.threat_level = update.threat_level
        if update.objectives_completed is not None:
            session.objectives_completed = update.objectives_completed
        if update.time_remaining is not None:
            session.time_remaining = update.time_remaining
        if update.stealth_rating is not None:
            session.stealth_rating = update.stealth_rating
        if update.trace_level is not None:
            session.trace_level = update.trace_level
        if update.current_phase is not None:
            session.current_phase = update.current_phase
        
        # Check for critical conditions
        alerts = []
        if session.trace_level >= 90:
            alerts.append("CRITICAL: Trace level at 90% - Burn State imminent!")
        elif session.trace_level >= 75:
            alerts.append("WARNING: High trace level detected")
        
        if session.time_remaining <= 300:  # 5 minutes
            alerts.append("URGENT: Less than 5 minutes remaining")
        
        # Broadcast real-time update
        await self.broadcast_update({
            'type': 'session_update',
            'session_id': session_id,
            'data': asdict(session),
            'alerts': alerts
        })
        
        return {"status": "success", "alerts": alerts}

    async def complete_session(self, session_id: str, performance_data: dict) -> dict:
        """Complete a session and calculate final metrics"""
        if session_id not in self.active_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = self.active_sessions[session_id]
        
        # Calculate performance metrics
        metrics = self._calculate_performance_metrics(session, performance_data)
        
        # Store completed session
        self.completed_sessions.append(metrics)
        
        # Update database
        cursor = self.conn.cursor()
        cursor.execute('''
            UPDATE sessions SET 
                end_time = ?, final_score = ?, mission_rank = ?, 
                hex_shards_earned = ?, xp_earned = ?
            WHERE session_id = ?
        ''', (
            datetime.now().isoformat(), metrics.overall_score, metrics.final_rank.value,
            metrics.hex_shards_earned, metrics.xp_earned, session_id
        ))
        self.conn.commit()
        
        # Remove from active sessions
        del self.active_sessions[session_id]
        
        # Broadcast completion
        await self.broadcast_update({
            'type': 'session_completed',
            'session_id': session_id,
            'final_score': metrics.overall_score,
            'rank': metrics.final_rank.value,
            'team_name': session.team_name
        })
        
        logging.info(f"Session completed: {session_id} - Score: {metrics.overall_score} ({metrics.final_rank.value})")
        
        return {
            "status": "success",
            "performance": asdict(metrics)
        }

    def _calculate_performance_metrics(self, session: PlayerSession, performance_data: dict) -> PerformanceMetrics:
        """Calculate final performance metrics and scoring"""
        
        # Base scoring system from documentation
        base_score = 1000
        
        # Calculate component scores (0-100)
        technical_precision = performance_data.get('technical_precision', 75.0)
        creative_adaptation = performance_data.get('creative_adaptation', 75.0)
        operative_performance = performance_data.get('operative_performance', 75.0)
        
        # Speed efficiency based on time remaining and trace level
        time_efficiency = min(100, (session.time_remaining / 5280) * 100)
        trace_efficiency = max(0, 100 - session.trace_level)
        speed_efficiency = (time_efficiency + trace_efficiency) / 2
        
        # Overall score calculation
        overall_score = (
            technical_precision * 0.4 +
            creative_adaptation * 0.3 +
            operative_performance * 0.2 +
            speed_efficiency * 0.1
        )
        
        # Apply multipliers
        stealth_multiplier = 0.5 + (session.stealth_rating / 100) * 1.5  # 0.5 - 2.0
        time_multiplier = 1.0 + (time_efficiency / 100) * 0.5  # 1.0 - 1.5
        objectives_multiplier = 1.0 + (len(session.objectives_completed) / 9) * 1.0  # 1.0 - 2.0
        
        # Special bonuses
        no_alarms_bonus = 1.5 if session.trace_level < 10 else 1.0
        perfect_run_bonus = 2.0 if session.trace_level == 0 and len(session.objectives_completed) == 9 else 1.0
        
        # Calculate final score
        final_score = (base_score * overall_score / 100) * stealth_multiplier * time_multiplier * objectives_multiplier * no_alarms_bonus * perfect_run_bonus
        
        # Apply penalties
        detection_penalty = session.trace_level * 5  # -5 per % trace
        failed_objectives_penalty = (9 - len(session.objectives_completed)) * 100
        
        final_score = max(0, final_score - detection_penalty - failed_objectives_penalty)
        
        # Determine rank
        if final_score >= 5000:
            rank = MissionRank.S_RANK
        elif final_score >= 4000:
            rank = MissionRank.A_RANK
        elif final_score >= 3000:
            rank = MissionRank.B_RANK
        elif final_score >= 2000:
            rank = MissionRank.C_RANK
        elif final_score >= 1000:
            rank = MissionRank.D_RANK
        else:
            rank = MissionRank.F_RANK
        
        # Calculate rewards
        hex_shards = self._calculate_hex_shards(rank, session.difficulty_mode)
        xp = self._calculate_xp(final_score, len(session.objectives_completed), session.trace_level)
        
        return PerformanceMetrics(
            session_id=session.session_id,
            technical_precision=technical_precision,
            creative_adaptation=creative_adaptation,
            operative_performance=operative_performance,
            speed_efficiency=speed_efficiency,
            overall_score=final_score,
            final_rank=rank,
            hex_shards_earned=hex_shards,
            xp_earned=xp,
            achievements_unlocked=self._check_achievements(session, final_score)
        )

    def _calculate_hex_shards(self, rank: MissionRank, difficulty: DifficultyMode) -> int:
        """Calculate hex-shard rewards based on rank and difficulty"""
        base_rewards = {
            MissionRank.S_RANK: 15,  # 10 Legendary + 5 Mythic
            MissionRank.A_RANK: 22,  # 7 Legendary + 15 Rare
            MissionRank.B_RANK: 25,  # 5 Rare + 20 Uncommon
            MissionRank.C_RANK: 13,  # 3 Rare + 10 Uncommon
            MissionRank.D_RANK: 10,  # 10 Common
            MissionRank.F_RANK: 0
        }
        
        base = base_rewards.get(rank, 0)
        
        # Difficulty multiplier
        if difficulty == DifficultyMode.HARDENED:
            return base * 2
        elif difficulty == DifficultyMode.CASUAL:
            return int(base * 0.7)
        
        return base

    def _calculate_xp(self, final_score: float, objectives_completed: int, trace_level: float) -> int:
        """Calculate XP rewards"""
        base_xp = 1000
        score_bonus = int(final_score * 0.5)
        objective_bonus = objectives_completed * 300
        stealth_bonus = 2000 if trace_level == 0 else (500 if trace_level < 20 else 0)
        
        return base_xp + score_bonus + objective_bonus + stealth_bonus

    def _check_achievements(self, session: PlayerSession, final_score: float) -> List[str]:
        """Check for unlocked achievements"""
        achievements = []
        
        if session.trace_level == 0:
            achievements.append("Ghost Operator")
        
        if final_score >= 5000:
            achievements.append("Elite Performance")
        
        if len(session.objectives_completed) == 9:
            achievements.append("Perfect Mission")
        
        session_duration = (datetime.now() - session.start_time).total_seconds()
        if session_duration < 4500:  # 75 minutes
            achievements.append("Speed Demon")
        
        return achievements

    async def get_leaderboard(self, limit: int = 50, difficulty: Optional[DifficultyMode] = None) -> List[LeaderboardEntry]:
        """Get leaderboard data"""
        # Filter by difficulty if specified
        sessions = self.completed_sessions
        if difficulty:
            # Would need to track difficulty in completed sessions
            pass
        
        # Sort by score descending
        sorted_sessions = sorted(sessions, key=lambda x: x.overall_score, reverse=True)
        
        leaderboard = []
        for i, metrics in enumerate(sorted_sessions[:limit]):
            # Get session data from database
            cursor = self.conn.cursor()
            cursor.execute('SELECT * FROM sessions WHERE session_id = ?', (metrics.session_id,))
            session_data = cursor.fetchone()
            
            if session_data:
                # Format completion time properly
                completion_time = "Unknown"
                if session_data[14]:
                    try:
                        completion_time = str(session_data[14])
                    except:
                        completion_time = "Unknown"
                
                entry = LeaderboardEntry(
                    rank=i + 1,
                    team_name=session_data[1],  # team_name
                    agent_role=AgentRole(session_data[2]),  # selected_agent
                    final_score=metrics.overall_score,
                    mission_rank=metrics.final_rank,
                    completion_time=completion_time,
                    stealth_rating=float(session_data[8]) if session_data[8] else 0.0,  # stealth_rating
                    trace_level=float(session_data[9]) if session_data[9] else 0.0,  # trace_level
                    difficulty_mode=DifficultyMode(session_data[11])  # difficulty_mode
                )
                leaderboard.append(entry)
        
        return leaderboard

    async def get_analytics(self) -> dict:
        """Get comprehensive analytics data"""
        return {
            "overview": self.analytics_cache,
            "active_sessions": len(self.active_sessions),
            "total_completed": len(self.completed_sessions),
            "real_time_metrics": {
                "current_players": len(self.active_sessions),
                "websocket_connections": len(self.websocket_connections),
                "average_session_duration": self._calculate_avg_session_duration(),
                "popular_agent_roles": self._get_popular_roles(),
                "current_threat_levels": self._get_current_threat_levels()
            },
            "performance_distribution": self._get_performance_distribution(),
            "objective_completion_rates": self._get_objective_completion_rates()
        }

    async def get_session_data(self, session_id: str) -> dict:
        """Get detailed session data"""
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            return {
                "status": "active",
                "data": asdict(session),
                "objectives": {
                    obj_id: asdict(obj) for obj_id, obj in self.mission_objectives.items()
                    if obj_id in session.objectives_completed
                }
            }
        else:
            # Check completed sessions
            for metrics in self.completed_sessions:
                if metrics.session_id == session_id:
                    return {
                        "status": "completed",
                        "performance": asdict(metrics)
                    }
            
            raise HTTPException(status_code=404, detail="Session not found")

    def _calculate_avg_session_duration(self) -> float:
        """Calculate average session duration in minutes"""
        if not self.active_sessions:
            return 0.0
        
        durations = []
        now = datetime.now()
        for session in self.active_sessions.values():
            duration = (now - session.start_time).total_seconds() / 60
            durations.append(duration)
        
        return statistics.mean(durations) if durations else 0.0

    def _get_popular_roles(self) -> dict:
        """Get distribution of agent roles"""
        role_counts = {role.value: 0 for role in AgentRole}
        
        for session in self.active_sessions.values():
            role_counts[session.selected_agent.value] += 1
        
        for metrics in self.completed_sessions:
            # Would need to store role in metrics
            pass
        
        return role_counts

    def _get_current_threat_levels(self) -> dict:
        """Get distribution of current threat levels"""
        threat_counts = {level.value: 0 for level in ThreatLevel}
        
        for session in self.active_sessions.values():
            threat_counts[session.threat_level.value] += 1
        
        return threat_counts

    def _get_performance_distribution(self) -> dict:
        """Get distribution of performance ranks"""
        rank_counts = {rank.value: 0 for rank in MissionRank}
        
        for metrics in self.completed_sessions:
            rank_counts[metrics.final_rank.value] += 1
        
        return rank_counts

    def _get_objective_completion_rates(self) -> dict:
        """Get completion rates for each objective"""
        objective_stats = {}
        
        for obj_id, objective in self.mission_objectives.items():
            completed_count = 0
            total_sessions = len(self.completed_sessions)
            
            for session in self.active_sessions.values():
                if obj_id in session.objectives_completed:
                    completed_count += 1
            
            # Add completed sessions (would need to track this)
            
            completion_rate = (completed_count / max(1, total_sessions + len(self.active_sessions))) * 100
            
            objective_stats[obj_id] = {
                "name": objective.name,
                "completion_rate": completion_rate,
                "phase": objective.phase.value
            }
        
        return objective_stats

    async def analytics_updater(self):
        """Background task to update analytics cache"""
        while True:
            try:
                # Update analytics cache every 30 seconds
                self.analytics_cache.update({
                    'total_sessions': len(self.completed_sessions) + len(self.active_sessions),
                    'active_sessions': len(self.active_sessions),
                    'completion_rate': self._calculate_completion_rate(),
                    'average_score': self._calculate_average_score(),
                    'popular_roles': self._get_popular_roles(),
                    'difficulty_distribution': self._get_difficulty_distribution(),
                    'phase_completion_times': self._get_phase_completion_times()
                })
                
                await asyncio.sleep(30)
            except Exception as e:
                logging.error(f"Analytics update error: {e}")
                await asyncio.sleep(30)

    async def session_monitor(self):
        """Background task to monitor session health"""
        while True:
            try:
                now = datetime.now()
                inactive_sessions = []
                
                # Check for inactive sessions (no activity for 10 minutes)
                for session_id, session in self.active_sessions.items():
                    if (now - session.last_activity).total_seconds() > 600:
                        inactive_sessions.append(session_id)
                
                # Clean up inactive sessions
                for session_id in inactive_sessions:
                    logging.info(f"Cleaning up inactive session: {session_id}")
                    del self.active_sessions[session_id]
                
                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logging.error(f"Session monitor error: {e}")
                await asyncio.sleep(60)

    def _calculate_completion_rate(self) -> float:
        """Calculate overall mission completion rate"""
        total = len(self.completed_sessions) + len(self.active_sessions)
        if total == 0:
            return 0.0
        return (len(self.completed_sessions) / total) * 100

    def _calculate_average_score(self) -> float:
        """Calculate average score of completed sessions"""
        if not self.completed_sessions:
            return 0.0
        
        scores = [metrics.overall_score for metrics in self.completed_sessions]
        return statistics.mean(scores)

    def _get_difficulty_distribution(self) -> dict:
        """Get distribution of difficulty modes"""
        diff_counts = {mode.value: 0 for mode in DifficultyMode}
        
        for session in self.active_sessions.values():
            diff_counts[session.difficulty_mode.value] += 1
        
        return diff_counts

    def _get_phase_completion_times(self) -> dict:
        """Get average completion times per phase"""
        # This would require tracking phase completion times
        return {
            "PHASE_01_BEACHHEAD": 28.5,
            "PHASE_02_PENETRATION": 26.3,
            "PHASE_03_EXTRACTION": 29.1
        }


# ============================================================================
# SERVER STARTUP
# ============================================================================

def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('nexus_monitor.log'),
            logging.StreamHandler()
        ]
    )
    
    # Create server instance
    server = NexusMonitorServer()
    
    logging.info("Nexus Protocol Monitor Server initialized")
    logging.info(f"Loaded {len(server.mission_objectives)} mission objectives")
    
    return server.app


if __name__ == "__main__":
    app = create_app()
    
    print("""
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗                ║
║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝                ║
║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗                ║
║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║                ║
║   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║                ║
║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝                ║
║                                                               ║
║              PROTOCOL MONITOR SERVER                          ║
║                                                               ║
║  Real-time monitoring, analytics & leaderboard system        ║
║  for the Nexus Protocol cyber-heist simulation               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Server starting on http://localhost:8000
WebSocket endpoint: ws://localhost:8000/ws
API Documentation: http://localhost:8000/docs

The system is watching. Every action is logged.
""")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=False
    )