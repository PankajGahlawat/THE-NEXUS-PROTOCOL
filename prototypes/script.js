// ===== Nexus Protocol - Main JavaScript =====

document.addEventListener('DOMContentLoaded', () => {
    initLoading();
    initParticles();
    initScrollObserver();
    initPageIndicator();
    initGameConnections();
});

// ===== Game Connection Functions =====
function initGameConnections() {
    // Enter the Verse button - launches the game
    const enterVerseBtn = document.getElementById('enterVerseBtn');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const signInBtn = document.getElementById('signInBtn');
    const learnMoreBtn = document.getElementById('learnMoreBtn');
    
    // Main game launch function
    function launchGame() {
        // Add loading effect
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '0.3';
        
        // Show loading message
        const loadingOverlay = document.createElement('div');
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(10, 10, 15, 0.95);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: var(--font-mono);
            color: var(--accent-primary);
        `;
        
        loadingOverlay.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">🎯</div>
                <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">INITIALIZING NEXUS PROTOCOL</div>
                <div style="font-size: 0.9rem; color: var(--text-secondary);">Launching game interface...</div>
                <div style="margin-top: 2rem;">
                    <div style="width: 300px; height: 2px; background: var(--bg-tertiary); border-radius: 1px; overflow: hidden;">
                        <div id="gameLoadingBar" style="width: 0%; height: 100%; background: var(--gradient-primary); transition: width 0.1s linear;"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(loadingOverlay);
        
        // Animate loading bar
        const gameLoadingBar = document.getElementById('gameLoadingBar');
        let progress = 0;
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(loadingInterval);
                
                // Launch the actual game
                setTimeout(() => {
                    window.location.href = 'http://localhost:5173';
                }, 500);
            }
            gameLoadingBar.style.width = progress + '%';
        }, 100);
    }
    
    // Connect buttons to game launch
    if (enterVerseBtn) {
        enterVerseBtn.addEventListener('click', launchGame);
    }
    
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', launchGame);
    }
    
    if (signInBtn) {
        signInBtn.addEventListener('click', (e) => {
            e.preventDefault();
            launchGame();
        });
    }
    
    // Learn more button - scroll to story section
    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', () => {
            const storySection = document.querySelector('.story-section');
            if (storySection) {
                storySection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Add character card interactions
    const characterCards = document.querySelectorAll('.character-card');
    characterCards.forEach((card, index) => {
        card.addEventListener('click', () => {
            // Show character info modal or launch game with pre-selected character
            const characterNames = ['hacker', 'infiltrator', 'analyst'];
            const selectedCharacter = characterNames[index];
            
            // Store character selection for the game
            localStorage.setItem('nexus_preselected_character', selectedCharacter);
            
            // Launch game
            launchGame();
        });
        
        // Add hover effect
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'scale(1.05) translateY(-10px)';
            card.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.3)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1.02)';
            card.style.boxShadow = 'none';
        });
    });
    
    // Add world card interactions
    const worldCards = document.querySelectorAll('.world-card');
    worldCards.forEach(card => {
        card.addEventListener('click', () => {
            // Could show more world info or launch specific missions
            launchGame();
        });
    });
    
    // Update navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const text = link.textContent.trim();
            
            switch(text) {
                case 'PROJECT':
                    document.querySelector('.hero-section').scrollIntoView({ behavior: 'smooth' });
                    break;
                case 'THE KEEP':
                    document.querySelector('.story-section').scrollIntoView({ behavior: 'smooth' });
                    break;
                case 'FACTIONS':
                    document.querySelector('.characters-section').scrollIntoView({ behavior: 'smooth' });
                    break;
                case 'THE WORLD':
                    document.querySelector('.world-section').scrollIntoView({ behavior: 'smooth' });
                    break;
            }
        });
    });
}

// ===== Loading Screen =====
function initLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingBar = document.getElementById('loadingBar');
    const typingText = document.getElementById('typingText');
    const filePath = document.getElementById('filePath');
    const clickPrompt = document.getElementById('clickPrompt');
    const mainNav = document.getElementById('mainNav');
    const sideNav = document.getElementById('sideNav');
    const pageIndicator = document.getElementById('pageIndicator');
    const mainContent = document.getElementById('mainContent');
    
    // Typing animation text sequences
    const textSequences = [
        'initializing nexus protocol systems...',
        'loading agent_profiles.dat...',
        'decrypting mission_briefings.enc...',
        'establishing secure connection...',
        'activating heist interface...'
    ];
    
    const fileSequences = [
        '// initializing nexus protocol systems',
        '// loading: /data/agent_profiles.dat',
        '// processing: /secure/mission_briefings.enc',
        '// connecting to: nexus.protocol.server',
        '// heist interface ready'
    ];
    
    let currentSequence = 0;
    let progress = 0;
    
    // Typing effect
    function typeText(text, callback) {
        let index = 0;
        typingText.textContent = '';
        
        function type() {
            if (index < text.length) {
                typingText.textContent += text.charAt(index);
                index++;
                setTimeout(type, 30 + Math.random() * 50);
            } else if (callback) {
                setTimeout(callback, 500);
            }
        }
        
        type();
    }
    
    // Progress animation
    function animateProgress() {
        const targetProgress = ((currentSequence + 1) / textSequences.length) * 100;
        
        const interval = setInterval(() => {
            if (progress < targetProgress) {
                progress += 2;
                loadingBar.style.width = progress + '%';
            } else {
                clearInterval(interval);
                
                if (currentSequence < textSequences.length - 1) {
                    currentSequence++;
                    filePath.textContent = fileSequences[currentSequence];
                    typeText(textSequences[currentSequence], animateProgress);
                }
            }
        }, 50);
    }
    
    // Start loading sequence
    typeText(textSequences[0], animateProgress);
    filePath.textContent = fileSequences[0];
    
    // Click to continue
    function showMainContent() {
        document.body.classList.remove('no-scroll');
        loadingScreen.classList.add('hidden');
        
        // Animate in main elements
        setTimeout(() => {
            mainNav.classList.add('visible');
            sideNav.classList.add('visible');
            pageIndicator.classList.add('visible');
            mainContent.classList.add('visible');
        }, 100);
    }
    
    // Wait for loading to complete before allowing click
    setTimeout(() => {
        clickPrompt.style.opacity = '1';
        clickPrompt.addEventListener('click', showMainContent);
        loadingScreen.addEventListener('click', showMainContent);
    }, 5000);
    
    // Or auto-continue after 8 seconds
    setTimeout(() => {
        if (!loadingScreen.classList.contains('hidden')) {
            showMainContent();
        }
    }, 8000);
    
    document.body.classList.add('no-scroll');
}

// ===== Floating Particles =====
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.animationDuration = (10 + Math.random() * 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

// ===== Scroll Observer for Animations =====
function initScrollObserver() {
    const sections = document.querySelectorAll('.page-section');
    
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                
                // Update page indicator
                const pageNumber = entry.target.dataset.page;
                if (pageNumber) {
                    document.getElementById('pageNumber').textContent = pageNumber;
                }
            }
        });
    }, observerOptions);
    
    sections.forEach(section => observer.observe(section));
}

// ===== Page Indicator =====
function initPageIndicator() {
    const sections = document.querySelectorAll('.page-section[data-page]');
    const pageNumber = document.getElementById('pageNumber');
    
    window.addEventListener('scroll', () => {
        let current = '001';
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                current = section.dataset.page;
            }
        });
        
        if (pageNumber.textContent !== current) {
            pageNumber.style.opacity = '0';
            setTimeout(() => {
                pageNumber.textContent = current;
                pageNumber.style.opacity = '1';
            }, 150);
        }
    });
}

// ===== Smooth Scroll for Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== Glitch Effect Enhancement =====
const glitchText = document.querySelector('.glitch-text');
if (glitchText) {
    setInterval(() => {
        glitchText.style.textShadow = `
            ${Math.random() * 4 - 2}px 0 #22d3ee,
            ${Math.random() * 4 - 2}px 0 #ec4899
        `;
        setTimeout(() => {
            glitchText.style.textShadow = 'none';
        }, 50);
    }, 3000 + Math.random() * 2000);
}

// ===== Hover Sound Effect (if audio enabled) =====
let audioContext = null;

function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playHoverSound() {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Enable audio on first click
document.addEventListener('click', () => {
    if (!audioContext) {
        initAudio();
    }
}, { once: true });

// Add hover sound to interactive elements
document.querySelectorAll('.nav-link, .primary-btn, .secondary-btn, .story-card, .character-card, .world-card').forEach(el => {
    el.addEventListener('mouseenter', playHoverSound);
});

// ===== Mouse Trail Effect =====
let mouseTrailEnabled = false;

if (mouseTrailEnabled) {
    const trail = [];
    const trailLength = 10;
    
    for (let i = 0; i < trailLength; i++) {
        const dot = document.createElement('div');
        dot.style.cssText = `
            position: fixed;
            width: ${10 - i}px;
            height: ${10 - i}px;
            background: rgba(139, 92, 246, ${(trailLength - i) / trailLength * 0.5});
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transition: transform 0.1s ease;
        `;
        document.body.appendChild(dot);
        trail.push({ el: dot, x: 0, y: 0 });
    }
    
    document.addEventListener('mousemove', (e) => {
        trail.forEach((dot, index) => {
            setTimeout(() => {
                dot.x = e.clientX;
                dot.y = e.clientY;
                dot.el.style.left = dot.x + 'px';
                dot.el.style.top = dot.y + 'px';
            }, index * 30);
        });
    });
}

// ===== Keyboard Navigation =====
document.addEventListener('keydown', (e) => {
    const sections = document.querySelectorAll('.page-section[data-page]');
    const currentSection = Array.from(sections).find(section => {
        const rect = section.getBoundingClientRect();
        return rect.top >= 0 && rect.top < window.innerHeight / 2;
    });
    
    if (e.key === 'ArrowDown' && currentSection) {
        const nextSection = currentSection.nextElementSibling;
        if (nextSection && nextSection.classList.contains('page-section')) {
            nextSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    if (e.key === 'ArrowUp' && currentSection) {
        const prevSection = currentSection.previousElementSibling;
        if (prevSection && prevSection.classList.contains('page-section')) {
            prevSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
});

console.log('%c Nexus Protocol ', 'background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%); color: white; padding: 10px 20px; font-size: 16px; font-weight: bold; border-radius: 4px;');
console.log('%c // system initialized... ', 'color: #8b5cf6; font-family: monospace;');
