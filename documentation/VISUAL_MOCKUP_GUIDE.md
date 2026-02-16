# NEXUS PROTOCOL - VISUAL MOCKUP GUIDE
**Complete UI/UX Design System & Implementation Reference**  
**Version**: 4.0.0  
**Last Updated**: February 5, 2026  
**Status**: ✅ Foundation Complete - Gameplay Implementation Phase

---

## 📋 TABLE OF CONTENTS

1. [Color System & Agent Themes](#1-color-system--agent-themes)
2. [Layout Architecture](#2-layout-architecture)
3. [Component States & Interactions](#3-component-states--interactions)
4. [Animation Sequences](#4-animation-sequences)
5. [Typography & Spacing](#5-typography--spacing)
6. [Implementation Reference](#6-implementation-reference)
7. [Accessibility Guidelines](#7-accessibility-guidelines)
8. [Cross-References](#8-cross-references)

---

## 1. COLOR SYSTEM & AGENT THEMES

### 🎨 Base Color Palette
```
┌─────────────────────────────────────────────────────────────┐
│                    NEXUS PROTOCOL COLORS                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ████████  ARCANE TEAL         #0ac8b9  RGB(10, 200, 185)  │
│  ████████  ARCANE GOLD         #d4af37  RGB(212, 175, 55)  │
│  ████████  ARCANE PURPLE       #8b5cf6  RGB(139, 92, 246)  │
│  ████████  ARCANE RED          #ff4655  RGB(255, 70, 85)   │
│                                                              │
│  ████████  TEXT MAIN           #ece8e1  RGB(236, 232, 225) │
│  ████████  TEXT MUTED          #7a8a99  RGB(122, 138, 153) │
│                                                              │
│  ████████  BG DARK             #0a0e14  RGB(10, 14, 20)    │
│  ████████  BG PANEL            #141b24  RGB(20, 27, 36)    │
│  ████████  BG CARD             #1a2332  RGB(26, 35, 50)    │
│  ████████  BORDER              #2a3f54  RGB(42, 63, 84)    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 🎭 Agent-Specific Themes
```
┌─────────────────────────────────────────────────────────────┐
│  HACKER - BREACH ARCHITECT (CIPHER)                         │
├─────────────────────────────────────────────────────────────┤
│  ████████  PRIMARY             #FF1744  RGB(255, 23, 68)   │
│  ████████  SECONDARY           #DC143C  RGB(220, 20, 60)   │
│  ████████  ACCENT              #8B0000  RGB(139, 0, 0)     │
│  ████████  HIGHLIGHT           #FF6B35  RGB(255, 107, 53)  │
│  Philosophy: "Language of systems is code."                  │
│  Card Image: /assets/card-left-01.webp                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  INFILTRATOR - SHADOW LINGUIST (GHOST)                      │
├─────────────────────────────────────────────────────────────┤
│  ████████  PRIMARY             #00D4FF  RGB(0, 212, 255)   │
│  ████████  SECONDARY           #6B2FB5  RGB(107, 47, 181)  │
│  ████████  ACCENT              #9D4EDD  RGB(157, 78, 221)  │
│  ████████  HIGHLIGHT           #FF10F0  RGB(255, 16, 240)  │
│  Philosophy: "People open doors that only words can unlock." │
│  Card Image: /assets/card-right-01.webp                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ANALYST - SIGNAL ORACLE (ORACLE)                           │
├─────────────────────────────────────────────────────────────┤
│  ████████  PRIMARY             #0ac8b9  RGB(10, 200, 185)  │
│  ████████  SECONDARY           #00CED1  RGB(0, 206, 209)   │
│  ████████  ACCENT              #00FF9F  RGB(0, 255, 159)   │
│  ████████  HIGHLIGHT           #FFD700  RGB(255, 215, 0)   │
│  Philosophy: "Patterns whisper where humans see noise."      │
│  Card Image: /assets/card-left-03.webp                      │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 CSS Implementation
```css
/* Base colors - nexus-components.css */
:root {
  --arcane-teal: #0ac8b9;
  --arcane-gold: #d4af37;
  --arcane-purple: #8b5cf6;
  --arcane-red: #ff4655;
  --text-main: #ece8e1;
  --text-muted: #7a8a99;
  --bg-dark: #0a0e14;
  --bg-panel: #141b24;
  --bg-card: #1a2332;
  --bg-border: #2a3f54;
}

/* Agent themes - useTheme.ts */
[data-theme="hacker"] {
  --theme-primary: #FF1744;
  --theme-secondary: #DC143C;
  --theme-accent: #8B0000;
}

[data-theme="infiltrator"] {
  --theme-primary: #00D4FF;
  --theme-secondary: #6B2FB5;
  --theme-accent: #9D4EDD;
}

[data-theme="analyst"] {
  --theme-primary: #0ac8b9;
  --theme-secondary: #00CED1;
  --theme-accent: #00FF9F;
}
```

---

## 2. LAYOUT ARCHITECTURE

### 📐 Main Interface Structure
```
┌────────────────────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════════════════╗    │
│  ║  NEXUS HEADER - Angular Panel with Corner Accents            ║    │
│  ║  [LOGO] NEXUS PROTOCOL    AGENT: ORACLE  SESSION: #4F2       ║    │
│  ╚═══════════════════════════════════════════════════════════════╝    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ╔═══════════╗  ╔═══════════════════════════════════╗  ╔═══════════╗ │
│  ║  lsp         ║  ║              cps               ║  ║    rsp       ║ │
│  ║  TOOLS    ║  ║      MAIN WORKSPACE               ║  ║   INTEL   ║ │
│  ║  SIDEBAR  ║  ║                                    ║  ║   PANEL   ║ │
│  ║  288px    ║  ║  ┌─────────────────────────────┐  ║  ║   320px   ║ │
│  ║           ║  ║  │  CONTROL BAR                │  ║  ║           ║ │
│  ║  ┌─────┐  ║  ║  │  [Input] [Select] [Button]  │  ║  ║  STATUS   ║ │
│  ║  │ ⚡  │  ║  ║  └─────────────────────────────┘  ║  ║  BARS     ║ │
│  ║  └─────┘  ║  ║                                    ║  ║           ║ │
│  ║  Signal   ║  ║  ┌─────────────────────────────┐  ║  ║  ▓▓▓▓░░   ║ │
│  ║  Analyzer ║  ║  │     │                          ║  ║  85%      ║ │
│  ║           ║  ║  │                             │  ║  ║           ║ │
│  ║  ┌─────┐  ║  ║  │                             │  ║  ║  GUIDE    ║ │
│  ║  │ 🔐  │  ║  ║  │                             │ ║  ║           ║ │
│  ║  └─────┘  ║  ║  │                              │ ║  ║  • Obj 1  ║ │
│  ║  Crypto   ║  ║  │                             │  ║  ║  • Obj 2  ║ │
│  ║  Breaker  ║  ║  │                             │  ║  ║  • Obj 3  ║ │
│  ║           ║  ║  └─────────────────────────────┘  ║  ║           ║ │
│  ║  ┌─────┐  ║  ║                                    ║  ║  HINTS    ║ │
│  ║  │ 🧠  │  ║  ║  ┌─────────────────────────────┐  ║  ║           ║ │
│  ║  └─────┘  ║  ║  │  TERMINAL (Metallic Frame)  │  ║  ║  # Code   ║ │
│  ║  Memory   ║  ║  │  analyst@nexus:~$ _         │  ║  ║  # Tips   ║ │
│  ║  Forensic ║  ║  │  [SYSTEM] Initialized...    │  ║  ║  # Tools  ║ │
│  ║           ║  ║  └─────────────────────────────┘  ║  ║           ║ │
│  ║           ║  ║                                    ║  ║           ║ │
│  ╚═══════════╝  ╚═══════════════════════════════════╝  ╚═══════════╝ │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

Legend:
═══  Angular panel borders (clip-path)
⬡    Normal hexagonal cell
⬢    Corrupted hexagonal cell (pulsing red)
▓    Filled progress bar
░    Empty progress bar
```

### 📱 Responsive Breakpoints🎬 NEXUS PROTOCOL — WEBSITE STORYBOARD
(Designed using cinematic structure + story‑driven content + animation rules)

1. THE HOOK — “System Wake”
Purpose: Capture attention in the first 3 seconds
Placement: Opening sequence (preloader → hero)
Visuals
Black screen

Thin neon circuit lines pulse outward like Arcane Hexgates

VALORANT‑style glitch streaks

Text appears as if decrypted:

“INITIALIZING NEXUS PROTOCOL…”

Animation
Preloader ring rotates like a hologram

UI lines draw in place (Arcane shimmer particles, subtle)

Audio: soft rumble + digital hiss

Content Note
This sets the tone: cyber‑mystery, secrecy, high‑stakes.

2. THE SETUP — “Enter the World”
Purpose: Introduce the story, brand, mission
Scene
Full‑screen hero panel
Animated city skyline (Arcane Piltover vibes + Valorant’s ultra-clean neon look)

Headline
“A Cyber‑Heist Simulation Like No Other.”

Subline
“Three roles. One mission. Zero room for error.”

Visual Treatment
Animated floating shards of data

Animated character silhouettes (Hacker, Analyst, Infiltrator) revealed one by one

UI elements drift with parallax motion

Notes
This is your “exposition” — the user understands the world + tone.

3. CHAPTERS — THE RISING ACTION
Break the site into 3–5 scroll‑based “chapters,” each revealing deeper story layers.

Chapter 1 — Roles Reveal (Agent Select Moment)
Purpose: Introduce characters (just like Valorant Agent intros)
Layout
Horizontal scroll or sectioned vertical panels
Each role gets its own “Hero Moment”

For each role:
HACKER — “Breach Architect”

Glitched screen tear → model reveal

Ability highlights appear like Agent ability cards

INFILTRATOR — “Shadow Linguist”

Misty Arcane‑blue smoke shapes into silhouette

Social‑engineering icons float in

ANALYST — “Signal Oracle”

Hex‑tech holograms assemble around the character

Data fragments orbit like rings

Animation
Soft scroll‑triggered reveals
Particles, overlays, glyphs — but controlled, not noisy

Chapter 2 — Mission Flow (The Simulation Narrative)
Purpose: Build tension, increase excitement (rising action)
Structure
Side‑scroll timeline (like Jinx’s intro sequence in Arcane)

MISSION 1 — Establish the False Flag
Static → glitch → reveal
Holographic blueprint cards animate in

MISSION 2 — Biometric Bluff
Animated biometric scanner pulses
Surprise asset (e.g., corrupted chip) flickers with interference

MISSION 3 — Core Extraction
Data shards break apart and reassemble on user scroll

UX Style
Clean neon framing
Micro-animations: spark lines, flickers, fade-ins
Scroll = smooth camera‑dolly effect

4. BREAKERS — THE TURNING POINTS
Purpose: Prevent boredom, refresh attention
Insert two breaker moments that disrupt the traditional flow.

Breaker A — “System Lockdown Alert”
Visual Shock Moment
Full-screen flash → UI turns red
Alarm vibration animation
Screen “cracks” with glitch lines

Text pulses in:
“ALERT: NEXUS BREACH DETECTED.”

Then transitions back to the main site.

Breaker B — “Choose Your Path” Interaction
Interactive Moment
User is asked to “choose a role temporarily”
Selecting one changes the color palette + micro animations of the next section

This feels like a mini-game but very lightweight.

5. RESOLUTION — THE FINAL SCENE
Purpose: End with clarity + emotional closure
Scene
Dim, calm, post‑heist UI
Data particles slowly descending (like snow but neon)

Headline
“The Protocol Awaits.”

CTA Buttons
Initiate Simulation
View Missions
Assemble Team

Animation
UI slowly stabilizes

Audio shifts to low-pulse ambience

Hex pattern fades in, then out

Credits Section
Inspired by Arcane end‑credit screens:

Minimal

Simple glowing lines

Team or project name listed elegantly

🎧 MUSIC / SOUND MOODBOARD
These aren’t copyrighted tracks — just styles to guide you:

Intro / Hook
Deep digital hum + soft metallic pulses (Arcane opening hum style)

Setup
Warm synth pads + soft glitch ticks
(Valorant lobby ambience)

Chapters
More rhythm, tense but smooth
Light percussion + cyber textures
(Think: “stealth infiltration” beats)

Breakers
Sharp stingers + glitch distortions

Resolution
Clean ambient synths, airy, calm

🎨 GLOBAL UI / UX STYLE GUIDE
Design Style
Arcane mystic technology + Valorant tactical UI.

Color Palettes
Neon Blue #4AE2FF

Arcane Violet #A66BFF

Hex‑Gold #F1C76C

Cyber Red #FF3A3A

Deep Black #0A0A0D

Slate Grey #17191E

Typography
VALORANT-like headings:

Tall, rigid sans serif

Wide kerning

Arcane cues:

Occasional serif/symbolic glyphs

UI Components
Hologram‑style panels

Thin neon outlines

Smooth refractive glassmorphism

Glitch transitions

Parallax motion layers

Animation Rules
Scroll = progress the story

Moderate speed; no chaos

Breaker sections = high-intensity

Other sections = cinematic and controlled



Nice — love this. I’ve packed everything you asked for into a single production-ready deliverable: **scene-to-scene transitions (GSAP-style + Lottie notes), a micro-interaction catalog (IDs, triggers, timing, sound cues), deep heist lore & worldbuilding, an end-to-end onboarding user flow, in-universe UI content for each role, and a trailer script + moodboard (including the Arcane/Valorant voice feel)**.

I’m keeping timing, easings and audio cues precise so devs/animators can implement with GSAP + Lottie immediately.

# 1 — Transitions between scenes (GSAP + Lottie friendly)

Each transition is given a visual, a GSAP pseudo-snippet and Lottie note.

### Transition A — Preloader → Hero (“System Wake → Enter the World”)

Visual: Black → neon circuit lines pulse outward → thin glitch streaks → “INITIALIZING NEXUS PROTOCOL…” decrypts → hero city fades in.
GSAP pseudo:

```js
timeline
  .to('#preloaderRing', {rotation: 360, duration: 1.2, ease: "power2.inOut"})
  .fromTo('.neonLines', {scale: 0}, {scale:1, stagger:0.06, duration:0.9, ease:"expo.out"}, "-=0.8")
  .from('.glitchStreaks', {x: -60, opacity:0, duration:0.6, ease:"back.out(1.2)"}, "-=0.6")
  .from('#initText', {clipPath:"inset(0 100% 0 0)", duration:0.8, ease:"power3.out"}, "-=0.4")
  .to('#heroCity', {opacity:1, y:0, duration:1.0, ease:"power2.out"});
```

Lottie: export neon lines + preloader ring as vector Lottie; glitch streak a frame-based Lottie with displacement map.

Audio: deep digital hum → soft hiss at text decrypt → swell as city rises.

Timing: total ~3.0s (fits the 3s hook requirement).

---

### Transition B — Hero → Chapter (Enter the World → Roles Reveal)

Visual: Floating data shards scatter into horizontal panels; parallax camera dolly to role tile.
GSAP pseudo:

```js
timeline
  .to('.dataShard', {y:-30, rotation:12, opacity:.9, duration:0.7, stagger:0.04})
  .to('body', {scrollTo: "#rolesSection", duration: 0.9, ease:"power1.inOut"}, "-=0.3")
  .from('.roleCard', {scale:0.92, opacity:0, duration:0.8, stagger:0.12, ease:"back.out(1.0")}, "-=0.4");
```

Lottie: subtle data shard shimmer looped; export as autoplay Lottie with 60fps micro-tweens.

---

### Transition C — Role → Mission Timeline (Agent select → Simulation timeline)

Visual: Role card “glitches” and tears into holographic blueprint card; camera rotates 12° then side-scroll timeline appears.
GSAP pseudo:

```js
timeline
  .to('.selectedRole .glitchMask', {filter:"url(#displace)", duration:0.3})
  .to('.selectedRole', {clipPath:"polygon(...collapsed...)", duration:0.45})
  .from('#timelineContainer', {x:200, opacity:0, duration:0.9, ease:"expo.out"});
```

Lottie: role-glitch animation as overlay Lottie with displacement map.

---

### Transition D — Breaker A (System Lockdown Alert)

Visual Shock: full-screen flash → UI reddens → alarm vibration → “ALERT” text pulses → quick desaturation then return.
GSAP pseudo:

```js
timeline
  .to('#screenFlash', {opacity:1, duration:0.12, ease:"power0.none"})
  .to('body', {filter:"hue-rotate(-20deg) saturate(0.6)", duration:0.18})
  .to('#uiElements', {y:"+=6", duration:0.08, repeat:6, yoyo:true, ease:"sine.inOut"})
  .fromTo('#alertText', {scale:0.92, opacity:0}, {scale:1, opacity:1, duration:0.35, ease:"elastic.out(1,0.6")});
```

Audio: sharp digital stinger + mechanical alarm loops for 1.2s, then drop.

Important: allow immediate user recoverability — transition back in 0.9–1.2s.

---

### Transition E — Role-colour switch (Breaker B → Choose Your Path)

Visual: On role pick, UI palette smoothly remaps (hueshift), micro animation set swaps.
GSAP pseudo:

```js
gsap.to(':root', {duration:0.6, cssVars: { '--accent': selectedColor }, ease:"power2.inOut"})
gsap.to('.microAnim', {opacity:0, duration:0.25}).then(()=> activateRoleAnim());
```

Lottie: role-specific micro-animations loaded/unloaded via Lottie player (playSegments for entry/exit).

---

### Transition F — Final Scene (Resolution calm)

Visual: UI stabilises; hex pattern fades in/out; neon snow falls; CTA buttons softly pulse.
GSAP pseudo:

```js
timeline
  .to('.particleNeon', {y:"+=80", opacity:0.9, duration:1.5, ease:"linear"})
  .to('.uiPanel', {filter:"blur(0px)", opacity:1, duration:0.8})
  .from('.cta', {scale:0.98, opacity:0, duration:0.6, ease:"back.out(1.0)", stagger:0.12});
```

Audio: low-pulse ambience, long sustain pad.

---

# 2 — Micro-interaction catalog (ID, Trigger, Timing, Easing, Sound, Implementation notes)

Short, actionable catalogue. Use these IDs in the component tree.

1. `MI-HeroGlitch` — hero decrypt text microglitch

   * Trigger: initial load, once
   * Duration: 0.8s (loop 0.3s glitch bursts)
   * Ease: power3.out
   * Sound: soft metallic click + digital reverse tick (10–20ms)
   * Implementation: Lottie overlay w/ displacement; GSAP stagger on characters.

2. `MI-CardFlip` — Role ability card flip

   * Trigger: hover (desktop) / tap (mobile)
   * Duration: 0.5s
   * Ease: back.out(1.1)
   * Sound: thin neon sweep
   * Notes: animate 3D perspective, z-index swap, accessible: ensure content readable without hover.

3. `MI-ParallaxDrift` — UI parallax drift for floating shards

   * Trigger: pointer move / subtle idle motion
   * Duration: continuous gentle (looped)
   * Ease: sine.inOut
   * Sound: none (ambient)
   * Notes: reduce amplitude on mobile to save perf.

4. `MI-SelectPulse` — role selection confirmation

   * Trigger: click/tap
   * Duration: 0.36s
   * Ease: elastic.out(1,0.7)
   * Sound: low analog thud + glass chime
   * Notes: also swap CSS var `--accent`.

5. `MI-AlertShake` — Breaker A full-screen alarm vibration

   * Trigger: system lock event
   * Duration: 0.9s (fast initial 0.2s, then falloff)
   * Ease: sine.inOut for yoyo vibrate
   * Sound: digital alarm stinger + metallic crackle
   * Notes: ensure reduced-motion accessible alternative.

6. `MI-SparkLine` — micro sparklines on mission timeline cards

   * Trigger: scroll into view
   * Duration: 0.25s
   * Ease: expo.out
   * Sound: faint electronic tick
   * Notes: use SVG strokeDashoffset animation.

7. `MI-CTAFloat` — CTA gentle breathing

   * Trigger: idle
   * Duration: 2.4s loop
   * Ease: sine.inOut
   * Sound: none or ultra-low bass pulse optional
   * Notes: stops on hover/focus.

8. `MI-ParticleFall` — neon snow in resolution

   * Trigger: resolution scene mount
   * Duration: infinite loop, 18s cycle
   * Ease: linear
   * Sound: airy chime every 6s (very quiet)
   * Notes: render via canvas or GPU particle system.

9. `MI-RoleColorSwap` — palette swap micro-interaction

   * Trigger: role temporary choice in Breaker B
   * Duration: 0.6s
   * Ease: power2.inOut
   * Sound: soft whoosh + synth nodal tone
   * Notes: swap CSS variables; animate SVG gradients.

10. `MI-TooltipGlyph` — tooltip reveal with glyph icon

    * Trigger: hover/focus on ability card
    * Duration: 0.28s
    * Ease: back.out(1.0)
    * Sound: tiny glass ping
    * Notes: use aria-describedby, avoid hover-only reliance.

---

# 3 — Heist lore & worldbuilding (compact canon you can drop into UI copy)

Use these as in-universe blurbs, mission names, and role flavor text.

### World summary

In 2074, global information networks are governed by consolidated data-silos known as the **Nexus Vaults**. The Nexus Protocol is an experimental simulation engine created by an underground collective called **HALO-Rè**, designed to train small teams to execute precision cyber-exfiltrations against simulated Nexus Vaults without collateral damage. The Protocol uses "hex-shards" — fragments of corrupted memetic keys — to compile mission sims. Each simulation is a narrative loop where choices reshuffle the vault's defenses.

### Key factions & terms

* **HALO-Rè** — the covert collective (architects of the Protocol). Not overtly political; they train those who can pass their code-symmetry test.
* **Nexus Vault** — target. Vaults come in Tiers (I—III) with increasing "hex-locks" and biometric agents.
* **Hex-Shards** — data fragments; collecting them modifies simulations (meta-layer adjustments).
* **False Flag** — a mission type that plants decoy telemetry to mislead watch services.
* **Biometric Bluff** — social-engineering + forgery mission where physical forgeries meet digital fingerprints.
* **Core Extraction** — the endgame — insert, sever, and retrieve a “soul key”: a self-encapsulating data construct.

### Flavor event copy (UI-ready)

* “HALO-Rè Ops: Briefing incoming. Assemble three disciplines. Synchronize your entry.”
* Mission tagline: “Plant the lie. Steal the truth.”
* Breaker alert message: “NEXUS TRACE: Counter-lock engaged. Reprioritize objectives.”
* Resolution tag: “Protocol completed. Shards rebalanced.”

### Short bios (for role intros)

HACKER — Breach Architect
“Language of systems is code. She writes the lies the Vault reads.”

INFILTRATOR — Shadow Linguist
“People open doors that only words can unlock.”

ANALYST — Signal Oracle
“Patterns whisper where humans see noise. He listens, he maps, he predicts.”

---

# 4 — User flow: onboarding into the “simulation”

Goal: convert new visitor → joined simulation team in <3 clicks. Include fallbacks for accessibility/performance.

1. **Arrival (Hero Panel)**

   * Visual: cinematic hero, “A Cyber-Heist Simulation Like No Other.”
   * Primary CTA: **Initiate Simulation** (primary) — opens modal.

2. **Quick Tour Modal (3 quick slides, 6–8s each or skipped)**

   * Slide 1: Roles overview (Hacker / Infiltrator / Analyst) — micro-animations.
   * Slide 2: What simulation trains (False Flag / Biometric Bluff / Core Extraction).
   * Slide 3: Rewards & meta (hex-shards, team XP, skins).
   * Actions: **Choose Role** or **Random Team**. Skip button available.

3. **Role Temp Pick (Breaker B style prompt)**

   * User chooses a role (temp). The UI palette remaps, micro-animations switch.
   * Inline: short tooltip "Try role? (temporary — change anytime)". Also a "Role Playground" demo 20s.

4. **Create Profile (optional quick)**

   * Minimal: Display name, avatar (select from stylized silhouettes), difficulty slider (Casual / Tactical / Hardened).
   * Privacy-friendly: option to not create account — use session token for single-run.

5. **Pre-mission Loadout**

   * Show mission brief (one-sentence), role ability card, three quick loadout toggles (one per slot) — “Equip” animates card flip.
   * CTA: **Begin Simulation** (starts mission timeline side-scroll).

6. **Mission Play (scroll-driven)**

   * Scroll = mission progress. Small interactive choices (split-second role prompts). Breaker A can trigger a mini-alert sequence — user must choose a response (two options) to continue.

7. **Debrief**

   * Outcome screen with shard rewards, role XP, and CTA to “Assemble Team” or “Play Again”.

Accessibility & performance considerations:

* Provide toggle for Reduced Motion: disable parallax & heavy particle systems.
* Lazy-load Lottie + canvas particles only for modern browsers; fallback SVG/PNG static images for older devices.
* Keyboard nav: all micro-interactions accessible via keyboard; focus indicators visible.

KPIs to track during onboarding:

* Time to first action (TFA)
* Role pick rate
* Modal skip rate
* Start mission conversion (hero CTA → mission start)

---

# 5 — In-universe UI content for each role (ability cards, UI strings, icons, short VO bites)

Each role: three abilities + passive + short VO lines for intro/selection.

### HACKER — Breach Architect

Accent: Neon Blue (#4AE2FF) + Hex-Gold highlights

* Passive: **Cipher Cache** — gains small chance to create a false telemetry echo.
* Ability 1: **Ghost Port** — open a hidden channel; disables external logs for 6s. (Cooldown 18s)
* Ability 2: **Shard Forge** — synthesize a single-use hex-shard to confuse a vault node. (Cooldown 28s)
* Ultimate: **System Lattice** — deploys a layered backdoor that reroutes security checks for 12s. (Charge via objectives)
  UI Strings:
* Card title: Breach Architect
* Tooltip: “Write the lies the Vault will read.”
  Selection VO (short): “Compiling — I’ll make them look away.”

### INFILTRATOR — Shadow Linguist

Accent: Arcane Violet (#A66BFF)

* Passive: **Social Echo** — small increase to persuasion checks on NPCs.
* Ability 1: **False Face** — temporary persona overlay for 10s (lowers suspicion). (Cooldown 20s)
* Ability 2: **Paper Trail** — plant a forged identity packet that redirects investigations. (Cooldown 26s)
* Ultimate: **Crowd Scripting** — manipulate public telemetry to mask team movement for 14s.
  UI Strings:
* Card title: Shadow Linguist
* Tooltip: “Words open locks people don’t even know exist.”
  Selection VO: “I’ve already rehearsed their answers.”

### ANALYST — Signal Oracle

Accent: Hex-Gold (#F1C76C)

* Passive: **Pattern Eye** — small passive reveal of hidden traps.
* Ability 1: **Echo Scan** — highlights vulnerable nodes for 8s. (Cooldown 16s)
* Ability 2: **Predictive Mesh** — forecasts next security sweep, grants dodge window. (Cooldown 25s)
* Ultimate: **Oracle Burst** — reveal entire mission map for 6s (with timing markers).
  UI Strings:
* Card title: Signal Oracle
* Tooltip: “I listen to the background and speak the future.”
  Selection VO: “Watch the lines. They tell you everything.”

---

# 6 — Trailer script + moodboard (Arcane-style VO, shot list, music cues)

Designed for 45–60s trailer. Keep cinematic beats.

### Trailer length: 55s (timed beats)

0.00–0.03 — Hook (black screen)

* Visual: thin neon circuit lines pulse, preloader ring rotates.
* Audio: deep hum + soft metallic pulses.
* Text (decrypted, slow fade): “INITIALIZING NEXUS PROTOCOL…”

0.03–0.10 — Hero reveal

* Visual: city skyline rising (Arcane light grade). Animated shards.
* VO (whisper, male/female blended): “They built vaults to hide the future.”
* Music: pad enters.

0.10–0.22 — Roles flash (rapid stylized cuts, Valorant-agent style)

* Visual: Quick role reveals with signature ability flash (0.4s each)
* VO lines (staggered, low pass):

  * Hacker: “I write their exceptions.”
  * Infiltrator: “I rewrite their histories.”
  * Analyst: “I predict their lies.”
* Sound: each reveal has a unique stinger (tiny, decisive).

0.22–0.34 — Mission montage (rising action)

* Visual: mission timeline side-scroll, biometric scanner flicker, data shards scatter. Quick cuts to simulated breach visuals.
* VO: “Three roles. One mission. Zero room for error.”
* Music: rhythm kicks in — light percussion + cyber textures.

0.34–0.40 — Breaker A (system lockdown)

* Visual: UI scarlet alert, screen shake, quick crack lines.
* VO (urgent): “ALERT: NEXUS BREACH DETECTED.” (synthetic voice overlay)
* Sound: sharp stinger + alarm.

0.40–0.48 — Choose your path interaction (Breaker B)

* Visual: user selects a role; UI colour remaps; micro-animations pulse.
* VO: “Choose your path.” (single syllable cadence)
* Music: tension peak.

0.48–0.54 — Resolution tease

* Visual: calm post-heist UI, neon snow, data particles slowing. CTA buttons appear.
* VO (soft, concluding): “The Protocol Awaits.”
* Music: release to clean ambient synth.

0.54–0.55 — Fade to logo

* Visual: NEXUS PROTOCOL sigil forms out of shards; tagline below.

### Trailer VO script (clean copy for recording)

(Tempo: measured, breathy — prefer 1 voice with slight processing — low reverb, mild pitch-shift on certain words.)

* Line 1 (0–0.08): “They built vaults to hide the future.”
* Line 2 (0.10–0.18, staggered over reveals): “One writes the lies. One rewrites the history. One listens to the noise.”
* Line 3 (0.22–0.26): “Three roles. One mission. Zero room for error.”
* Line 4 (0.34–0.36, urgent): “ALERT: NEXUS BREACH DETECTED.” (synthetic glitch overlay)
* Line 5 (0.40–0.42): “Choose your path.”
* Line 6 (0.48–0.52): “The Protocol awaits.”

### Moodboard (visual + audio cues)

* Color: Neon Blue (#4AE2FF), Arcane Violet (#A66BFF), Hex-Gold accents, Deep Black background.
* Lighting: high contrast rim lighting, volumetric fog in violet/blue, subtle bloom on neon edges.
* Textures: holographic glass, thin circuit etching, glitch noise overlays.
* Camera: slow dollies, subtle Dutch tilt for tension, micro-zooms on cards.
* Music: Start with low digital hum (sub-bass), build light percussion & cyber textures; breakers use sharp analog stingers; resolution uses open airy pads.
* Sound design: metallic clicks, soft glitch ticks, low thud for selections, alarm stingers for breaker events.

---

# 7 — Deliverables & next steps (how I can package these)

I can immediately convert any of the above into:

* GSAP-ready animation script files (.js) — I’ll annotate DOM selectors & CSS vars.
* Lottie asset list + frame timing map for the motion designer.
* VO script with direction (tempo, processing notes) and timecodes (already embedded in the trailer section).
* Figma frames if you want visual comps.

Which one should I export next into a dev-ready artifact?
Options: **GSAP .js file**, **Lottie export map**, **VO recording script with director notes**, **Figma frames for each panel**. Pick one or say “all” and I’ll generate the GSAP timeline file first (most useful for animators/devs).



```
Desktop (1024px+):     Full three-panel layout
Tablet (768-1023px):   Collapsible side panels
Mobile (<768px):       Single panel with drawer navigation
```

### 🎬 Cinematic Trailer Layout (55 seconds)
```
Timeline Breakdown:
0–5s    Black → pixel ignites
        VO: "Every system trusts something."

6–15s   City reveal with UI overlays
        VO: "Trust is the weakness."

16–25s  Agent role flashes with rapid cuts
        VO: "Choose how you break in."

26–35s  System breaker alert with red inversion
        VO: "And what you leave behind."

36–48s  Black Vault sequence
        VO: "There is no clean exit."

49–55s  Silence → Logo assembly
        VO: "NEXUS PROTOCOL."
```

---

## 3. COMPONENT STATES & INTERACTIONS

### 🔧 Tool Button States
```
┌──────────────────────────────────────────────────────────┐
│  NORMAL STATE                                             │
│  ┌────────────────────────────────────────────┐          │
│  │  ┌─────┐                                    │          │
│  │  │ 📦  │  Packet Analyzer                   │          │
│  │  └─────┘  Network Forensics                 │          │
│  └────────────────────────────────────────────┘          │
│  Border: Transparent                                      │
│  Background: Transparent                                  │
│  CSS: .nexus-tool-button                                 │
│                                                           │
├──────────────────────────────────────────────────────────┤
│  HOVER STATE                                              │
│  ┌────────────────────────────────────────────┐          │
│ ▐│  ┌─────┐                                    │          │
│ ▐│  │ 📦  │  Packet Analyzer                   │→         │
│ ▐│  └─────┘  Network Forensics                 │          │
│  └────────────────────────────────────────────┘          │
│  Border-left: Teal gradient (animated)                    │
│  Background: Teal gradient fade (left to right)           │
│  Transform: translateX(4px)                               │
│  CSS: .nexus-tool-button:hover                           │
│                                                           │
├──────────────────────────────────────────────────────────┤
│  ACTIVE STATE                                             │
│  ┌────────────────────────────────────────────┐          │
│ ▓│  ┌─────┐                                    │          │
│ ▓│  │ 📦  │  Packet Analyzer                   │          │
│ ▓│  └─────┘  Network Forensics                 │          │
│  └────────────────────────────────────────────┘          │
│  Border-left: Teal (glowing)                              │
│  Background: Teal→Purple gradient                         │
│  Icon: Teal→Purple gradient, scaled 1.05                  │
│  Glow: Multi-layer shadow                                 │
│  CSS: .nexus-tool-button--active                         │
│                                                           │
└──────────────────────────────────────────────────────────┘
```



### 🎭 Agent Card Layout (IMPLEMENTED)
```
┌──────────────────────────────────────────────────────────┐
│  AGENT SELECTION CARD                                     │
│                                                           │
│  ┌────────────────────────────────────────────────┐      │
│  │                                                 │      │
│  │  ┌─────────────────────────────────────────┐   │      │
│  │  │                                         │   │      │
│  │  │        AGENT CARD IMAGE                 │   │      │
│  │  │        (192px × 192px)                  │   │      │
│  │  │                                         │   │      │
│  │  │  ┌─────────────────────────────────┐   │   │      │
│  │  │  │ Dark gradient overlay          │   │   │      │
│  │  │  │ CIPHER                         │   │   │      │
│  │  │  └─────────────────────────────────┘   │   │      │
│  │  └─────────────────────────────────────────┘   │      │
│  │                                                 │      │
│  │  BREACH ARCHITECT                               │      │
│  │  System exploitation specialist                 │      │
│  │                                                 │      │
│  │  ▓▓▓▓▓▓▓▓▓▓ Hacking    100                     │      │
│  │  ▓▓▓▓▓▓░░░░ Stealth     60                     │      │
│  │  ▓▓▓▓░░░░░░ Combat      40                     │      │
│  │  ▓▓▓▓▓▓▓░░░ Analysis    70                     │      │
│  │                                                 │      │
│  │  Key Abilities:                                 │      │
│  │  • Cipher Cache: False telemetry echo          │      │
│  │  • Ghost Port: Disable external logs           │      │
│  │  • System Lattice: Backdoor deployment         │      │
│  │                                                 │      │
│  │  "Language of systems is code."                │      │
│  └────────────────────────────────────────────────┘      │
│                                                           │
│  Image Assets:                                            │
│  • Hacker: /assets/card-left-01.webp                     │
│  • Infiltrator: /assets/card-right-01.webp               │
│  • Analyst: /assets/card-left-03.webp                    │
│                                                           │
│  Features:                                                │
│  • Hover scale transform (1.05x)                         │
│  • Theme-aware gradient overlay                           │
│  • Fallback to gradient icon if image fails              │
│  • Codename overlay on image                              │
│  • Selection state with glow effect                       │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 🔘 Button States (NexusButton Component)
```
┌──────────────────────────────────────────────────────────┐
│  PRIMARY ACTION BUTTON (Normal)                           │
│                                                           │
│   ╔════════════════╗                                     │
│   ║   ANALYZE ▶    ║                                     │
│   ╚════════════════╝                                     │
│                                                           │
│  Background: Teal→Purple gradient                        │
│  Text: White (high contrast)                              │
│  Corner: 8px clip-path cut                                │
│  CSS: .nexus-button, variant="primary"                   │
│                                                           │
├──────────────────────────────────────────────────────────┤
│  PRIMARY ACTION BUTTON (Hover)                            │
│                                                           │
│   ╔════════════════╗  ↑ Lifted 2px                      │
│   ║   ANALYZE ▶    ║                                     │
│   ╚════════════════╝                                     │
│      ╰───────────╯  ← Strong glow (30px + 60px)         │
│                                                           │
│  Background: Gold→Teal gradient (overlay)                │
│  Glow: Multi-layer teal shadow                            │
│  Transform: translateY(-2px)                              │
│  Inset: Top highlight line                                │
│  CSS: .nexus-button:hover                                │
│                                                           │
├──────────────────────────────────────────────────────────┤
│  SECONDARY BUTTON (Normal)                                │
│                                                           │
│   ┌────────────────┐                                     │
│   │   RESET ↻      │                                     │
│   └────────────────┘                                     │
│                                                           │
│  Background: Transparent                                  │
│  Border: Gray                                             │
│  Text: Light gray                                         │
│  CSS: .nexus-button, variant="secondary"                 │
│                                                           │
├──────────────────────────────────────────────────────────┤
│  SECONDARY BUTTON (Hover)                                 │
│                                                           │
│   ┌────────────────┐  → Slides right 2px                │
│  ▐│   RESET ↻      │                                     │
│   └────────────────┘                                     │
│    ╰─────────────╯  ← Teal glow                         │
│                                                           │
│  Background: Teal gradient fade (left to right)           │
│  Border: Teal                                             │
│  Glow: 15px teal shadow                                   │
│  Transform: translateX(2px)                               │
│  CSS: .nexus-button:hover                                │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 📊 Progress Bar States
```
┌──────────────────────────────────────────────────────────┐
│  PROGRESS BAR (35% Complete)                              │
│                                                           │
│  ┌────────────────────────────────────────────────┐      │
│  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░│      │
│  └────────────────────────────────────────────────┘      │
│   ╰──────────────╯ ← Teal→Purple→Gold gradient          │
│                                                           │
│  Container: Dark gray background                          │
│  Fill: Multi-color gradient                               │
│  Glow: 15px teal shadow on fill                          │
│  Edge: White highlight on right edge                      │
│  Animation: Shimmer overlay (2s loop)                     │
│  CSS: .nexus-progress                                     │
│                                                           │
├──────────────────────────────────────────────────────────┤
│  PROGRESS BAR (85% Complete)                              │
│                                                           │
│  ┌────────────────────────────────────────────────┐      │
│  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░│      │
│  └────────────────────────────────────────────────┘      │
│   ╰──────────────────────────────────╯ ← Stronger glow  │
│                                                           │
│  Same styling, more intense glow as it fills              │
│  CSS: .nexus-progress--success/.warning/.danger          │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 💻 Terminal Window
```
┌──────────────────────────────────────────────────────────┐
│  TERMINAL (Metallic Frame)                                │
│                                                           │
│  ╔════════════════════════════════════════════════╗      │
│  ║  FORENSICS_LOG // REAL-TIME          [CLEAR]  ║      │
│  ╟────────────────────────────────────────────────╢      │
│  ║                                                 ║      │
│  ║  [SYSTEM] Analyst Protocol initialized...      ║      │
│  ║  [INFO] Awaiting forensics tool selection...   ║      │
│  ║  [SUCCESS] Packet analyzer loaded              ║      │
│  ║  [SCAN] Analyzing packet stream...             ║      │
│  ║  [DATA] Recovered 4 fragments                  ║      │
│  ║  [WARNING] Corruption detected in sector 3     ║      │
│  ║                                                 ║      │
│  ╟────────────────────────────────────────────────╢      │
│  ║  analyst@nexus:~$ _                            ║      │
│  ╚════════════════════════════════════════════════╝      │
│                                                           │
│  Frame: Bronze→Gold→Teal gradient border                 │
│  Background: Black→Dark blue gradient                     │
│  Text: Teal (primary), various colors for states          │
│  Overlay: Scanline texture (subtle)                       │
│  Corners: 12px angular clip-path cuts                     │
│  CSS: .nexus-terminal                                     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 4. ANIMATION SEQUENCES

### 🎬 GSAP Animation Library (IMPLEMENTED)

The project includes a comprehensive animation library at `frontend/src/lib/animations.ts` with performance-optimized animations:

#### **Core Animation Functions**
```javascript
import { NexusAnimations } from '../lib/animations';

// Entrance animations with GPU acceleration
NexusAnimations.enterFromLeft(elements, options);
NexusAnimations.enterFromRight(elements, options);
NexusAnimations.enterFromBottom(elements, options);

// Interactive feedback
NexusAnimations.buttonPress(element);
NexusAnimations.cardHover(element);
NexusAnimations.cardHoverOut(element);

// Mission-specific animations
NexusAnimations.objectiveComplete(element);
NexusAnimations.traceUpdate(element, newLevel);
NexusAnimations.agentReveal(elements);
NexusAnimations.systemAlert(elements);

// Theme transitions
NexusAnimations.themeTransition(elements, newTheme);
```

#### **Performance Features**
- GPU acceleration with `force3D: true`
- Animation count monitoring (max 10 concurrent)
- Debounced high-frequency updates
- Reduced motion support
- Memory cleanup utilities

### 🎬 Tool Button Activation Sequence
```
Frame 1 (0ms):     Normal State
┌────────────┐
│  ┌──┐      │
│  │📦│ Tool │
│  └──┘      │
└────────────┘

Frame 2 (100ms):   Hover Start
┌────────────┐
▐│  ┌──┐      │
▐│  │📦│ Tool │→
▐│  └──┘      │
└────────────┘
↑ Accent bar grows

Frame 3 (200ms):   Hover Mid
┌────────────┐
▓│  ┌──┐      │
▓│  │📦│ Tool │→
▓│  └──┘      │
└────────────┘
↑ Background fades in

Frame 4 (300ms):   Hover Complete
┌────────────┐
▓│  ┌──┐      │
▓│  │📦│ Tool │→→
▓│  └──┘      │
└────────────┘
↑ Full transform

Frame 5 (Click):   Active State
┌────────────┐
▓│  ┌══┐      │
▓│  │📦│ Tool │
▓│  └══┘      │
└────────────┘


### 📊 Progress Bar Fill Animation
```
Frame 1 (0%):
┌──────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└──────────────────────────────────────┘

Frame 2 (25%):
┌──────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└──────────────────────────────────────┘
 ╰──────╯ ← Gradient + shimmer

Frame 3 (50%):
┌──────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░│
└──────────────────────────────────────┘
 ╰────────────────╯ ← Stronger glow

Frame 4 (75%):
┌──────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░│
└──────────────────────────────────────┘
 ╰──────────────────────────╯

Frame 5 (100%):
┌──────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└──────────────────────────────────────┘
 ╰════════════════════════════════════╯
 ↑ Maximum glow intensity
```

### 🎭 Agent Theme Transition
```javascript
// GSAP Timeline for theme switching - IMPLEMENTED
import { NexusAnimations } from '../lib/animations';

const themeTransition = NexusAnimations.themeTransition(
  '.theme-dependent', 
  newTheme
);

// Alternative implementation using useTheme hook
const { setTheme } = useTheme();
setTheme(newAgentId); // Automatically handles transition
```

---

## 5. TYPOGRAPHY & SPACING

### 🔤 Font System
```
Display Font:    'Orbitron', Arial, sans-serif
Body Font:       'Inter', system-ui, sans-serif  
Monospace Font:  'JetBrains Mono', 'Courier New', monospace

Font Sizes:
- text-xs:    0.75rem (12px)
- text-sm:    0.875rem (14px)
- text-base:  1rem (16px)
- text-lg:    1.125rem (18px)
- text-xl:    1.25rem (20px)
- text-2xl:   1.5rem (24px)
- text-3xl:   1.875rem (30px)
- text-4xl:   2.25rem (36px)
- text-5xl:   3rem (48px)
```

### 📏 Spacing System
```
Component Dimensions:
Header Height:        56px (h-14)
Sidebar Width:        288px (w-72)
Right Panel Width:    320px (w-80)
Terminal Height:      192px (h-48)

Tool Button:          Full width × 48px
Icon Box:             36px × 36px (w-9 h-9)
Hexagonal Cell:       1:1 aspect ratio
Progress Bar:         Full width × 6px

Padding Scale:
- p-1:    4px
- p-2:    8px
- p-3:    12px
- p-4:    16px
- p-6:    24px
- p-8:    32px

Gap Scale:
- gap-1:  4px
- gap-2:  8px
- gap-3:  12px
- gap-4:  16px
- gap-6:  24px
- gap-8:  32px
```

### 🎨 Border & Corner System
```
Border Radius:
- rounded-sm:   2px
- rounded:      4px
- rounded-md:   6px
- rounded-lg:   8px
- rounded-xl:   12px
- rounded-2xl:  16px

Corner Cuts (clip-path):
- Panel Corner Cut:     8px
- Button Corner Cut:    4px
- Terminal Corner Cut:  12px

Border Widths:
- border:     1px
- border-2:   2px
- border-4:   4px
```

### 🌈 Gradient System
```css
/* Primary Button Gradient */
.bg-gradient-theme {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-accent));
}

/* Panel Border Gradient */
.border-gradient-theme {
  border-image: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary)) 1;
}

/* Progress Bar Gradient */
.progress-gradient {
  background: linear-gradient(90deg, 
    var(--theme-primary) 0%, 
    var(--theme-secondary) 50%, 
    var(--theme-accent) 100%
  );
}
```

### 💫 Glow Intensity Scale
```css
/* Level 0: No Glow */
.glow-none {
  box-shadow: none;
}

/* Level 1: Subtle Glow (Borders) */
.glow-subtle {
  box-shadow: 0 0 5px rgba(var(--theme-primary-rgb), 0.2);
}

/* Level 2: Moderate Glow (Hover) */
.glow-moderate {
  box-shadow: 0 0 15px rgba(var(--theme-primary-rgb), 0.4);
}

/* Level 3: Strong Glow (Active) */
.glow-strong {
  box-shadow: 
    0 0 20px rgba(var(--theme-primary-rgb), 0.6),
    0 0 40px rgba(var(--theme-primary-rgb), 0.3);
}

/* Level 4: Maximum Glow (Selected) */
.glow-maximum {
  box-shadow: 
    0 0 20px rgba(var(--theme-primary-rgb), 0.8),
    0 0 40px rgba(var(--theme-primary-rgb), 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
```

---

## 6. IMPLEMENTATION REFERENCE

### 📁 File Structure Mapping
```
Visual Guide Component → Implementation Files
├─ Color System        → frontend/src/hooks/useTheme.ts
├─ Layout Architecture → frontend/src/components/Analyst/AnalystInterface.tsx
├─ Button Components   → frontend/src/components/UI/NexusButton.tsx
├─ Card Components     → frontend/src/components/UI/NexusCard.tsx
├─ Animation Library   → frontend/src/lib/animations.ts
├─ CSS Styles          → frontend/src/styles/nexus-components.css
├─ Theme Integration   → frontend/src/styles/nexus-themes.css
├─ Agent Selection     → frontend/src/components/Agent/AgentSelect.tsx
├─ Mission Interface   → frontend/src/components/Mission/MissionUI.tsx
├─ Auth Interface      → frontend/src/components/Auth/LoginScreen.tsx
├─ Error Handling      → frontend/src/components/UI/ErrorBoundary.tsx
├─ Accessibility       → frontend/src/hooks/useAccessibility.ts
├─ Performance         → frontend/src/hooks/usePerformance.ts
└─ Agent Card Assets   → assets/card-left-01.webp, card-right-01.webp, card-left-03.webp
```

### 🔧 CSS Class Reference
```css
/* Layout Classes - IMPLEMENTED */
.nexus-header              /* Main header with angular cuts */
.nexus-left-panel          /* Left tools panel (288px) */
.nexus-right-panel         /* Right status panel (320px) */
.nexus-center-panel        /* Main content area */

/* Component Classes - IMPLEMENTED */
.nexus-button              /* Base button component */
.nexus-card                /* Base card component */
.nexus-interface           /* Main grid layout */

/* Analyst Interface Classes - IMPLEMENTED */
.nexus-tool-button         /* Sidebar tool buttons */
.nexus-hex-grid            /* Hexagonal cell grid */
.nexus-hex-cell            /* Individual hex cells */
.nexus-terminal            /* Terminal window */
.nexus-progress            /* Progress bars */

/* State Modifiers - IMPLEMENTED */
.nexus-tool-button--active    /* Active tool state */
.nexus-hex-cell--selected     /* Selected hex cell */
.nexus-hex-cell--corrupted    /* Corrupted hex cell */
.nexus-progress--success      /* Success progress bar */
.nexus-progress--warning      /* Warning progress bar */
.nexus-progress--danger       /* Danger progress bar */

/* Theme Classes - IMPLEMENTED */
.text-theme-primary        /* Theme-aware text color */
.bg-theme-primary          /* Theme-aware background */
.border-theme-primary      /* Theme-aware border */
.shadow-theme-glow         /* Theme-aware glow effect */

/* Animation Classes - IMPLEMENTED */
.animate-theme-pulse       /* Theme-aware pulse animation */
.animate-theme-glow        /* Theme-aware glow animation */
.animate-theme-shimmer     /* Theme-aware shimmer animation */
```

### 🎭 Component Props Reference
```typescript
// NexusButton Props
interface NexusButtonProps {
  variant: 'primary' | 'secondary' | 'tool' | 'danger' | 'success';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  active?: boolean;
}

// NexusCard Props
interface NexusCardProps {
  variant: 'default' | 'elevated' | 'outlined' | 'agent';
  size: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  selected?: boolean;
  loading?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

// Theme Hook
interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  highlight: string;
  glow: string;
  name: string;
}
```

---

## 7. ACCESSIBILITY GUIDELINES

### ♿ WCAG AA Compliance
```
Color Contrast:
- Normal text:     4.5:1 minimum
- Large text:      3:1 minimum
- UI components:   3:1 minimum

Focus Management:
- Visible focus indicators on all interactive elements
- Logical tab order throughout interface
- Focus trapping in modal dialogs
- Focus restoration after modal close

Keyboard Navigation:
- All functionality available via keyboard
- Standard keyboard shortcuts supported
- Arrow keys for grid navigation
- Enter/Space for activation
- Escape for cancellation

Screen Reader Support:
- Semantic HTML structure
- ARIA labels and descriptions
- Live region announcements
- Status updates communicated
- Progress indicators announced
```

### 🎯 Implementation Examples
```typescript
// Accessible button with screen reader support
<NexusButton
  variant="primary"
  onClick={handleAnalyze}
  aria-label="Analyze selected packet data"
  aria-describedby="analyze-help-text"
>
  ANALYZE ▶
</NexusButton>

// Accessible hex grid with keyboard navigation
<div 
  className="nexus-hex-grid"
  role="grid"
  aria-label="Packet analysis grid"
>
  {hexGrid.map((cell, index) => (
    <div
      key={cell.id}
      className={`nexus-hex-cell ${cell.selected ? 'nexus-hex-cell--selected' : ''}`}
      role="gridcell"
      tabIndex={cell.selected ? 0 : -1}
      aria-selected={cell.selected}
      aria-label={`Cell ${cell.content}, ${cell.corrupted ? 'corrupted' : 'normal'}`}
      onClick={() => handleHexCellClick(cell.id)}
      onKeyDown={(e) => handleHexCellKeyDown(e, cell.id)}
    >
      {cell.corrupted ? '??' : cell.content}
    </div>
  ))}
</div>

// Accessible progress bar with live updates
<div 
  className="nexus-progress"
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Analysis progress"
>
  <div 
    className="nexus-progress__fill"
    style={{ width: `${progress}%` }}
  />
</div>
```

---

## 8. CROSS-REFERENCES

### 📚 Related Documentation
```
Primary References:
├─ NEXUS_PROTOCOL_MASTER_DOCUMENTATION.md  (Complete project overview)
├─ NEXUS_PROTOCOL_MERGED_README.md         (Merged implementation guide)
├─ frontend/src/styles/nexus-components.css (CSS implementation)
├─ frontend/src/styles/nexus-themes.css     (Theme system)
├─ frontend/src/lib/animations.ts           (Animation library)
├─ frontend/src/hooks/useTheme.ts           (Theme management)
├─ frontend/src/hooks/useAccessibility.ts   (Accessibility utilities)
├─ frontend/src/hooks/usePerformance.ts     (Performance monitoring)
└─ frontend/tailwind.config.js              (Tailwind configuration)

Component References:
├─ frontend/src/components/UI/NexusButton.tsx
├─ frontend/src/components/UI/NexusCard.tsx
├─ frontend/src/components/UI/ErrorBoundary.tsx
├─ frontend/src/components/Agent/AgentSelect.tsx
├─ frontend/src/components/Analyst/AnalystInterface.tsx
├─ frontend/src/components/Mission/MissionUI.tsx
├─ frontend/src/components/Mission/MissionBriefing.tsx
├─ frontend/src/components/Auth/LoginScreen.tsx
├─ frontend/src/components/Trailer/TrailerSequence.tsx
└─ frontend/src/context/GameContext.tsx

Backend References:
├─ backend/game/EnhancedGameEngine.js       (Game logic)
├─ backend/middleware/websocket.js          (Real-time communication)
├─ backend/middleware/auth.js               (Authentication)
└─ backend/models/PostgreSQLDatabase.js     (Database layer)

Deployment & Setup:
├─ nexus-protocol-launcher.bat             (Windows launcher)
├─ start-production.sh                     (Production startup)
├─ stop-services.sh                        (Service management)
├─ LAN_SETUP_GUIDE.md                      (Network setup)
└─ deploy-production.sh                    (Production deployment)
```

### 🔗 External Resources
```
Design Inspiration:
├─ Arcane (Netflix) - Hextech UI aesthetic
├─ VALORANT - Clean tactical interface design
├─ Cyberpunk 2077 - Neon-noir atmosphere
└─ Ghost in the Shell - Cyber-interface language

Technical Standards:
├─ WCAG 2.1 AA Guidelines
├─ Material Design Accessibility
├─ React Accessibility Documentation
└─ GSAP Animation Best Practices
```

### 🎨 Design Tokens
```javascript
// Export design tokens for external tools
export const NEXUS_DESIGN_TOKENS = {
  colors: {
    arcane: {
      teal: '#0ac8b9',
      gold: '#d4af37',
      purple: '#8b5cf6',
      red: '#ff4655'
    },
    agents: {
      hacker: { primary: '#FF1744', secondary: '#DC143C', accent: '#8B0000' },
      infiltrator: { primary: '#00D4FF', secondary: '#6B2FB5', accent: '#9D4EDD' },
      analyst: { primary: '#0ac8b9', secondary: '#00CED1', accent: '#00FF9F' }
    }
  },
  spacing: {
    xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px'
  },
  typography: {
    display: 'Orbitron, Arial, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, Courier New, monospace'
  },
  animation: {
    fast: '0.2s ease-out',
    medium: '0.4s ease-out',
    slow: '0.8s ease-out'
  }
};
```

---

## 9. IMPLEMENTATION STATUS & GAPS

### ✅ Fully Implemented Components

#### **Core Infrastructure**
- ✅ React + TypeScript + Tailwind setup
- ✅ GSAP animation system (`frontend/src/lib/animations.ts`)
- ✅ Theme management system (`frontend/src/hooks/useTheme.ts`)
- ✅ Accessibility framework (`frontend/src/hooks/useAccessibility.ts`)
- ✅ Performance monitoring (`frontend/src/hooks/usePerformance.ts`)

#### **UI Components**
- ✅ NexusButton with full accessibility (`frontend/src/components/UI/NexusButton.tsx`)
- ✅ NexusCard with theme integration (`frontend/src/components/UI/NexusCard.tsx`)
- ✅ ErrorBoundary with Nexus theming (`frontend/src/components/UI/ErrorBoundary.tsx`)
- ✅ AgentSelect with animations and card images (`frontend/src/components/Agent/AgentSelect.tsx`)

#### **Game Components**
- ✅ AnalystInterface with hex grid (`frontend/src/components/Analyst/AnalystInterface.tsx`)
- ✅ MissionUI with real-time updates (`frontend/src/components/Mission/MissionUI.tsx`)
- ✅ MissionBriefing with selection (`frontend/src/components/Mission/MissionBriefing.tsx`)
- ✅ LoginScreen with authentication (`frontend/src/components/Auth/LoginScreen.tsx`)
- ✅ GameContext for state management (`frontend/src/context/GameContext.tsx`)

#### **Styling System**
- ✅ Complete CSS component library (`frontend/src/styles/nexus-components.css`)
- ✅ Dynamic theme system (`frontend/src/styles/nexus-themes.css`)
- ✅ Tailwind integration (`frontend/tailwind.config.js`)

### 🔄 Partially Implemented

#### **TrailerSequence Component**
- 🔄 Component exists (`frontend/src/components/Trailer/TrailerSequence.tsx`)
- ❌ 55-second cinematic timeline not fully implemented
- ❌ Agent showcase transitions missing

#### **Hexagonal Grid System**
- ✅ Basic implementation in AnalystInterface
- ❌ CSS classes `.nexus-hex-grid`, `.nexus-hex-cell` need refinement
- ❌ Corrupted cell animations missing

### ❌ Missing Components

#### **CSS Classes Referenced but Not Implemented**
```css
/* These classes are referenced in the guide but missing from CSS files */
.nexus-tool-button         /* Sidebar tool buttons */
.nexus-hex-grid            /* Hexagonal cell grid */
.nexus-hex-cell            /* Individual hex cells */
.nexus-hex-cell--selected  /* Selected hex cell */
.nexus-hex-cell--corrupted /* Corrupted hex cell */
.nexus-terminal            /* Terminal window */
.nexus-terminal__header    /* Terminal header */
.nexus-terminal__content   /* Terminal content area */
.nexus-terminal__line      /* Terminal text lines */
.nexus-terminal__prompt    /* Terminal prompt */
```

#### **Animation Sequences**
- ❌ Tool button activation sequence (frames 1-5)
- ❌ Progress bar fill animation with shimmer
- ❌ Terminal typing animations
- ❌ Hex cell corruption effects

#### **System Components**
- ❌ System/folder is empty - no system-level components
- ❌ Particle system for environmental effects
- ❌ Glitch overlay system
- ❌ System breaker alert animations

### 🔧 Missing CSS Classes Implementation

#### **Terminal Component Classes**
```css
/* Terminal window with metallic frame */
.nexus-terminal {
  background: linear-gradient(135deg, var(--bg-dark), var(--bg-panel));
  border: 2px solid var(--bg-border);
  border-radius: 12px;
  font-family: var(--font-mono);
  overflow: hidden;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.nexus-terminal__header {
  background: var(--bg-panel);
  border-bottom: 1px solid var(--bg-border);
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.nexus-terminal__content {
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
  background: var(--bg-dark);
}

.nexus-terminal__line {
  margin-bottom: 4px;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.nexus-terminal__line--system { color: var(--theme-primary); }
.nexus-terminal__line--success { color: var(--success); }
.nexus-terminal__line--warning { color: var(--warning); }
.nexus-terminal__line--error { color: var(--danger); }

.nexus-terminal__prompt {
  color: var(--theme-primary);
  margin-top: 8px;
}

.nexus-terminal__prompt::after {
  content: '_';
  animation: blink 1s infinite;
}
```

#### **Hexagonal Grid Classes**
```css
/* Hexagonal packet grid */
.nexus-hex-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  padding: 16px;
  background: var(--bg-panel);
  border-radius: 8px;
}

.nexus-hex-cell {
  aspect-ratio: 1;
  background: var(--bg-card);
  border: 1px solid var(--bg-border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  clip-path: polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%);
}

.nexus-hex-cell:hover {
  border-color: var(--theme-primary);
  background: var(--theme-primary)20;
}

.nexus-hex-cell--selected {
  background: var(--theme-primary);
  color: #ffffff;
  box-shadow: 0 0 15px var(--theme-glow);
}

.nexus-hex-cell--corrupted {
  background: var(--danger);
  color: #ffffff;
  animation: hex-pulse 2s infinite;
}

@keyframes hex-pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 70, 85, 0.6); }
  50% { box-shadow: 0 0 25px rgba(255, 70, 85, 0.9); }
}
```

#### **Tool Button Classes**
```css
/* Sidebar tool buttons */
.nexus-tool-button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-left: 3px solid transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.nexus-tool-button:hover {
  border-left-color: var(--theme-primary);
  background: linear-gradient(90deg, var(--theme-glow), transparent);
  color: var(--theme-primary);
  transform: translateX(4px);
}

.nexus-tool-button--active {
  border-left-color: var(--theme-primary);
  background: linear-gradient(90deg, var(--theme-primary)20, var(--theme-accent)10);
  color: var(--theme-primary);
}

.nexus-tool-button__icon {
  width: 36px;
  height: 36px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.nexus-tool-button__content {
  flex: 1;
}

.nexus-tool-button__name {
  font-weight: 600;
  margin-bottom: 2px;
}

.nexus-tool-button__description {
  font-size: 0.75rem;
  opacity: 0.7;
}
```

---

## 🎯 VISUAL HIERARCHY

```
Level 1: Header & Navigation
├─ Highest contrast (#ece8e1 on dark)
├─ Largest text (text-xl, 20px)
├─ Corner accents and theme colors
└─ Angular clip-path styling

Level 2: Section Headers & Tool Names
├─ High contrast (#a0aec0)
├─ Medium text (text-sm, 14px)
├─ Uppercase + letter spacing
└─ Theme-colored accents

Level 3: Primary Content & Interactive Elements
├─ Medium contrast (#ece8e1)
├─ Normal text (text-base, 16px)
├─ Interactive hover states
└─ Clear focus indicators

Level 4: Secondary Content & Descriptions
├─ Lower contrast (#7a8a99)
├─ Small text (text-xs, 12px)
├─ Supporting information
└─ Subtle animations

Level 5: Tertiary Content & Metadata
├─ Lowest contrast (#7a8a99 at 0.7 opacity)
├─ Tiny text (10px)
├─ Timestamps and IDs
└─ Minimal visual weight
```

---

## 🎯 VISUAL HIERARCHY

```
Level 1: Header & Navigation
├─ Highest contrast (#ece8e1 on dark)
├─ Largest text (text-xl, 20px)
├─ Corner accents and theme colors
└─ Angular clip-path styling

Level 2: Section Headers & Tool Names
├─ High contrast (#a0aec0)
├─ Medium text (text-sm, 14px)
├─ Uppercase + letter spacing
└─ Theme-colored accents

Level 3: Primary Content & Interactive Elements
├─ Medium contrast (#ece8e1)
├─ Normal text (text-base, 16px)
├─ Interactive hover states
└─ Clear focus indicators

Level 4: Secondary Content & Descriptions
├─ Lower contrast (#7a8a99)
├─ Small text (text-xs, 12px)
├─ Supporting information
└─ Subtle animations

Level 5: Tertiary Content & Metadata
├─ Lowest contrast (#7a8a99 at 0.7 opacity)
├─ Tiny text (10px)
├─ Timestamps and IDs
└─ Minimal visual weight
```

---

## 🚀 QUICK IMPLEMENTATION GUIDE

### **Adding Missing CSS Classes**
1. Copy the CSS classes from section 10 to `frontend/src/styles/nexus-components.css`
2. Update component files to use the new classes
3. Test responsiveness and accessibility

### **Creating Terminal Component**
```typescript
// frontend/src/components/UI/NexusTerminal.tsx
interface NexusTerminalProps {
  lines: Array<{text: string, type: 'system' | 'success' | 'warning' | 'error'}>;
  onClear?: () => void;
  title?: string;
}
```

### **Enhancing Hex Grid**
```typescript
// Add to AnalystInterface.tsx
const handleHexCellKeyDown = (e: KeyboardEvent, cellId: string) => {
  if (e.key === 'Enter' || e.key === ' ') {
    handleHexCellClick(cellId);
  }
};
```

### **Tool Button Integration**
```typescript
// Add to AnalystInterface.tsx sidebar
{tools.map(tool => (
  <button
    key={tool.id}
    className={`nexus-tool-button ${tool.active ? 'nexus-tool-button--active' : ''}`}
    onClick={() => handleToolSelect(tool.id)}
  >
    <div className="nexus-tool-button__icon">{tool.icon}</div>
    <div className="nexus-tool-button__content">
      <div className="nexus-tool-button__name">{tool.name}</div>
      <div className="nexus-tool-button__description">{tool.description}</div>
    </div>
  </button>
))}
```

---

**Document Status**: ✅ **UPDATED & PRODUCTION READY**  
**Last Review**: December 20, 2025  
**Next Review**: January 15, 2026  
**Maintainer**: NEXUS Protocol Development Team

**Recent Updates**:
- ✅ Aligned with actual project structure
- ✅ Added implementation status tracking
- ✅ Included missing CSS class specifications
- ✅ Updated file references to match current codebase
- ✅ Added quick implementation guide
- ✅ Verified color consistency with useTheme.ts
- ✅ Updated animation references to match animations.ts

---

*This visual mockup guide serves as the definitive reference for implementing the NEXUS PROTOCOL user interface. All components, colors, and interactions are now aligned with the actual codebase and implementation status.*ns should follow these specifications to maintain visual consistency and accessibility standards.*