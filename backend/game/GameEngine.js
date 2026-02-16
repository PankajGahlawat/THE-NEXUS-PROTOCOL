// Game Engine for Nexus Protocol
// Handles mission logic, scoring, and game mechanics

class GameEngine {
  constructor() {
    this.missionTypes = this.initializeMissionTypes();
    this.agents = this.initializeAgents();
    this.achievements = this.initializeAchievements();
  }

  initializeMissionTypes() {
    return {
      FALSE_FLAG: {
        id: 'FALSE_FLAG',
        name: 'Brand the Breach',
        type: 'deception',
        duration: 1800, // 30 minutes
        difficulty: 'medium',
        description: 'Forge a false-flag corporate identity',
        tagline: 'Plant the lie. Steal the truth.',
        phases: [
          {
            id: 1,
            name: 'Beachhead',
            duration: 600, // 10 minutes
            objectives: [
              { id: 1, description: 'Establish secure connection', reward: 15, required: true },
              { id: 2, description: 'Create false identity', reward: 20, required: true, threatReduction: 10 },
              { id: 3, description: 'Map security systems', reward: 15, required: true }
            ]
          },
          {
            id: 2,
            name: 'Penetration',
            duration: 720, // 12 minutes
            objectives: [
              { id: 4, description: 'Bypass initial firewall', reward: 25, required: true },
              { id: 5, description: 'Plant decoy telemetry', reward: 20, required: true },
              { id: 6, description: 'Establish digital footprint', reward: 15, required: false }
            ]
          },
          {
            id: 3,
            name: 'Extraction',
            duration: 480, // 8 minutes
            objectives: [
              { id: 7, description: 'Verify proof of existence', reward: 20, required: true },
              { id: 8, description: 'Clean traces', reward: 15, required: true },
              { id: 9, description: 'Exfiltrate safely', reward: 25, required: true }
            ]
          }
        ],
        traceThreshold: 25,
        successCriteria: 'Complete all required objectives',
        failureCondition: 'Detection > 90% OR Time expires'
      },
      
      BIOMETRIC_BLUFF: {
        id: 'BIOMETRIC_BLUFF',
        name: 'Identity Forge',
        type: 'infiltration',
        duration: 1680, // 28 minutes
        difficulty: 'high',
        description: 'Bypass biometric security through social engineering',
        primaryRole: 'infiltrator',
        phases: [
          {
            id: 1,
            name: 'Reconnaissance',
            duration: 560, // ~9 minutes
            objectives: [
              { id: 1, description: 'Identify target personnel', reward: 20, required: true },
              { id: 2, description: 'Gather biometric samples', reward: 25, required: true },
              { id: 3, description: 'Map security protocols', reward: 15, required: false }
            ]
          },
          {
            id: 2,
            name: 'Fabrication',
            duration: 560, // ~9 minutes
            objectives: [
              { id: 4, description: 'Create physical forgeries', reward: 25, required: true },
              { id: 5, description: 'Program digital signatures', reward: 30, required: true },
              { id: 6, description: 'Test authentication systems', reward: 20, required: false }
            ]
          },
          {
            id: 3,
            name: 'Execution',
            duration: 560, // ~9 minutes
            objectives: [
              { id: 7, description: 'Execute identity swap', reward: 30, required: true },
              { id: 8, description: 'Maintain cover identity', reward: 25, required: true },
              { id: 9, description: 'Secure extraction route', reward: 20, required: true }
            ]
          }
        ],
        traceThreshold: 20,
        successCriteria: 'Complete identity swap successfully',
        failureCondition: 'Biometric mismatch detected OR Time expires'
      },

      CORE_EXTRACTION: {
        id: 'CORE_EXTRACTION',
        name: 'Soul Key Retrieval',
        type: 'extraction',
        duration: 1800, // 30 minutes
        difficulty: 'maximum',
        description: 'Insert, sever, and retrieve "soul key"',
        riskLevel: 'EXTREME',
        phases: [
          {
            id: 1,
            name: 'Vault Breach',
            duration: 600, // 10 minutes
            objectives: [
              { id: 1, description: 'Penetrate outer defenses', reward: 25, required: true },
              { id: 2, description: 'Disable alarm systems', reward: 30, required: true, threatReduction: 20 },
              { id: 3, description: 'Access core vault', reward: 25, required: true }
            ]
          },
          {
            id: 2,
            name: 'Soul Key Location',
            duration: 600, // 10 minutes
            objectives: [
              { id: 4, description: 'Navigate quantum maze', reward: 30, required: true },
              { id: 5, description: 'Locate soul key construct', reward: 35, required: true },
              { id: 6, description: 'Analyze extraction requirements', reward: 25, required: false }
            ]
          },
          {
            id: 3,
            name: 'Critical Extraction',
            duration: 600, // 10 minutes
            objectives: [
              { id: 7, description: 'Execute extraction protocol', reward: 45, required: true },
              { id: 8, description: 'Maintain data integrity', reward: 35, required: true },
              { id: 9, description: 'Emergency exfiltration', reward: 40, required: true }
            ]
          }
        ],
        traceThreshold: 15,
        successCriteria: 'Extract soul key with >95% integrity',
        failureCondition: 'Full lockdown OR Soul key corruption',
        burnStateRisk: true
      }
    };
  }

  initializeAgents() {
    return {
      hacker: {
        id: 'hacker',
        name: 'Breach Architect',
        description: 'System exploitation specialist',
        color: '#FF1744',
        stats: {
          hacking: 100,
          stealth: 60,
          combat: 40,
          analysis: 70
        },
        abilities: {
          passive: {
            name: 'Cipher Cache',
            description: 'Small chance to create false telemetry echo',
            effect: 'false_telemetry_chance',
            probability: 0.15
          },
          ability1: {
            name: 'Ghost Port',
            description: 'Disables external logs for 6s',
            cooldown: 18,
            duration: 6,
            effect: 'disable_logs',
            traceReduction: 0
          },
          ability2: {
            name: 'Shard Forge',
            description: 'Synthesize single-use hex-shard',
            cooldown: 28,
            effect: 'create_hex_shard',
            uses: 'single'
          },
          ultimate: {
            name: 'System Lattice',
            description: 'Layered backdoor reroutes checks for 12s',
            type: 'charge',
            duration: 12,
            effect: 'reroute_checks',
            chargeRequired: 100
          }
        }
      },
      
      infiltrator: {
        id: 'infiltrator',
        name: 'Shadow Linguist',
        description: 'Social engineering specialist',
        color: '#A66BFF',
        stats: {
          hacking: 40,
          stealth: 100,
          combat: 70,
          analysis: 60
        },
        abilities: {
          passive: {
            name: 'Social Echo',
            description: 'Boost persuasion checks on NPCs',
            effect: 'persuasion_boost',
            multiplier: 1.5
          },
          ability1: {
            name: 'False Face',
            description: 'Temporary persona overlay for 10s',
            cooldown: 20,
            duration: 10,
            effect: 'persona_overlay'
          },
          ability2: {
            name: 'Paper Trail',
            description: 'Plant forged identity packet',
            cooldown: 26,
            effect: 'redirect_investigation',
            traceReduction: 15
          },
          ultimate: {
            name: 'Crowd Scripting',
            description: 'Mask team movement for 14s',
            type: 'charge',
            duration: 14,
            effect: 'mask_movement',
            chargeRequired: 100
          }
        }
      },

      analyst: {
        id: 'analyst',
        name: 'Signal Oracle',
        description: 'Intelligence gathering specialist',
        color: '#F1C76C',
        stats: {
          hacking: 70,
          stealth: 40,
          combat: 30,
          analysis: 100
        },
        abilities: {
          passive: {
            name: 'Pattern Eye',
            description: 'Reveal hidden traps',
            effect: 'reveal_traps',
            range: 'global'
          },
          ability1: {
            name: 'Echo Scan',
            description: 'Highlight vulnerable nodes for 8s',
            cooldown: 16,
            duration: 8,
            effect: 'highlight_vulnerabilities'
          },
          ability2: {
            name: 'Predictive Mesh',
            description: 'Forecast next sweep, grant dodge window',
            cooldown: 25,
            effect: 'dodge_window',
            duration: 5
          },
          ultimate: {
            name: 'Oracle Burst',
            description: 'Reveal full mission map for 6s',
            type: 'charge',
            duration: 6,
            effect: 'reveal_map',
            chargeRequired: 100
          }
        }
      }
    };
  }

  initializeAchievements() {
    return {
      ghost_operator: {
        id: 'ghost_operator',
        name: 'Ghost Operator',
        description: 'Complete mission with 0% trace',
        condition: (missionData) => missionData.traceLevel === 0,
        reward: { hexShards: { legendary: 2 }, xp: 1000 }
      },
      speed_demon: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete all phases in under 75 minutes',
        condition: (missionData) => missionData.timeUsed < 4500,
        reward: { hexShards: { rare: 3 }, xp: 750 }
      },
      perfect_coordination: {
        id: 'perfect_coordination',
        name: 'Perfect Coordination',
        description: 'All three roles achieve S-rank',
        condition: (missionData) => missionData.rank === 'S-RANK',
        reward: { hexShards: { mythic: 1 }, xp: 2000 }
      },
      adaptive_genius: {
        id: 'adaptive_genius',
        name: 'Adaptive Genius',
        description: 'Complete Phase 03 using only backup tactics',
        condition: (missionData) => missionData.backupTacticsUsed && missionData.phase >= 3,
        reward: { hexShards: { legendary: 1 }, xp: 1500 }
      },
      data_hoarder: {
        id: 'data_hoarder',
        name: 'Data Hoarder',
        description: 'Collect 100 hex-shards',
        condition: (teamData) => teamData.totalHexShards >= 100,
        reward: { hexShards: { mythic: 1 }, xp: 500 }
      }
    };
  }

  // Mission Management
  createMissionInstance(missionId, teamId, selectedAgent) {
    const missionType = this.missionTypes[missionId];
    if (!missionType) {
      throw new Error('Invalid mission type');
    }

    const agent = this.agents[selectedAgent];
    if (!agent) {
      throw new Error('Invalid agent selected');
    }

    return {
      id: this.generateId(),
      missionId,
      teamId,
      selectedAgent,
      missionType,
      agent,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + missionType.duration * 1000).toISOString(),
      status: 'active',
      currentPhase: 1,
      traceLevel: 0,
      objectives: this.initializeObjectives(missionType),
      timeRemaining: missionType.duration,
      alarmsTriggered: 0,
      missionProgress: 0,
      abilities: {
        cooldowns: {},
        charges: { ultimate: 0 },
        activeEffects: []
      },
      events: [],
      stats: {
        actionsPerformed: 0,
        abilitiesUsed: 0,
        objectivesCompleted: 0,
        traceIncreases: 0
      }
    };
  }

  initializeObjectives(missionType) {
    const objectives = [];
    missionType.phases.forEach(phase => {
      phase.objectives.forEach(obj => {
        objectives.push({
          ...obj,
          phaseId: phase.id,
          completed: false,
          completedAt: null,
          available: phase.id === 1 // Only first phase objectives are initially available
        });
      });
    });
    return objectives;
  }

  // Objective Management
  completeObjective(missionInstance, objectiveId) {
    const objective = missionInstance.objectives.find(obj => obj.id === objectiveId);
    
    if (!objective) {
      throw new Error('Objective not found');
    }

    if (objective.completed) {
      throw new Error('Objective already completed');
    }

    if (!objective.available) {
      throw new Error('Objective not yet available');
    }

    // Complete the objective
    objective.completed = true;
    objective.completedAt = new Date().toISOString();
    
    // Apply rewards
    missionInstance.missionProgress += objective.reward;
    if (objective.threatReduction) {
      missionInstance.traceLevel = Math.max(0, missionInstance.traceLevel - objective.threatReduction);
    }

    // Update stats
    missionInstance.stats.objectivesCompleted++;

    // Check if phase is complete
    this.checkPhaseCompletion(missionInstance);

    // Log event
    this.logEvent(missionInstance, 'objective_completed', {
      objectiveId,
      reward: objective.reward,
      newProgress: missionInstance.missionProgress
    });

    return {
      success: true,
      objective,
      missionProgress: missionInstance.missionProgress,
      phaseComplete: this.isPhaseComplete(missionInstance, objective.phaseId)
    };
  }

  checkPhaseCompletion(missionInstance) {
    const currentPhase = missionInstance.currentPhase;
    const phaseObjectives = missionInstance.objectives.filter(obj => 
      obj.phaseId === currentPhase && obj.required
    );
    
    const completedRequired = phaseObjectives.filter(obj => obj.completed);
    
    if (completedRequired.length === phaseObjectives.length) {
      // Phase complete, unlock next phase
      if (currentPhase < 3) {
        missionInstance.currentPhase++;
        this.unlockPhaseObjectives(missionInstance, missionInstance.currentPhase);
        
        this.logEvent(missionInstance, 'phase_completed', {
          completedPhase: currentPhase,
          nextPhase: missionInstance.currentPhase
        });
      } else {
        // Mission complete
        this.completeMission(missionInstance);
      }
    }
  }

  unlockPhaseObjectives(missionInstance, phaseId) {
    missionInstance.objectives.forEach(obj => {
      if (obj.phaseId === phaseId) {
        obj.available = true;
      }
    });
  }

  isPhaseComplete(missionInstance, phaseId) {
    const phaseObjectives = missionInstance.objectives.filter(obj => 
      obj.phaseId === phaseId && obj.required
    );
    return phaseObjectives.every(obj => obj.completed);
  }

  // Ability System
  useAbility(missionInstance, abilityType, targetData = {}) {
    const agent = this.agents[missionInstance.selectedAgent];
    const ability = agent.abilities[abilityType];
    
    if (!ability) {
      throw new Error('Invalid ability');
    }

    // Check cooldown
    const cooldownKey = `${abilityType}_cooldown`;
    const lastUsed = missionInstance.abilities.cooldowns[cooldownKey] || 0;
    const now = Date.now();
    const cooldownRemaining = Math.max(0, (ability.cooldown * 1000) - (now - lastUsed));
    
    if (cooldownRemaining > 0) {
      throw new Error(`Ability on cooldown: ${Math.ceil(cooldownRemaining / 1000)}s remaining`);
    }

    // Check ultimate charge requirement
    if (ability.type === 'charge' && missionInstance.abilities.charges.ultimate < ability.chargeRequired) {
      throw new Error(`Insufficient charge: ${missionInstance.abilities.charges.ultimate}/${ability.chargeRequired}`);
    }

    // Use ability
    missionInstance.abilities.cooldowns[cooldownKey] = now;
    if (ability.type === 'charge') {
      missionInstance.abilities.charges.ultimate = 0;
    }

    // Apply ability effects
    const effects = this.applyAbilityEffects(missionInstance, ability, targetData);
    
    // Update stats
    missionInstance.stats.abilitiesUsed++;

    // Log event
    this.logEvent(missionInstance, 'ability_used', {
      abilityType,
      abilityName: ability.name,
      effects
    });

    return {
      success: true,
      ability: {
        name: ability.name,
        activated: true,
        duration: ability.duration || 0,
        cooldownRemaining: ability.cooldown
      },
      effects
    };
  }

  applyAbilityEffects(missionInstance, ability, targetData) {
    const effects = {};
    
    switch (ability.effect) {
      case 'disable_logs':
        effects.traceReduction = 0;
        effects.stealthBonus = 25;
        effects.duration = ability.duration;
        this.addActiveEffect(missionInstance, 'logs_disabled', ability.duration);
        break;
        
      case 'create_hex_shard':
        effects.hexShard = 1;
        break;
        
      case 'reroute_checks':
        effects.traceImmunity = true;
        effects.duration = ability.duration;
        this.addActiveEffect(missionInstance, 'checks_rerouted', ability.duration);
        break;
        
      case 'persona_overlay':
        effects.personaOverlay = true;
        effects.duration = ability.duration;
        effects.persuasionBonus = 50;
        this.addActiveEffect(missionInstance, 'false_face', ability.duration);
        break;
        
      case 'redirect_investigation':
        effects.traceReduction = ability.traceReduction;
        missionInstance.traceLevel = Math.max(0, missionInstance.traceLevel - ability.traceReduction);
        break;
        
      case 'mask_movement':
        effects.movementMasked = true;
        effects.duration = ability.duration;
        this.addActiveEffect(missionInstance, 'crowd_scripting', ability.duration);
        break;
        
      case 'highlight_vulnerabilities':
        effects.vulnerableNodes = true;
        effects.duration = ability.duration;
        this.addActiveEffect(missionInstance, 'echo_scan', ability.duration);
        break;
        
      case 'dodge_window':
        effects.dodgeWindow = true;
        effects.duration = ability.duration;
        this.addActiveEffect(missionInstance, 'predictive_mesh', ability.duration);
        break;
        
      case 'reveal_map':
        effects.fullMapRevealed = true;
        effects.duration = ability.duration;
        this.addActiveEffect(missionInstance, 'oracle_burst', ability.duration);
        break;
    }
    
    return effects;
  }

  addActiveEffect(missionInstance, effectType, duration) {
    const effect = {
      type: effectType,
      startTime: Date.now(),
      endTime: Date.now() + (duration * 1000)
    };
    
    missionInstance.abilities.activeEffects.push(effect);
  }

  updateActiveEffects(missionInstance) {
    const now = Date.now();
    missionInstance.abilities.activeEffects = missionInstance.abilities.activeEffects
      .filter(effect => effect.endTime > now);
  }

  // Trace and Threat Management
  increaseTrace(missionInstance, amount, source = 'unknown') {
    // Check for active effects that prevent trace
    const hasTraceImmunity = missionInstance.abilities.activeEffects
      .some(effect => effect.type === 'checks_rerouted' && effect.endTime > Date.now());
    
    if (hasTraceImmunity) {
      this.logEvent(missionInstance, 'trace_blocked', { amount, source });
      return { blocked: true, amount: 0 };
    }

    // Apply passive abilities
    const agent = this.agents[missionInstance.selectedAgent];
    if (agent.abilities.passive.effect === 'false_telemetry_chance') {
      if (Math.random() < agent.abilities.passive.probability) {
        amount *= 0.5; // Reduce trace by half
        this.logEvent(missionInstance, 'false_telemetry', { originalAmount: amount * 2, reducedAmount: amount });
      }
    }

    missionInstance.traceLevel = Math.min(100, missionInstance.traceLevel + amount);
    missionInstance.stats.traceIncreases++;

    // Check for burn state
    if (missionInstance.traceLevel >= 100) {
      this.triggerBurnState(missionInstance);
    }

    this.logEvent(missionInstance, 'trace_increased', { amount, source, newLevel: missionInstance.traceLevel });

    return { blocked: false, amount, newLevel: missionInstance.traceLevel };
  }

  triggerBurnState(missionInstance) {
    missionInstance.status = 'burned';
    missionInstance.burnState = true;
    missionInstance.completedAt = new Date().toISOString();
    
    this.logEvent(missionInstance, 'burn_state_triggered', {
      traceLevel: missionInstance.traceLevel,
      phase: missionInstance.currentPhase
    });
  }

  // Mission Completion and Scoring
  completeMission(missionInstance) {
    const now = new Date();
    const startTime = new Date(missionInstance.startTime);
    const timeUsed = Math.floor((now - startTime) / 1000);
    
    missionInstance.status = 'completed';
    missionInstance.completedAt = now.toISOString();
    missionInstance.timeUsed = timeUsed;
    
    // Calculate final score
    const scoreData = this.calculateFinalScore(missionInstance);
    missionInstance.finalScore = scoreData.score;
    missionInstance.rank = scoreData.rank;
    missionInstance.scoreBreakdown = scoreData.breakdown;
    
    // Award hex-shards based on rank
    const hexShards = this.calculateHexShardReward(scoreData.rank);
    missionInstance.hexShardsAwarded = hexShards;
    
    // Check for achievements
    const achievements = this.checkAchievements(missionInstance);
    missionInstance.achievementsUnlocked = achievements;
    
    this.logEvent(missionInstance, 'mission_completed', {
      finalScore: missionInstance.finalScore,
      rank: missionInstance.rank,
      timeUsed,
      hexShards,
      achievements
    });
    
    return {
      success: true,
      finalScore: missionInstance.finalScore,
      rank: missionInstance.rank,
      timeUsed,
      hexShards,
      achievements,
      scoreBreakdown: scoreData.breakdown
    };
  }

  calculateFinalScore(missionInstance) {
    const baseScore = 1000;
    const timeLimit = this.missionTypes[missionInstance.missionId].duration;
    
    // Calculate multipliers
    const stealthMultiplier = Math.max(0.5, 2.0 - (missionInstance.traceLevel / 50));
    const timeMultiplier = Math.max(1.0, 1.5 - (missionInstance.timeUsed / timeLimit));
    const objectiveMultiplier = 1.0 + (missionInstance.stats.objectivesCompleted * 0.2);
    const noAlarmsBonus = missionInstance.alarmsTriggered === 0 ? 1.5 : 1.0;
    const perfectRunBonus = missionInstance.traceLevel === 0 ? 2.0 : 1.0;
    
    // Calculate penalties
    const penalties = (missionInstance.alarmsTriggered * 200) + 
                     ((missionInstance.objectives.filter(obj => obj.required && !obj.completed).length) * 100);
    
    const score = Math.max(0, Math.floor(
      baseScore * stealthMultiplier * timeMultiplier * objectiveMultiplier * noAlarmsBonus * perfectRunBonus - penalties
    ));
    
    const rank = this.calculateRank(score);
    
    return {
      score,
      rank,
      breakdown: {
        baseScore,
        stealthMultiplier,
        timeMultiplier,
        objectiveMultiplier,
        noAlarmsBonus,
        perfectRunBonus,
        penalties
      }
    };
  }

  calculateRank(score) {
    if (score >= 5000) return 'S-RANK';
    if (score >= 4000) return 'A-RANK';
    if (score >= 3000) return 'B-RANK';
    if (score >= 2000) return 'C-RANK';
    if (score >= 1000) return 'D-RANK';
    return 'F-RANK';
  }

  calculateHexShardReward(rank) {
    const rewards = {
      'S-RANK': { legendary: 10, mythic: 5 },
      'A-RANK': { legendary: 7, rare: 15 },
      'B-RANK': { rare: 5, uncommon: 20 },
      'C-RANK': { rare: 3, uncommon: 10 },
      'D-RANK': { common: 10 },
      'F-RANK': {}
    };
    
    return rewards[rank] || {};
  }

  checkAchievements(missionInstance) {
    const unlockedAchievements = [];
    
    Object.values(this.achievements).forEach(achievement => {
      if (achievement.condition(missionInstance)) {
        unlockedAchievements.push(achievement);
      }
    });
    
    return unlockedAchievements;
  }

  // Utility Methods
  logEvent(missionInstance, eventType, data) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data
    };
    
    missionInstance.events.push(event);
  }

  generateId() {
    return 'game_' + Math.random().toString(36).substring(2, 16) + Date.now().toString(36);
  }

  // Mission State Updates
  updateMissionTimer(missionInstance) {
    const now = new Date();
    const endTime = new Date(missionInstance.endTime);
    const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
    
    missionInstance.timeRemaining = timeRemaining;
    
    if (timeRemaining === 0 && missionInstance.status === 'active') {
      this.failMission(missionInstance, 'time_expired');
    }
    
    return timeRemaining;
  }

  failMission(missionInstance, reason) {
    missionInstance.status = 'failed';
    missionInstance.failureReason = reason;
    missionInstance.completedAt = new Date().toISOString();
    
    // Calculate partial score
    const scoreData = this.calculateFinalScore(missionInstance);
    missionInstance.finalScore = Math.floor(scoreData.score * 0.5); // 50% penalty for failure
    missionInstance.rank = 'F-RANK';
    
    this.logEvent(missionInstance, 'mission_failed', {
      reason,
      finalScore: missionInstance.finalScore,
      phase: missionInstance.currentPhase
    });
  }

  getThreatLevel(traceLevel) {
    if (traceLevel < 25) return 'LOW';
    if (traceLevel < 50) return 'MODERATE';
    if (traceLevel < 75) return 'HIGH';
    return 'CRITICAL';
  }
}

module.exports = GameEngine;