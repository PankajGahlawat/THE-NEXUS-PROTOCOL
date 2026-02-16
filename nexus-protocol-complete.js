/**
 * NEXUS PROTOCOL - COMPLETE JAVASCRIPT IMPLEMENTATION
 * Based on Game Design & Lore Document v3.0.0
 * Version: 3.0.0 - Production Ready
 * Last Updated: December 20, 2025
 */

class NexusProtocol {
    constructor() {
        // Core State Management
        this.currentAgent = null;
        this.currentPhase = 1;
        this.traceLevel = 0;
        this.objectives = [];
        this.systemLog = [];
        this.missionActive = false;
        this.gameState = 'loading'; // loading, trailer, agent-select, mission-brief, mission-active
        
        // Performance Monitoring
        this.performanceMetrics = {
            renderTime: 0,
            animationFrames: 0,
            memoryUsage: 0
        };
        
        // Agent Definitions - Following Game Design Document
        this.agents = {
            hacker: {
                id: 'hacker',
                name: 'Breach Architect',
                codeName: 'Cipher',
                description: 'System exploitation and digital warfare specialist',
                color: '#FF1744',
                philosophy: 'Language of systems is code. She writes the lies the Vault reads.',
                stats: { hacking: 100, stealth: 60, combat: 40, analysis: 70 },
                abilities: {
                    passive: { 
                        name: 'Cipher Cache', 
                        description: '15% chance to create false telemetry echo on system interaction',
                        effect: 'Reduces trace accumulation and confuses security algorithms'
                    },
                    ability1: { 
                        name: 'Ghost Port', 
                        description: 'Disables external logging systems for 6 seconds',
                        cooldown: 18, 
                        duration: 6,
                        tacticalUse: 'Perfect for high-risk operations'
                    },
                    ability2: { 
                        name: 'Shard Forge', 
                        description: 'Synthesizes single-use hex-shard to bypass security protocol',
                        cooldown: 28,
                        tacticalUse: 'Emergency access when normal methods fail'
                    },
                    ultimate: { 
                        name: 'System Lattice', 
                        description: 'Deploys layered backdoor network for 12 seconds',
                        chargeRequired: true,
                        duration: 12,
                        impact: 'Grants temporary "god mode" within target system'
                    }
                }
            },
            infiltrator: {
                id: 'infiltrator',
                name: 'Shadow Linguist',
                codeName: 'Ghost',
                description: 'Social engineering and identity manipulation specialist',
                color: '#00D4FF',
                philosophy: 'People open doors that only words can unlock.',
                stats: { hacking: 40, stealth: 100, combat: 70, analysis: 60 },
                abilities: {
                    passive: { 
                        name: 'Social Echo', 
                        description: 'Boosts success rate of persuasion checks on NPCs by 25%',
                        effect: 'Makes social engineering attempts more likely to succeed'
                    },
                    ability1: { 
                        name: 'False Face', 
                        description: 'Assumes temporary persona that reduces suspicion for 10 seconds',
                        cooldown: 20, 
                        duration: 10,
                        tacticalUse: 'Allows movement through areas with human security'
                    },
                    ability2: { 
                        name: 'Paper Trail', 
                        description: 'Plants forged identity packet that redirects investigations',
                        cooldown: 26,
                        tacticalUse: 'Provides long-term protection by creating false leads'
                    },
                    ultimate: { 
                        name: 'Crowd Scripting', 
                        description: 'Manipulates public telemetry to mask team movement for 14 seconds',
                        chargeRequired: true,
                        duration: 14,
                        impact: 'Creates "noise" in surveillance systems'
                    }
                }
            },
            analyst: {
                id: 'analyst',
                name: 'Signal Oracle',
                codeName: 'Oracle',
                description: 'Pattern recognition and predictive analysis specialist',
                color: '#0AC8B9',
                philosophy: 'Patterns whisper where humans see noise. He listens, he maps, he predicts.',
                stats: { hacking: 70, stealth: 40, combat: 30, analysis: 100 },
                abilities: {
                    passive: { 
                        name: 'Pattern Eye', 
                        description: 'Automatically reveals hidden traps and security measures',
                        effect: 'Prevents team from walking into obvious dangers'
                    },
                    ability1: { 
                        name: 'Echo Scan', 
                        description: 'Highlights vulnerable nodes and optimal action paths for 8 seconds',
                        cooldown: 16, 
                        duration: 8,
                        tacticalUse: 'Maximizes efficiency and minimizes risk'
                    },
                    ability2: { 
                        name: 'Predictive Mesh', 
                        description: 'Forecasts next security sweep with 85% accuracy',
                        cooldown: 25,
                        tacticalUse: 'Allows team to avoid detection during high-risk periods'
                    },
                    ultimate: { 
                        name: 'Oracle Burst', 
                        description: 'Reveals complete mission map with all objectives and threats for 6 seconds',
                        chargeRequired: true,
                        duration: 6,
                        impact: 'Provides perfect information for strategic decision-making'
                    }
                }
            }
        };
        
        // Mission Phases - Following Three-Phase Architecture
        this.missionPhases = {
            1: {
                name: 'BEACHHEAD',
                duration: 30,
                difficulty: 'Foundation',
                traceThreshold: 25,
                objectives: [
                    { id: 'establish_connection', name: 'Establish Secure Connection', progress: 15, threat: 0 },
                    { id: 'create_identity', name: 'Create False Identity', progress: 20, threat: -10 },
                    { id: 'map_security', name: 'Map Security Systems', progress: 15, threat: 0 }
                ]
            },
            2: {
                name: 'PENETRATION',
                duration: 28,
                difficulty: 'Advanced',
                traceThreshold: 20,
                objectives: [
                    { id: 'bypass_biometric', name: 'Bypass Biometric Gateway', progress: 25, threat: 0 },
                    { id: 'escalate_privileges', name: 'Escalate Privileges', progress: 20, threat: 0 },
                    { id: 'disable_alarms', name: 'Disable Alarm Systems (Optional)', progress: 15, threat: -20 }
                ]
            },
            3: {
                name: 'EXTRACTION',
                duration: 30,
                difficulty: 'Expert',
                traceThreshold: 15,
                objectives: [
                    { id: 'locate_chimera', name: 'Locate Project Chimera', progress: 20, threat: 0 },
                    { id: 'extract_data', name: 'Extract Data Fragments', progress: 30, threat: 0 },
                    { id: 'exfiltrate', name: 'Exfiltrate Safely', progress: 0, threat: 0 }
                ]
            }
        };
        
        // Check if trailer should be shown
        this.isTrailerShown = this.checkTrailerStatus();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupPerformanceMonitoring();
        this.startLoadingSequence();
    }

    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.resetTrailer();
            }
            
            // Accessibility: Tab navigation
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
            
            // ESC key handling
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });

        // Mouse interaction removes keyboard navigation class
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Window resize handling
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Visibility change handling
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });
    }

    setupPerformanceMonitoring() {
        // Monitor performance metrics
        if (window.performance && window.performance.memory) {
            setInterval(() => {
                this.performanceMetrics.memoryUsage = window.performance.memory.usedJSHeapSize;
                this.optimizePerformance();
            }, 5000);
        }
    }

    optimizePerformance() {
        const memoryThreshold = 50 * 1024 * 1024; // 50MB
        if (this.performanceMetrics.memoryUsage > memoryThreshold) {
            // Reduce animation complexity
            document.body.classList.add('reduced-animations');
            this.logMessage('Performance optimization: Reduced animations', 'warning');
        }
    }

    checkTrailerStatus() {
        // Check URL parameters for forcing trailer
        const urlParams = new URLSearchParams(window.location.search);
        const forceTrailer = urlParams.get('trailer') === 'true';
        
        if (forceTrailer) {
            sessionStorage.removeItem('nexus_trailer_shown');
            return false;
        }
        
        // Check if trailer was already shown in this session
        return sessionStorage.getItem('nexus_trailer_shown') === 'true';
    }

    startLoadingSequence() {
        const loadingScreen = document.getElementById('loadingScreen');
        const terminalText = document.getElementById('terminalText');
        const loadingBar = document.getElementById('loadingBar');

        // Loading messages following the lore
        const messages = [
            'NEXUS PROTOCOL v7.9 / CORE SUBSYSTEM: INITIALIZING',
            'Loading neural pathways...',
            'Establishing quantum encryption...',
            'Connecting to HALO-Rè network...',
            'Calibrating agent protocols...',
            'Scanning for corporate surveillance...',
            'Deploying ghost networks...',
            'System ready. Welcome to the Nexus.'
        ];

        let messageIndex = 0;
        let progress = 0;

        const updateLoading = () => {
            if (messageIndex < messages.length) {
                terminalText.innerHTML = messages[messageIndex] + '<span class="cursor">_</span>';
                progress += 100 / messages.length;
                loadingBar.style.width = progress + '%';
                messageIndex++;
                
                // Variable timing for realism
                const delay = messageIndex === messages.length ? 1200 : 600 + Math.random() * 400;
                setTimeout(updateLoading, delay);
            } else {
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    if (!this.isTrailerShown) {
                        this.showTrailer();
                    } else {
                        this.showMainInterface();
                    }
                }, 500);
            }
        };

        updateLoading();
    }

    showTrailer() {
        const trailerContainer = document.getElementById('trailerContainer');
        const trailerText = document.getElementById('trailerText');
        const trailerSubtitle = document.getElementById('trailerSubtitle');

        trailerContainer.classList.remove('hidden');
        this.gameState = 'trailer';

        // 55-second cinematic sequence following the design document
        const tl = gsap.timeline();
        
        // 0:00-0:03 — The Hook (System Wake)
        tl.to(trailerText, { 
            opacity: 1, 
            duration: 1, 
            ease: 'power2.out',
            onComplete: () => this.logMessage('Trailer sequence initiated')
        })
        // Theme color transition
        .to(trailerText, { 
            backgroundImage: 'linear-gradient(135deg, #0AC8B9, #00FF9F)',
            webkitBackgroundClip: 'text',
            webkitTextFillColor: 'transparent',
            duration: 0.5 
        })
        // 0:10-0:22 — Agent Showcase (implied through color transitions)
        .to(trailerText, {
            backgroundImage: 'linear-gradient(135deg, #FF1744, #FF3E3E)',
            duration: 0.8
        }, '+=0.5')
        .to(trailerText, {
            backgroundImage: 'linear-gradient(135deg, #00D4FF, #9D4EDD)',
            duration: 0.8
        }, '+=0.3')
        .to(trailerText, {
            backgroundImage: 'linear-gradient(135deg, #0AC8B9, #00FF9F)',
            duration: 0.8
        }, '+=0.3')
        // 0:40-0:48 — Player Choice
        .to(trailerSubtitle, { 
            opacity: 1, 
            duration: 0.8, 
            ease: 'power2.out' 
        }, '-=0.3')
        // 0:48-0:55 — Resolution
        .to([trailerText, trailerSubtitle], { 
            opacity: 0, 
            duration: 1, 
            ease: 'power2.in',
            delay: 2.5
        })
        .call(() => {
            trailerContainer.classList.add('hidden');
            sessionStorage.setItem('nexus_trailer_shown', 'true');
            this.showMainInterface();
        });
    }

    showMainInterface() {
        const mainInterface = document.getElementById('mainInterface');
        mainInterface.classList.remove('hidden');
        this.gameState = 'agent-select';
        
        // Entrance animation with GPU acceleration
        gsap.fromTo('.nexus-interface', 
            { opacity: 0, scale: 0.95, rotationX: 5 },
            { 
                opacity: 1, 
                scale: 1, 
                rotationX: 0,
                duration: 0.8, 
                ease: 'power2.out',
                force3D: true
            }
        );

        // Staggered panel animations
        gsap.fromTo(['.nexus-left-panel', '.nexus-right-panel'], 
            { x: -50, opacity: 0 },
            { 
                x: 0, 
                opacity: 1, 
                duration: 0.6, 
                stagger: 0.1, 
                ease: 'power2.out',
                delay: 0.3
            }
        );

        gsap.fromTo('.nexus-center-panel', 
            { y: 30, opacity: 0 },
            { 
                y: 0, 
                opacity: 1, 
                duration: 0.6, 
                ease: 'power2.out',
                delay: 0.4
            }
        );

        this.logMessage('Interface loaded successfully');
        this.logMessage('Awaiting agent selection...');
        this.updateSystemStatus('READY');
    }

    resetTrailer() {
        sessionStorage.removeItem('nexus_trailer_shown');
        this.logMessage('Trailer reset - reloading interface');
        setTimeout(() => location.reload(), 500);
    }

    selectAgent(agentId) {
        if (!this.agents[agentId]) {
            this.logMessage(`Invalid agent ID: ${agentId}`, 'error');
            return;
        }

        // Remove previous selection
        document.querySelectorAll('.agent-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selection to clicked card
        const selectedCard = document.querySelector(`[data-agent="${agentId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        // Update theme with smooth transition
        this.updateTheme(agentId);

        // Enable confirm button
        const confirmButton = document.getElementById('confirmAgent');
        if (confirmButton) {
            confirmButton.disabled = false;
        }

        // Store selection
        this.currentAgent = agentId;
        const agent = this.agents[agentId];

        // Update header
        const currentAgentElement = document.getElementById('currentAgent');
        if (currentAgentElement) {
            currentAgentElement.textContent = agent.name;
        }

        // Selection animation with enhanced feedback
        if (selectedCard) {
            gsap.to(selectedCard, {
                scale: 1.05,
                duration: 0.15,
                ease: 'power2.out',
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    // Add glow effect
                    gsap.to(selectedCard, {
                        boxShadow: `0 0 30px ${agent.color}80`,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
            });
        }

        this.logMessage(`Agent selected: ${agent.name} (${agent.codeName})`);
        this.logMessage(`Philosophy: "${agent.philosophy}"`);
    }

    updateTheme(agentId) {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        
        if (currentTheme !== agentId) {
            // Smooth theme transition
            gsap.to(body, {
                duration: 0.5,
                ease: 'power2.inOut',
                onComplete: () => {
                    body.setAttribute('data-theme', agentId);
                }
            });
        }
    }

    confirmAgentSelection() {
        if (!this.currentAgent) {
            this.logMessage('No agent selected', 'error');
            return;
        }

        const agent = this.agents[this.currentAgent];
        
        // Transition to mission interface
        const agentSelection = document.getElementById('agentSelection');
        const missionInterface = document.getElementById('missionInterface');

        if (!agentSelection || !missionInterface) {
            this.logMessage('Interface elements not found', 'error');
            return;
        }

        // Smooth transition animation
        const tl = gsap.timeline();
        
        tl.to(agentSelection, {
            opacity: 0,
            x: -50,
            duration: 0.5,
            ease: 'power2.in'
        })
        .call(() => {
            agentSelection.classList.add('hidden');
            missionInterface.classList.remove('hidden');
        })
        .fromTo(missionInterface,
            { opacity: 0, x: 50 },
            { 
                opacity: 1, 
                x: 0, 
                duration: 0.5, 
                ease: 'power2.out' 
            }
        );

        this.gameState = 'mission-brief';
        this.setupMissionInterface();
        this.logMessage(`Agent confirmed: ${agent.name}`);
        this.logMessage('Preparing mission briefing...');
        this.updateSystemStatus('BRIEFING');
    }

    setupMissionInterface() {
        const abilityPanel = document.getElementById('abilityPanel');
        if (!abilityPanel || !this.currentAgent) return;

        const agent = this.agents[this.currentAgent];
        abilityPanel.innerHTML = '';

        // Create ability cards with enhanced styling
        Object.entries(agent.abilities).forEach(([key, ability]) => {
            if (key === 'passive') return; // Skip passive for now
            
            const abilityDiv = document.createElement('div');
            abilityDiv.className = 'nexus-card p-3 ability-card';
            
            const isUltimate = key === 'ultimate';
            const cooldownText = isUltimate ? 'ULTIMATE' : `${ability.cooldown}s`;
            const cooldownColor = isUltimate ? 'text-yellow-400' : 'text-blue-400';
            
            abilityDiv.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="font-semibold">${ability.name}</span>
                    <span class="text-xs ${cooldownColor} font-mono">
                        ${cooldownText}
                    </span>
                </div>
                <p class="text-sm text-gray-400 mb-2">${ability.description}</p>
                ${ability.tacticalUse ? `<p class="text-xs text-gray-500 italic">Tactical: ${ability.tacticalUse}</p>` : ''}
            `;
            
            abilityPanel.appendChild(abilityDiv);
            
            // Entrance animation
            gsap.fromTo(abilityDiv, 
                { opacity: 0, y: 20 },
                { 
                    opacity: 1, 
                    y: 0, 
                    duration: 0.4, 
                    ease: 'power2.out',
                    delay: Object.keys(agent.abilities).indexOf(key) * 0.1
                }
            );
        });

        // Update objectives for current phase
        this.updateObjectiveDisplay();
    }

    updateObjectiveDisplay() {
        const objectiveList = document.getElementById('objectiveList');
        if (!objectiveList) return;

        const currentPhaseData = this.missionPhases[this.currentPhase];
        objectiveList.innerHTML = '';

        currentPhaseData.objectives.forEach((objective, index) => {
            const li = document.createElement('li');
            li.className = 'objective-item';
            li.innerHTML = `
                <div class="objective-checkbox" id="obj${index + 1}"></div>
                <span>${objective.name}</span>
            `;
            objectiveList.appendChild(li);
        });
    }

    startMission() {
        if (!this.currentAgent) {
            this.logMessage('Cannot start mission: No agent selected', 'error');
            return;
        }

        this.missionActive = true;
        this.gameState = 'mission-active';
        this.logMessage('Mission initiated. Establishing connection...');
        this.logMessage(`Deploying ${this.agents[this.currentAgent].name} to target location`);
        this.updateSystemStatus('ACTIVE');
        
        // Start mission systems
        this.startTraceSimulation();
        this.startObjectiveProgression();
        this.startPhaseTimer();
    }

    startTraceSimulation() {
        let trace = 0;
        const baseIncrement = 2;
        const agentModifier = this.getAgentTraceModifier();
        
        const traceInterval = setInterval(() => {
            if (!this.missionActive) {
                clearInterval(traceInterval);
                return;
            }
            
            // Dynamic trace increase based on agent and actions
            const increment = (baseIncrement + Math.random() * 3) * agentModifier;
            trace += increment;
            
            if (trace > 100) trace = 100;
            
            this.traceLevel = trace;
            this.updateTraceDisplay(trace);
            
            // Trace level warnings
            if (trace >= 75 && trace < 90) {
                this.logMessage('WARNING: High trace detected! Consider evasive action.', 'warning');
            } else if (trace >= 90) {
                this.logMessage('CRITICAL: System lockdown imminent!', 'error');
            }
            
            // Mission failure condition
            if (trace >= 100) {
                clearInterval(traceInterval);
                this.handleMissionFailure('Trace level exceeded maximum threshold');
            }
        }, 2000 + Math.random() * 1000); // Variable timing
    }

    getAgentTraceModifier() {
        const modifiers = {
            hacker: 1.2,     // Higher trace generation
            infiltrator: 0.7, // Lower trace generation
            analyst: 0.9     // Moderate trace generation
        };
        return modifiers[this.currentAgent] || 1.0;
    }

    updateTraceDisplay(trace) {
        const traceMeter = document.getElementById('traceMeter');
        const traceLevel = document.getElementById('traceLevel');
        
        if (traceMeter) {
            traceMeter.style.width = trace + '%';
        }
        
        if (traceLevel) {
            traceLevel.textContent = Math.round(trace) + '%';
        }
    }

    startObjectiveProgression() {
        const currentPhaseData = this.missionPhases[this.currentPhase];
        let completedObjectives = 0;
        
        const completeNextObjective = () => {
            if (completedObjectives < currentPhaseData.objectives.length && this.missionActive) {
                const objective = currentPhaseData.objectives[completedObjectives];
                const objElement = document.getElementById(`obj${completedObjectives + 1}`);
                
                if (objElement) {
                    objElement.classList.add('completed');
                    
                    // Success animation
                    gsap.fromTo(objElement.parentElement,
                        { backgroundColor: 'transparent' },
                        { 
                            backgroundColor: 'rgba(54, 255, 176, 0.1)',
                            duration: 0.5,
                            yoyo: true,
                            repeat: 1
                        }
                    );
                }
                
                this.logMessage(`Objective completed: ${objective.name}`, 'success');
                
                // Apply trace modification
                if (objective.threat !== 0) {
                    this.traceLevel = Math.max(0, this.traceLevel + objective.threat);
                    this.updateTraceDisplay(this.traceLevel);
                }
                
                completedObjectives++;
                
                if (completedObjectives < currentPhaseData.objectives.length) {
                    // Schedule next objective
                    const delay = 3000 + Math.random() * 4000;
                    setTimeout(completeNextObjective, delay);
                } else {
                    // Phase completed
                    setTimeout(() => this.completePhase(), 1000);
                }
            }
        };
        
        // Start first objective after brief delay
        setTimeout(completeNextObjective, 2000);
    }

    startPhaseTimer() {
        const currentPhaseData = this.missionPhases[this.currentPhase];
        const duration = currentPhaseData.duration * 1000; // Convert to milliseconds
        
        setTimeout(() => {
            if (this.missionActive && this.currentPhase === Object.keys(this.missionPhases).length) {
                this.handleMissionFailure('Time limit exceeded');
            }
        }, duration);
    }

    completePhase() {
        const phaseDot = document.getElementById(`phase${this.currentPhase}Dot`);
        if (phaseDot) {
            phaseDot.classList.remove('active');
            phaseDot.classList.add('completed');
            
            // Completion animation
            gsap.fromTo(phaseDot,
                { scale: 1 },
                { 
                    scale: 1.3,
                    duration: 0.3,
                    yoyo: true,
                    repeat: 1,
                    ease: 'power2.out'
                }
            );
        }
        
        const currentPhaseData = this.missionPhases[this.currentPhase];
        this.logMessage(`Phase ${this.currentPhase}: ${currentPhaseData.name} completed successfully!`, 'success');
        
        this.currentPhase++;
        
        if (this.currentPhase <= Object.keys(this.missionPhases).length) {
            const nextPhaseDot = document.getElementById(`phase${this.currentPhase}Dot`);
            if (nextPhaseDot) {
                nextPhaseDot.classList.add('active');
            }
            
            const nextPhaseData = this.missionPhases[this.currentPhase];
            this.logMessage(`Advancing to Phase ${this.currentPhase}: ${nextPhaseData.name}`);
            
            // Update objectives for new phase
            this.updateObjectiveDisplay();
            this.startObjectiveProgression();
            this.startPhaseTimer();
        } else {
            this.handleMissionSuccess();
        }
    }

    handleMissionSuccess() {
        this.missionActive = false;
        this.logMessage('MISSION COMPLETED SUCCESSFULLY!', 'success');
        this.logMessage('Project Chimera data extracted. Exfiltration complete.', 'success');
        this.updateSystemStatus('COMPLETE');
        
        // Success celebration animation
        const interface = document.querySelector('.nexus-interface');
        gsap.to(interface, {
            backgroundColor: 'rgba(54, 255, 176, 0.1)',
            duration: 1,
            yoyo: true,
            repeat: 1
        });
        
        // Calculate final score
        const score = this.calculateMissionScore();
        this.logMessage(`Final Score: ${score} points`);
    }

    handleMissionFailure(reason) {
        this.missionActive = false;
        this.logMessage(`MISSION FAILED: ${reason}`, 'error');
        this.updateSystemStatus('FAILED');
        
        // Failure animation
        const interface = document.querySelector('.nexus-interface');
        gsap.to(interface, {
            backgroundColor: 'rgba(255, 70, 85, 0.1)',
            duration: 0.5,
            yoyo: true,
            repeat: 3
        });
    }

    calculateMissionScore() {
        const baseScore = 1000;
        const stealthMultiplier = Math.max(0.5, (100 - this.traceLevel) / 100);
        const phaseMultiplier = this.currentPhase > 3 ? 2.0 : 1.0;
        
        return Math.round(baseScore * stealthMultiplier * phaseMultiplier);
    }

    updateSystemStatus(status) {
        const statusElement = document.getElementById('systemStatus');
        if (statusElement) {
            statusElement.textContent = status;
            
            // Status color coding
            statusElement.className = 'font-semibold';
            switch (status) {
                case 'READY':
                case 'COMPLETE':
                    statusElement.classList.add('text-green-400');
                    break;
                case 'ACTIVE':
                case 'BRIEFING':
                    statusElement.classList.add('text-yellow-400');
                    break;
                case 'FAILED':
                    statusElement.classList.add('text-red-400');
                    break;
                default:
                    statusElement.classList.add('text-gray-400');
            }
        }
    }

    logMessage(message, type = 'info') {
        const systemLog = document.getElementById('systemLog');
        if (!systemLog) return;
        
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <span class="log-timestamp">[${timestamp}]</span>
            <span>${message}</span>
        `;
        
        systemLog.appendChild(logEntry);
        
        // Entrance animation
        gsap.fromTo(logEntry,
            { opacity: 0, x: -20 },
            { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
        );
        
        // Auto-scroll to bottom
        systemLog.scrollTop = systemLog.scrollHeight;
        
        // Keep only last 50 entries for performance
        while (systemLog.children.length > 50) {
            systemLog.removeChild(systemLog.firstChild);
        }
        
        // Store in internal log
        this.systemLog.push({ timestamp, message, type });
    }

    handleEscapeKey() {
        // Context-sensitive escape key handling
        switch (this.gameState) {
            case 'mission-active':
                // Pause mission or show menu
                this.logMessage('Mission paused', 'warning');
                break;
            case 'agent-select':
                // Clear selection
                this.clearAgentSelection();
                break;
        }
    }

    clearAgentSelection() {
        document.querySelectorAll('.agent-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const confirmButton = document.getElementById('confirmAgent');
        if (confirmButton) {
            confirmButton.disabled = true;
        }
        
        this.currentAgent = null;
        document.body.setAttribute('data-theme', 'analyst');
        
        const currentAgentElement = document.getElementById('currentAgent');
        if (currentAgentElement) {
            currentAgentElement.textContent = 'None Selected';
        }
        
        this.logMessage('Agent selection cleared');
    }

    handleResize() {
        // Responsive layout adjustments
        const width = window.innerWidth;
        
        if (width < 1024) {
            document.body.classList.add('mobile-layout');
        } else {
            document.body.classList.remove('mobile-layout');
        }
        
        // Recalculate animations if needed
        if (this.gameState === 'trailer') {
            // Adjust trailer text size
            const trailerText = document.getElementById('trailerText');
            if (trailerText) {
                const fontSize = width < 768 ? '1.5rem' : width < 1024 ? '2rem' : '3rem';
                trailerText.style.fontSize = fontSize;
            }
        }
    }

    pauseAnimations() {
        // Pause GSAP animations when tab is not visible
        gsap.globalTimeline.pause();
    }

    resumeAnimations() {
        // Resume GSAP animations when tab becomes visible
        gsap.globalTimeline.resume();
    }

    // Utility function for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Public API for external access
    getGameState() {
        return {
            currentAgent: this.currentAgent,
            currentPhase: this.currentPhase,
            traceLevel: this.traceLevel,
            missionActive: this.missionActive,
            gameState: this.gameState
        };
    }

    // Debug methods
    setTraceLevel(level) {
        this.traceLevel = Math.max(0, Math.min(100, level));
        this.updateTraceDisplay(this.traceLevel);
        this.logMessage(`Debug: Trace level set to ${this.traceLevel}%`, 'warning');
    }

    skipToPhase(phase) {
        if (phase >= 1 && phase <= 3) {
            this.currentPhase = phase;
            this.updateObjectiveDisplay();
            this.logMessage(`Debug: Skipped to Phase ${phase}`, 'warning');
        }
    }
}

// Global functions for HTML onclick handlers
function selectAgent(agentId) {
    if (window.nexusProtocol) {
        window.nexusProtocol.selectAgent(agentId);
    }
}

function confirmAgentSelection() {
    if (window.nexusProtocol) {
        window.nexusProtocol.confirmAgentSelection();
    }
}

function startMission() {
    if (window.nexusProtocol) {
        window.nexusProtocol.startMission();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.nexusProtocol = new NexusProtocol();
    
    // Expose debug functions in development
    if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
        window.debugNexus = {
            setTrace: (level) => window.nexusProtocol.setTraceLevel(level),
            skipPhase: (phase) => window.nexusProtocol.skipToPhase(phase),
            getState: () => window.nexusProtocol.getGameState(),
            clearSelection: () => window.nexusProtocol.clearAgentSelection()
        };
        console.log('Debug functions available: window.debugNexus');
    }
});

// Service Worker registration for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NexusProtocol;
}