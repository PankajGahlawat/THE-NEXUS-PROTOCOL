/**
 * NEXUS PROTOCOL - Enhanced Game Engine
 * Balanced game mechanics with improved performance and security
 * Version: 2.0.0
 * Last Updated: December 20, 2025
 */

const LRU = require('lru-cache');

class EnhancedGameEngine {
  constructor(database) {
    this.database = database;
    this.missionTypes = this.initializeMissionTypes();
    this.agents = this.initializeAgents();
    this.achievements = this.initializeAchievements();
    
    // Performance optimizations with LRU caches
    this.missionCache = new LRU({ max: 1000, ttl: 5 * 60 * 1000 }); // 5 minutes
    this.abilityCache = new LRU({ max: 500, ttl: 30 * 1000 }); // 30 seconds
    this.scoreCache = new LRU({ max: 100, ttl: 60 * 1000 }); // 1 minute
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
            minDuration: 300, // 5 minutes minimum
            maxDuration: 900, // 15 minutes maximum
            objectives: [
              { 
                id: 1, 
                name: 'Establish secure connection',
                description: 'Connect to OmniCorp network through compromised access point',
                reward: 15, 
                required: true,
                complexity: 'low',
                estimatedTime: 180
              },
              { 
                id: 2, 
                name: 'Create false identity',
                description: 'Generate convincing fake credentials using stolen biometric data',
                reward: 20, 
                required: true, 
                threatReduction: 10,
                complexity: 'medium',
                estimatedTime: 300
              },
              { 
                id: 3, 
                name: 'Map security systems',
                description: 'Scan network topology to identify vulnerabilities',
                reward: 15, 
                required: true,
                complexity: 'medium',
                estimatedTime: 240
              }
            ]
          },
          {
            id: 2,
            name: 'Penetration',
            minDuration: 480, // 8 minutes minimum
            maxDuration: 1080, // 18 minutes maximum
            objectives: [
              { 
                id: 4, 
                name: 'Bypass initial firewall',
                description: 'Exploit vulnerabilities in legacy security protocols',
                reward: 25, 
                required: true,
                complexity: 'high',
                estimatedTime: 420
              },
              { 
                id: 5, 
                name: 'Plant decoy telemetry',
                description: 'Insert false data patterns to mislead security algorithms',
                reward: 20, 
                required: true,
                complexity: 'medium',
                estimatedTime: 300
              },
              { 
                id: 6, 
                name: 'Establish digital footprint',
                description: 'Create believable activity history for false identity',
                reward: 15, 
                required: false,
                complexity: 'low',
                estimatedTime: 180
              }
            ]
          },
          {
            id: 3,
            name: 'Extraction',
            minDuration: 240, // 4 minutes minimum
            maxDuration: 600, // 10 minutes maximum
            objectives: [
              { 
                id: 7, 
                name: 'Verify proof of existence',
                description: 'Confirm false identity passes automated verification',
                reward: 20, 
                required: true,
                complexity: 'medium',
                estimatedTime: 240
              },
              { 
                id: 8, 
                name: 'Clean traces',
                description: 'Remove evidence of intrusion from system logs',
                reward: 15, 
                required: true,
                complexity: 'high',
                estimatedTime: 300
              },
              { 
                id: 9, 
                name: 'Exfiltrate safely',
                description: 'Escape facility without triggering final security measures',
                reward: 25, 
                required: true,
                complexity: 'high',
                estimatedTime: 180
              }
            ]
          }
        ],
        traceThreshold: 25,
        successCriteria: 'Complete all required objectives within time limit',
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
            minDuration: 360,
            maxDuration: 720,
            objectives: [
              { 
                id: 1, 
                name: 'Identify target personnel',
                description: 'Locate high-clearance employees with biometric access',
                reward: 20, 
                required: true,
                complexity: 'medium',
                estimatedTime: 300
              },
              { 
                id: 2, 
                name: 'Gather biometric samples',
                description: 'Collect fingerprints, retinal scans, and voice patterns',
                reward: 25, 
                required: true,
                complexity: 'high',
                estimatedTime: 480
              },
              { 
                id: 3, 
                name: 'Map security protocols',
                description: 'Analyze biometric verification procedures',
                reward: 15, 
                required: false,
                complexity: 'medium',
                estimatedTime: 240
              }
            ]
          },
          {
            id: 2,
            name: 'Fabrication',
            minDuration: 420,
            maxDuration: 840,
            objectives: [
              { 
                id: 4, 
                name: 'Create physical forgeries',
                description: 'Manufacture fake fingerprints and contact lenses',
                reward: 25, 
                required: true,
                complexity: 'high',
                estimatedTime: 420
              },
              { 
                id: 5, 
                name: 'Program digital signatures',
                description: 'Encode biometric data into security tokens',
                reward: 30, 
                required: true,
                complexity: 'high',
                estimatedTime: 360
              },
              { 
                id: 6, 
                name: 'Test authentication systems',
                description: 'Verify forgeries against security scanners',
                reward: 20, 
                required: false,
                complexity: 'medium',
                estimatedTime: 300
              }
            ]
          },
          {
            id: 3,
            name: 'Execution',
            minDuration: 300,
            maxDuration: 720,
            objectives: [
              { 
                id: 7, 
                name: 'Execute identity swap',
                description: 'Successfully impersonate target personnel',
                reward: 30, 
                required: true,
                complexity: 'extreme',
                estimatedTime: 300
              },
              { 
                id: 8, 
                name: 'Maintain cover identity',
                description: 'Avoid detection during facility access',
                reward: 25, 
                required: true,
                complexity: 'high',
                estimatedTime: 240
              },
              { 
                id: 9, 
                name: 'Secure extraction route',
                description: 'Establish safe exit without compromising identity',
                reward: 20, 
                required: true,
                complexity: 'medium',
                estimatedTime: 180
              }
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
            minDuration: 420,
            maxDuration: 900,
            objectives: [
              { 
                id: 1, 
                name: 'Penetrate outer defenses',
                description: 'Breach quantum-encrypted security barriers',
                reward: 25, 
                required: true,
                complexity: 'extreme',
                estimatedTime: 480
              },
              { 
                id: 2, 
                name: 'Disable alarm systems',
                description: 'Neutralize AI-driven threat detection',
                reward: 30, 
                required: true, 
                threatReduction: 20,
                complexity: 'extreme',
                estimatedTime: 360
              },
              { 
                id: 3, 
                name: 'Access core vault',
                description: 'Navigate through multi-layered security maze',
                reward: 25, 
                required: true,
                complexity: 'high',
                estimatedTime: 300
              }
            ]
          },
          {
            id: 2,
            name: 'Soul Key Location',
            minDuration: 360,
            maxDuration: 720,
            objectives: [
              { 
                id: 4, 
                name: 'Navigate quantum maze',
                description: 'Solve dynamic security puzzles in real-time',
                reward: 30, 
                required: true,
                complexity: 'extreme',
                estimatedTime: 420
              },
              { 
                id: 5, 
                name: 'Locate soul key construct',
                description: 'Identify target data among decoy constructs',
                reward: 35, 
                required: true,
                complexity: 'extreme',
                estimatedTime: 300
              },
              { 
                id: 6, 
                name: 'Analyze extraction requirements',
                description: 'Determine optimal extraction methodology',
                reward: 25, 
                required: false,
                complexity: 'high',
                estimatedTime: 240
              }
            ]
          },
          {
            id: 3,
            name: 'Critical Extraction',
            minDuration: 300,
            maxDuration: 600,
            objectives: [
              { 
                id: 7, 
                name: 'Execute extraction protocol',
                description: 'Carefully extract soul key without corruption',
                reward: 45, 
                required: true,
                complexity: 'extreme',
                estimatedTime: 360
              },
              { 
                id: 8, 
                name: 'Maintain data integrity',
                description: 'Preserve soul key structure during transfer',
                reward: 35, 
                required: true,
                complexity: 'extreme',
                estimatedTime: 240
              },
              { 
                id: 9, 
                name: 'Emergency exfiltration',
                description: 'Escape before security lockdown completes',
                reward: 40, 
                required: true,
                complexity: 'high',
                estimatedTime: 180
              }
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
            probability: 0.15,
            cooldown: 0
          },
          ability1: {
            name: 'Ghost Port',
            description: 'Disables external logs for 6s',
            cooldown: 18,
            duration: 6,
            effect: 'disable_logs',
            traceReduction: 0,
            manaCost: 0
          },
          ability2: {
            name: 'Shard Forge',
            description: 'Synthesize single-use hex-shard',
            cooldown: 28,
            effect: 'create_hex_shard',
            uses: 'single',
            manaCost: 0
          },
          ultimate: {
            name: 'System Lattice',
            description: 'Layered backdoor reroutes checks for 6s', // BALANCED: Reduced from 12s
            type: 'charge',
            duration: 6, // BALANCED: Reduced duration
            effect: 'reroute_checks',
            chargeRequired: 100,
            manaCost: 0
          }
        }
      },
      
      infiltrator: {
        id: 'infiltrator',
        name: 'Shadow Linguist',
        description: 'Social engineering specialist',
        color: '#00D4FF', // FIXED: Color inconsistency resolved
        stats: {
          hacking: 40,
          stealth: 100,
          combat: 70,
          analysis: 60
        },
        abilities: {
          passive: {
            name: 'Social Echo',
            description: 'Boost persuasion checks on NPCs by 25%', // ENHANCED: More specific
            effect: 'persuasion_boost',
            multiplier: 1.25, // BALANCED: Reduced from 1.5
            cooldown: 0
          },
          ability1: {
            name: 'False Face',
            description: 'Temporary persona overlay for 10s',
            cooldown: 20,
            duration: 10,
            effect: 'persona_overlay',
            stealthBonus: 30, // ENHANCED: Added stealth bonus
            manaCost: 0
          },
          ability2: {
            name: 'Paper Trail',
            description: 'Plant forged identity packet',
            cooldown: 26,
            effect: 'redirect_investigation',
            traceReduction: 15,
            duration: 30, // ENHANCED: Added duration
            manaCost: 0
          },
          ultimate: {
            name: 'Crowd Scripting',
            description: 'Mask team movement for 14s',
            type: 'charge',
            duration: 14,
            effect: 'mask_movement',
            chargeRequired: 100,
            teamWide: true, // ENHANCED: Affects entire team
            manaCost: 0
          }
        }
      },

      analyst: {
        id: 'analyst',
        name: 'Signal Oracle',
        description: 'Intelligence gathering specialist',
        color: '#0AC8B9', // FIXED: Consistent with theme
        stats: {
          hacking: 70,
          stealth: 40,
          combat: 30,
          analysis: 100
        },
        abilities: {
          passive: {
            name: 'Pattern Eye',
            description: 'Reveal hidden traps and provide team-wide threat warnings',
            effect: 'reveal_traps',
            range: 'global',
            threatReduction: 5, // ENHANCED: Passive threat reduction
            cooldown: 0
          },
          ability1: {
            name: 'Echo Scan',
            description: 'Highlight vulnerable nodes for 8s, increases team efficiency',
            cooldown: 16,
            duration: 8,
            effect: 'highlight_vulnerabilities',
            efficiencyBonus: 20, // ENHANCED: Team efficiency bonus
            manaCost: 0
          },
          ability2: {
            name: 'Predictive Mesh',
            description: 'Forecast next sweep, grant dodge window and trace immunity',
            cooldown: 25,
            effect: 'dodge_window',
            duration: 8, // ENHANCED: Increased from 5s
            traceImmunity: true, // ENHANCED: Added trace immunity
            manaCost: 0
          },
          ultimate: {
            name: 'Oracle Burst',
            description: 'Reveal full mission map for 8s with optimal path highlighting', // ENHANCED
            type: 'charge',
            duration: 8, // ENHANCED: Increased from 6s
            effect: 'reveal_map',
            chargeRequired: 100,
            pathOptimization: true, // ENHANCED: Shows optimal paths
            manaCost: 0
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
        reward: { hexShards: { legendary: 2 }, xp: 1000 },
        rarity: 'legendary'
      },
      speed_demon: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete all phases in under 20 minutes',
        condition: (missionData) => missionData.timeUsed < 1200, // BALANCED: More challenging
        reward: { hexShards: { rare: 3 }, xp: 750 },
        rarity: 'rare'
      },
      perfect_coordination: {
        id: 'perfect_coordination',
        name: 'Perfect Coordination',
        description: 'Achieve S-rank with no alarms triggered',
        condition: (missionData) => missionData.rank === 'S-RANK' && missionData.alarmsTriggered === 0,
        reward: { hexShards: { mythic: 1 }, xp: 2000 },
        rarity: 'mythic'
      },
      adaptive_genius: {
        id: 'adaptive_genius',
        name: 'Adaptive Genius',
        description: 'Complete mission using only backup tactics',
        condition: (missionData) => missionData.backupTacticsUsed && missionData.status === 'completed',
        reward: { hexShards: { legendary: 1 }, xp: 1500 },
        rarity: 'legendary'
      },
      data_hoarder: {
        id: 'data_hoarder',
        name: 'Data Hoarder',
        description: 'Collect 100 hex-shards total',
        condition: (teamData) => teamData.totalHexShards >= 100,
        reward: { hexShards: { mythic: 1 }, xp: 500 },
        rarity: 'epic'
      }
    };
  }

  // Enhanced mission creation with validation
  async createMissionInstance(missionId, teamId, selectedAgent, options = {}) {
    try {
      const missionType = this.missionTypes[missionId];
      if (!missionType) {
        throw new Error('Invalid mission type');
      }

      const agent = this.agents[selectedAgent];
      if (!agent) {
        throw new Error('Invalid agent selected');
      }

      // Prepare objectives with proper phase assignment
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

      const missionData = {
        missionId,
        teamId,
        selectedAgent,
        duration: missionType.duration,
        objectives
      };

      // Create in database
      const missionInstance = await this.database.createMissionInstance(missionData);

      // Cache the mission
      this.missionCache.set(missionInstance.id, missionInstance);

      return missionInstance;
    } catch (error) {
      console.error('Failed to create mission instance:', error);
      throw error;
    }
  }

  // Enhanced objective completion with better validation
  async completeObjective(missionInstanceId, objectiveId, completionData = {}) {
    try {
      // Check cache first
      let missionInstance = this.missionCache.get(missionInstanceId);
      if (!missionInstance) {
        missionInstance = await this.database.getMissionInstance(missionInstanceId);
        if (!missionInstance) {
          throw new Error('Mission instance not found');
        }
        this.missionCache.set(missionInstanceId, missionInstance);
      }

      // Validate mission state
      if (missionInstance.status !== 'active') {
        throw new Error('Mission is not active');
      }

      // Complete objective in database
      const objective = await this.database.completeObjective(missionInstanceId, objectiveId);

      // Update cached mission
      const cachedMission = this.missionCache.get(missionInstanceId);
      if (cachedMission) {
        const objIndex = cachedMission.objectives.findIndex(obj => obj.objective_id === objectiveId);
        if (objIndex !== -1) {
          cachedMission.objectives[objIndex] = objective;
        }
      }

      // Check for phase completion
      await this.checkPhaseCompletion(missionInstanceId);

      return {
        success: true,
        objective,
        missionProgress: missionInstance.mission_progress + objective.reward
      };
    } catch (error) {
      console.error('Failed to complete objective:', error);
      throw error;
    }
  }

  // Enhanced ability system with better balance and real-time effects
  async useAbility(missionInstanceId, abilityType, targetData = {}) {
    try {
      const cacheKey = `${missionInstanceId}:${abilityType}`;
      
      // Check ability cooldown cache
      if (this.abilityCache.has(cacheKey)) {
        const cooldownData = this.abilityCache.get(cacheKey);
        const remainingCooldown = cooldownData.expiresAt - Date.now();
        if (remainingCooldown > 0) {
          throw new Error(`Ability on cooldown: ${Math.ceil(remainingCooldown / 1000)}s remaining`);
        }
      }

      const missionInstance = await this.database.getMissionInstance(missionInstanceId);
      if (!missionInstance) {
        throw new Error('Mission instance not found');
      }

      const agent = this.agents[missionInstance.selected_agent];
      const ability = agent.abilities[abilityType];
      
      if (!ability) {
        throw new Error('Invalid ability');
      }

      // Check ultimate charge requirement
      if (ability.type === 'charge') {
        const abilitiesData = missionInstance.abilities_data || {};
        const ultimateCharge = abilitiesData.ultimateCharge || 0;
        
        if (ultimateCharge < ability.chargeRequired) {
          throw new Error(`Insufficient charge: ${ultimateCharge}/${ability.chargeRequired}`);
        }
      }

      // Apply ability effects with enhanced mechanics
      const effects = this.applyAbilityEffects(missionInstance, ability, targetData);
      
      // Set cooldown in cache
      if (ability.cooldown > 0) {
        this.abilityCache.set(cacheKey, {
          expiresAt: Date.now() + (ability.cooldown * 1000)
        });
      }

      // Update mission instance in database with enhanced tracking
      const updatedAbilitiesData = { ...missionInstance.abilities_data };
      if (ability.type === 'charge') {
        updatedAbilitiesData.ultimateCharge = 0;
      }

      // Track ability usage statistics
      updatedAbilitiesData.abilitiesUsed = (updatedAbilitiesData.abilitiesUsed || 0) + 1;
      updatedAbilitiesData.lastAbilityUsed = {
        type: abilityType,
        name: ability.name,
        timestamp: new Date().toISOString()
      };

      await this.database.updateMissionInstance(missionInstanceId, {
        abilities_data: updatedAbilitiesData,
        trace_level: Math.max(0, missionInstance.trace_level + (effects.traceIncrease || 0) - (effects.traceReduction || 0))
      });

      return {
        success: true,
        ability: {
          name: ability.name,
          activated: true,
          duration: ability.duration || 0,
          cooldownRemaining: ability.cooldown || 0
        },
        effects: {
          ...effects,
          timestamp: new Date().toISOString(),
          missionId: missionInstanceId
        }
      };
    } catch (error) {
      console.error('Failed to use ability:', error);
      throw error;
    }
  }

  // Enhanced ability effects system with agent-specific mechanics
  applyAbilityEffects(missionInstance, ability, targetData) {
    const effects = {
      traceReduction: 0,
      traceIncrease: 0,
      stealthBonus: 0,
      efficiencyBonus: 0,
      duration: ability.duration || 0,
      message: `${ability.name} activated`
    };

    switch (ability.effect) {
      case 'disable_logs':
        effects.stealthBonus = 25;
        effects.message = 'External logs disabled - stealth operations enhanced';
        break;
        
      case 'create_hex_shard':
        effects.hexShardCreated = true;
        effects.message = 'Hex-shard synthesized - emergency bypass available';
        break;
        
      case 'reroute_checks':
        effects.traceReduction = 15;
        effects.stealthBonus = 40;
        effects.message = 'System lattice active - security checks rerouted';
        break;
        
      case 'persona_overlay':
        effects.stealthBonus = 30;
        effects.socialBonus = 50;
        effects.message = 'False identity active - social interactions enhanced';
        break;
        
      case 'redirect_investigation':
        effects.traceReduction = 15;
        effects.message = 'Forged identity planted - investigation misdirected';
        break;
        
      case 'mask_movement':
        effects.teamWideBonus = true;
        effects.stealthBonus = 35;
        effects.message = 'Team movement masked - coordinated stealth enhanced';
        break;
        
      case 'reveal_traps':
        effects.threatReduction = 5;
        effects.awarenessBonus = 100;
        effects.message = 'Hidden threats revealed - team awareness enhanced';
        break;
        
      case 'highlight_vulnerabilities':
        effects.efficiencyBonus = 20;
        effects.hackingBonus = 30;
        effects.message = 'System vulnerabilities highlighted - hacking efficiency increased';
        break;
        
      case 'dodge_window':
        effects.traceImmunity = true;
        effects.duration = 8;
        effects.message = 'Predictive analysis active - next security sweep predicted';
        break;
        
      case 'reveal_map':
        effects.mapRevealed = true;
        effects.pathOptimization = true;
        effects.efficiencyBonus = 40;
        effects.message = 'Oracle burst active - optimal mission paths revealed';
        break;
        
      default:
        effects.message = `${ability.name} effect applied`;
    }

    return effects;
  }

  // Enhanced scoring with exponential curves for better balance
  calculateFinalScore(missionInstance) {
    const cacheKey = `score:${missionInstance.id}:${missionInstance.trace_level}:${missionInstance.time_used}`;
    
    // Check cache first
    if (this.scoreCache.has(cacheKey)) {
      return this.scoreCache.get(cacheKey);
    }

    const baseScore = 1000;
    const missionType = this.missionTypes[missionInstance.mission_id];
    const timeLimit = missionType.duration;
    
    // ENHANCED: Exponential stealth multiplier for more realistic impact
    const stealthMultiplier = Math.max(0.3, Math.pow(0.98, missionInstance.trace_level));
    
    // ENHANCED: Non-linear time multiplier
    const timeRatio = missionInstance.time_used / timeLimit;
    const timeMultiplier = Math.max(1.0, 2.0 - Math.pow(timeRatio, 0.7));
    
    // ENHANCED: Objective completion with diminishing returns
    const completedObjectives = missionInstance.objectives?.filter(obj => obj.completed).length || 0;
    const totalObjectives = missionInstance.objectives?.length || 1;
    const objectiveRatio = completedObjectives / totalObjectives;
    const objectiveMultiplier = 1.0 + (objectiveRatio * 1.5);
    
    // ENHANCED: Bonus calculations
    const noAlarmsBonus = (missionInstance.alarms_triggered || 0) === 0 ? 1.5 : 1.0;
    const perfectRunBonus = missionInstance.trace_level === 0 ? 2.0 : 1.0;
    const speedBonus = timeRatio < 0.5 ? 1.3 : 1.0; // NEW: Speed bonus
    
    // ENHANCED: Penalty calculations
    const alarmPenalty = (missionInstance.alarms_triggered || 0) * 200;
    const failedObjectivePenalty = (totalObjectives - completedObjectives) * 100;
    const tracePenalty = Math.pow(missionInstance.trace_level, 1.5) * 10; // NEW: Exponential trace penalty
    
    const totalPenalties = alarmPenalty + failedObjectivePenalty + tracePenalty;
    
    const score = Math.max(0, Math.floor(
      baseScore * stealthMultiplier * timeMultiplier * objectiveMultiplier * 
      noAlarmsBonus * perfectRunBonus * speedBonus - totalPenalties
    ));
    
    const rank = this.calculateRank(score);
    
    const result = {
      score,
      rank,
      breakdown: {
        baseScore,
        stealthMultiplier: Math.round(stealthMultiplier * 100) / 100,
        timeMultiplier: Math.round(timeMultiplier * 100) / 100,
        objectiveMultiplier: Math.round(objectiveMultiplier * 100) / 100,
        noAlarmsBonus,
        perfectRunBonus,
        speedBonus,
        penalties: totalPenalties,
        components: {
          alarmPenalty,
          failedObjectivePenalty,
          tracePenalty
        }
      }
    };

    // Cache the result
    this.scoreCache.set(cacheKey, result);
    
    return result;
  }

  calculateRank(score) {
    if (score >= 5000) return 'S-RANK';
    if (score >= 4000) return 'A-RANK';
    if (score >= 3000) return 'B-RANK';
    if (score >= 2000) return 'C-RANK';
    if (score >= 1000) return 'D-RANK';
    return 'F-RANK';
  }

  // Enhanced phase completion checking
  async checkPhaseCompletion(missionInstanceId) {
    const missionInstance = await this.database.getMissionInstance(missionInstanceId);
    if (!missionInstance) return;

    const currentPhase = missionInstance.current_phase;
    const phaseObjectives = missionInstance.objectives.filter(obj => 
      obj.phase_id === currentPhase && obj.required
    );
    
    const completedRequired = phaseObjectives.filter(obj => obj.completed);
    
    if (completedRequired.length === phaseObjectives.length) {
      // Phase complete
      if (currentPhase < 3) {
        const nextPhase = currentPhase + 1;
        
        // Update mission phase
        await this.database.updateMissionInstance(missionInstanceId, {
          current_phase: nextPhase
        });
        
        // Unlock next phase objectives
        await this.unlockPhaseObjectives(missionInstanceId, nextPhase);
        
        // Clear cache
        this.missionCache.delete(missionInstanceId);
        
        return { phaseCompleted: currentPhase, nextPhase };
      } else {
        // Mission complete
        return await this.completeMission(missionInstanceId);
      }
    }
    
    return null;
  }

  async unlockPhaseObjectives(missionInstanceId, phaseId) {
    // This would update the database to mark objectives as available
    // Implementation depends on your database structure
    console.log(`Unlocking phase ${phaseId} objectives for mission ${missionInstanceId}`);
  }

  async completeMission(missionInstanceId) {
    const missionInstance = await this.database.getMissionInstance(missionInstanceId);
    if (!missionInstance) {
      throw new Error('Mission instance not found');
    }

    const now = new Date();
    const startTime = new Date(missionInstance.start_time);
    const timeUsed = Math.floor((now - startTime) / 1000);
    
    // Calculate final score
    const scoreData = this.calculateFinalScore({
      ...missionInstance,
      time_used: timeUsed
    });
    
    // Update mission as completed
    await this.database.updateMissionInstance(missionInstanceId, {
      status: 'completed',
      completed_at: now,
      time_used: timeUsed,
      final_score: scoreData.score,
      rank: scoreData.rank
    });

    // Create performance log
    await this.database.createPerformanceLog({
      missionInstanceId,
      teamId: missionInstance.team_id,
      finalScore: scoreData.score,
      rank: scoreData.rank,
      traceLevel: missionInstance.trace_level,
      timeUsed,
      objectivesCompleted: missionInstance.objectives.filter(obj => obj.completed).map(obj => obj.objective_id),
      alarmsTriggered: missionInstance.alarms_triggered || 0,
      selectedAgent: missionInstance.selected_agent,
      missionType: missionInstance.mission_id
    });

    // Clear caches
    this.missionCache.delete(missionInstanceId);
    this.scoreCache.clear(); // Clear score cache as team stats may have changed

    return {
      success: true,
      finalScore: scoreData.score,
      rank: scoreData.rank,
      timeUsed,
      scoreBreakdown: scoreData.breakdown
    };
  }

  // Performance monitoring
  getCacheStats() {
    return {
      missionCache: {
        size: this.missionCache.size,
        maxSize: this.missionCache.max,
        hitRate: this.missionCache.calculatedSize / (this.missionCache.calculatedSize + this.missionCache.missCount || 1)
      },
      abilityCache: {
        size: this.abilityCache.size,
        maxSize: this.abilityCache.max
      },
      scoreCache: {
        size: this.scoreCache.size,
        maxSize: this.scoreCache.max
      }
    };
  }

  // Cleanup method
  clearCaches() {
    this.missionCache.clear();
    this.abilityCache.clear();
    this.scoreCache.clear();
  }
}

module.exports = EnhancedGameEngine;