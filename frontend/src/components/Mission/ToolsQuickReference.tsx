/**
 * NEXUS PROTOCOL - Tools Quick Reference Component
 * Quick access to tools and connections information
 * Version: 1.0.0
 * Last Updated: February 5, 2026
 */

import { useState } from 'react';
import NexusButton from '../UI/NexusButton.js';
import NexusCard from '../UI/NexusCard.js';

interface ToolsQuickReferenceProps {
  onClose: () => void;
}

const quickReference = {
  categories: [
    { icon: '🔍', name: 'Reconnaissance', description: 'Information gathering and network mapping' },
    { icon: '🕵️', name: 'Infiltration', description: 'Gaining unauthorized access to systems' },
    { icon: '💾', name: 'Extraction', description: 'Data retrieval and manipulation' },
    { icon: '👻', name: 'Stealth', description: 'Avoiding detection and maintaining cover' },
    { icon: '⚡', name: 'Disruption', description: 'Disabling security and creating chaos' },
    { icon: '📊', name: 'Analysis', description: 'Data analysis and pattern recognition' },
    { icon: '🔨', name: 'Assault', description: 'Brute force attacks on hardened targets' },
    { icon: '👁️', name: 'Surveillance', description: 'Long-term monitoring and intelligence' },
    { icon: '🛡️', name: 'Defense', description: 'Protecting against countermeasures' },
    { icon: '🚪', name: 'Escape', description: 'Emergency extraction and exit strategies' }
  ],
  connections: [
    { name: 'Basic Access', status: 'active', description: 'Standard network connection' },
    { name: 'Network Access', status: 'active', description: 'Deep network penetration' },
    { name: 'Advanced Access', status: 'pending', description: 'Elevated system privileges' },
    { name: 'Core Access', status: 'locked', description: 'Critical system access' }
  ],
  strategies: [
    {
      mission: 'Stealth Missions',
      tips: ['Use reconnaissance tools first', 'Prioritize stealth tools', 'Minimize trace generation', 'Plan escape routes']
    },
    {
      mission: 'Assault Missions',
      tips: ['Use disruption tools early', 'Accept higher trace levels', 'Create diversions', 'Focus on speed over stealth']
    },
    {
      mission: 'Infiltration Missions',
      tips: ['Combine infiltration + analysis', 'Use social engineering', 'Escalate privileges systematically', 'Maintain cover identity']
    }
  ]
};

export default function ToolsQuickReference({ onClose }: ToolsQuickReferenceProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'connections' | 'strategies'>('categories');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-arcane-panel border border-arcane-border rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-arcane-border">
          <h2 className="text-2xl font-bold font-display text-arcane-teal">
            🛠️ TOOLS QUICK REFERENCE
          </h2>
          <NexusButton variant="secondary" onClick={onClose}>
            ✕ Close
          </NexusButton>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-arcane-border">
          {[
            { id: 'categories', label: '📂 Categories', icon: '🔧' },
            { id: 'connections', label: '🔗 Connections', icon: '🌐' },
            { id: 'strategies', label: '🎯 Strategies', icon: '📋' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-theme-primary text-white border-b-2 border-theme-primary'
                  : 'text-arcane-muted hover:text-arcane-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickReference.categories.map((category, index) => (
                <NexusCard key={index}>
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold text-arcane-text mb-2">
                        {category.name}
                      </h3>
                      <p className="text-sm text-arcane-muted">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </NexusCard>
              ))}
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold font-display text-arcane-text mb-4">
                  Connection Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickReference.connections.map((connection, index) => (
                    <NexusCard key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-arcane-text">
                          {connection.name}
                        </h4>
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${
                          connection.status === 'active' ? 'bg-green-400/20 text-green-400' :
                          connection.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                          'bg-red-400/20 text-red-400'
                        }`}>
                          {connection.status.toUpperCase()}
                        </div>
                      </div>
                      <p className="text-xs text-arcane-muted">
                        {connection.description}
                      </p>
                    </NexusCard>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold font-display text-arcane-text mb-4">
                  Connection Guide
                </h3>
                <NexusCard>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-arcane-text font-semibold">Active:</span>
                      <span className="text-arcane-muted">Ready to use with compatible tools</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span className="text-arcane-text font-semibold">Pending:</span>
                      <span className="text-arcane-muted">Being established, may become available</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span className="text-arcane-text font-semibold">Locked:</span>
                      <span className="text-arcane-muted">Requires specific progress or tools to unlock</span>
                    </div>
                  </div>
                </NexusCard>
              </div>
            </div>
          )}

          {activeTab === 'strategies' && (
            <div className="space-y-6">
              {quickReference.strategies.map((strategy, index) => (
                <div key={index}>
                  <h3 className="text-xl font-bold font-display text-arcane-text mb-4">
                    {strategy.mission}
                  </h3>
                  <NexusCard>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {strategy.tips.map((tip, tipIndex) => (
                        <div key={tipIndex} className="flex items-start space-x-3">
                          <span className="text-theme-primary mt-1">•</span>
                          <span className="text-sm text-arcane-muted">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </NexusCard>
                </div>
              ))}

              <div>
                <h3 className="text-xl font-bold font-display text-arcane-text mb-4">
                  General Tips
                </h3>
                <NexusCard>
                  <div className="space-y-3 text-sm text-arcane-muted">
                    <div><strong className="text-theme-primary">Tool Synergies:</strong> Some tools work better together</div>
                    <div><strong className="text-theme-primary">Cooldown Management:</strong> Plan tool usage to avoid downtime</div>
                    <div><strong className="text-theme-primary">Trace Risk:</strong> Balance effectiveness against detection</div>
                    <div><strong className="text-theme-primary">Connection Progression:</strong> Use tools to unlock new connections</div>
                    <div><strong className="text-theme-primary">Emergency Tools:</strong> Keep escape tools ready for emergencies</div>
                  </div>
                </NexusCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}