/**
 * NEXUS PROTOCOL - Main Entry Point
 * React application entry with theme and error boundary setup
 * Version: 1.0.0
 * Last Updated: December 20, 2025
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './styles/nexus-components.css';
import './styles/nexus-themes.css';

// Create root and render app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);