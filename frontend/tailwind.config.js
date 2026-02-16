/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Arcane Color Palette (Visual Mockup Guide)
        'arcane-teal': 'rgb(var(--color-arcane-teal) / <alpha-value>)',
        'arcane-gold': 'rgb(var(--color-arcane-gold) / <alpha-value>)',
        'arcane-purple': 'rgb(var(--color-arcane-purple) / <alpha-value>)',
        'arcane-red': 'rgb(var(--color-arcane-red) / <alpha-value>)',
        
        // Theme Colors
        'theme-primary': 'var(--theme-primary)',
        'theme-secondary': 'var(--theme-secondary)',
        'theme-accent': 'var(--theme-accent)',
        
        // Background Colors
        'bg-dark': 'rgb(var(--color-bg-dark) / <alpha-value>)',
        'bg-panel': 'rgb(var(--color-bg-panel) / <alpha-value>)',
        'bg-card': 'rgb(var(--color-bg-card) / <alpha-value>)',
        'bg-border': 'rgb(var(--color-bg-border) / <alpha-value>)',
        
        // Text Colors
        'text-main': 'rgb(var(--color-text-main) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        
        // Legacy compatibility
        'arcane-dark': 'rgb(var(--color-bg-dark) / <alpha-value>)',
        'arcane-panel': 'rgb(var(--color-bg-panel) / <alpha-value>)',
        'arcane-card': 'rgb(var(--color-bg-card) / <alpha-value>)',
        'arcane-border': 'rgb(var(--color-bg-border) / <alpha-value>)',
        'arcane-text': 'rgb(var(--color-text-main) / <alpha-value>)',
        'arcane-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
      },
      fontFamily: {
        'display': ['Orbitron', 'Arial', 'sans-serif'],
        'mono': ['Courier New', 'monospace'],
      },
      animation: {
        'hex-pulse': 'hex-pulse 2s infinite',
        'terminal-cursor': 'terminal-cursor 1s infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'hex-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255, 70, 85, 0.6)' },
          '50%': { boxShadow: '0 0 25px rgba(255, 70, 85, 0.9)' },
        },
        'terminal-cursor': {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        'shimmer': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      },
      clipPath: {
        'angular': 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        'button': 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
        'hex': 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.clip-angular': {
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        },
        '.clip-button': {
          clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
        },
        '.clip-hex': {
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}