/**
 * NEXUS PROTOCOL - Tools Interface Component
 * Comprehensive tools and connections management
 * Version: 1.0.0
 * Last Updated: February 5, 2026
 */

import { useState, useEffect } from 'react';
import NexusButton from '../UI/NexusButton.js';
import NexusCard from '../UI/NexusCard.js';

interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  usage: string;
  traceRisk: string;
  cooldown: number;
  requirements: string[];
}

interface ToolsInterfaceProps {
  onToolUse: (toolId: string) => void;
  onClose: () => void;
}

const toolCategories = [
  { id: 'reconnaissance', name: 'Reconnaissance', icon: '🔍', color: 'text-blue-400' },
  { id: 'infiltration', name: 'Infiltration', icon: '🕵️', color: 'text-purple-400' },
  { id: 'extraction', name: 'Extraction', icon: '💾', color: 'text-green-400' },
  { id: 'stealth', name: 'Stealth', icon: '👻', color: 'text-gray-400' },
  { id: 'disruption', name: 'Disruption', icon: '⚡', color: 'text-red-400' },
  { id: 'analysis', name: 'Analysis', icon: '📊', color: 'text-yellow-400' },
  { id: 'assault', name: 'Assault', icon: '🔨', color: 'text-orange-400' },
  { id: 'surveillance', name: 'Surveillance', icon: '👁️', color: 'text-indigo-400' },
  { id: 'defense', name: 'Defense', icon: '🛡️', color: 'text-cyan-400' },
  { id: 'escape', name: 'Escape', icon: '🚪', color: 'text-pink-400' }
];

const connectionRequirements = [
  { id: 'basic-access', name: 'Basic Access', description: 'Standard network connection', status: 'active' },
  { id: 'network-access', name: 'Network Access', description: 'Deep network penetration', status: 'active' },
  { id: 'advanced-access', name: 'Advanced Access', description: 'Elevated system privileges', status: 'pending' },
  { id: 'system-access', name: 'System Access', description: 'Core system integration', status: 'pending' },
  { id: 'core-access', name: 'Core Access', description: 'Critical system access', status: 'locked' },
  { id: 'admin-access', name: 'Admin Access', description: 'Administrative privileges', status: 'locked' },
  { id: 'quantum-key', name: 'Quantum Key', description: 'Quantum encryption access', status: 'locked' },
  { id: 'biometric-data', name: 'Biometric Data', description: 'Biometric authentication data', status: 'pending' },
  { id: 'social-data', name: 'Social Data', description: 'Social engineering intelligence', status: 'active' }
];

export default function ToolsInterface({ onToolUse, onClose }: ToolsInterfaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('reconnaissance');
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'connections'>('tools');
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchTools();
  }, [selectedCategory]);

  useEffect(() => {
    // Cooldown timer
    const timer = setInterval(() => {
      setCooldowns(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(toolId => {
          if (updated[toolId] > 0) {
            updated[toolId] -= 1;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/tools/category/${selectedCategory}`);
      const data = await response.json();
      if (data.success) {
        setTools(data.data.tools);
      }
    } catch (error) {
      console.error('Failed to fetch tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToolUse = async (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool || cooldowns[toolId] > 0) return;

    try {
      const response = await fetch('/api/v1/tools/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, missionId: 'current' })
      });

      const result = await response.json();
      if (result.success) {
        setCooldowns(prev => ({ ...prev, [toolId]: tool.cooldown }));
        onToolUse(toolId);
      }
    } catch (error) {
      console.error('Failed to use tool:', error);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Very High': return 'text-red-500';
      case 'High': return 'text-orange-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      case 'Very Low': return 'text-blue-500';
      case 'Negative': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'locked': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-arcane-panel border border-arcane-border rounded-lg w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-arcane-border">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold font-display text-arcane-teal">
              NEXUS TOOLKIT
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('tools')}
                className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                  activeTab === 'tools'
                    ? 'bg-theme-primary text-white'
                    : 'text-arcane-muted hover:text-arcane-text'
                }`}
              >
                🛠️ Tools
              </button>
              <button
                onClick={() => setActiveTab('connections')}
                className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
                  activeTab === 'connections'
                    ? 'bg-theme-primary text-white'
                    : 'text-arcane-muted hover:text-arcane-text'
                }`}
              >
                🔗 Connections
              </button>
            </div>
          </div>
          <NexusButton variant="secondary" onClick={onClose}>
            ✕ Close
          </NexusButton>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'tools' ? (
            <div className="flex h-full">
              {/* Categories Sidebar */}
              <div className="w-64 border-r border-arcane-border p-4 overflow-y-auto">
                <h3 className="text-sm font-semibold text-arcane-text mb-4">Categories</h3>
                <div className="space-y-2">
                  {toolCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left p-3 rounded transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-theme-primary/20 border border-theme-primary'
                          : 'hover:bg-arcane-panel border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{category.icon}</span>
                        <div>
                          <div className={`text-sm font-semibold ${category.color}`}>
                            {category.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tools Grid */}
              <div className="flex-1 p-6 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-arcane-muted">Loading tools...</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tools.map((tool) => {
                      const isOnCooldown = cooldowns[tool.id] > 0;
                      const category = toolCategories.find(c => c.id === tool.category);
                      
                      return (
                        <NexusCard key={tool.id} className="h-full">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{category?.icon}</span>
                              <h4 className="text-sm font-bold text-arcane-text">
                                {tool.name}
                              </h4>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs ${getRiskColor(tool.traceRisk)} bg-current/20`}>
                              {tool.traceRisk}
                            </div>
                          </div>

                          <p className="text-xs text-arcane-muted mb-3 line-clamp-2">
                            {tool.description}
                          </p>

                          <div className="text-xs text-arcane-muted mb-4">
                            <strong>Usage:</strong> {tool.usage}
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <div className="text-xs text-arcane-muted">
                              Cooldown: {tool.cooldown}s
                            </div>
                            {isOnCooldown && (
                              <div className="text-xs text-yellow-400">
                                {cooldowns[tool.id]}s
                              </div>
                            )}
                          </div>

                          <div className="mb-4">
                            <div className="text-xs text-arcane-muted mb-1">Requirements:</div>
                            <div className="flex flex-wrap gap-1">
                              {tool.requirements.map((req) => (
                                <span
                                  key={req}
                                  className="px-2 py-1 bg-arcane-border rounded text-xs text-arcane-text"
                                >
                                  {req.replace('-', ' ')}
                                </span>
                              ))}
                            </div>
                          </div>

                          <NexusButton
                            variant="tool"
                            size="sm"
                            fullWidth
                            disabled={isOnCooldown}
                            onClick={() => handleToolUse(tool.id)}
                          >
                            {isOnCooldown ? `Cooldown (${cooldowns[tool.id]}s)` : 'Use Tool'}
                          </NexusButton>
                        </NexusCard>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Connections Tab */
            <div className="p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-xl font-bold font-display text-arcane-text mb-6">
                  Network Connections & Requirements
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connectionRequirements.map((connection) => (
                    <NexusCard key={connection.id}>
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-bold text-arcane-text">
                          {connection.name}
                        </h4>
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${getConnectionStatusColor(connection.status)}`}>
                          {connection.status.toUpperCase()}
                        </div>
                      </div>
                      
                      <p className="text-xs text-arcane-muted mb-4">
                        {connection.description}
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          connection.status === 'active' ? 'bg-green-400' :
                          connection.status === 'pending' ? 'bg-yellow-400' :
                          'bg-red-400'
                        }`} />
                        <span className="text-xs text-arcane-muted">
                          {connection.status === 'active' ? 'Connected' :
                           connection.status === 'pending' ? 'Establishing...' :
                           'Access Required'}
                        </span>
                      </div>
                    </NexusCard>
                  ))}
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-bold font-display text-arcane-text mb-4">
                    Connection Guide
                  </h4>
                  <NexusCard>
                    <div className="space-y-4 text-sm text-arcane-muted">
                      <div>
                        <strong className="text-arcane-text">Active Connections:</strong> Ready to use with compatible tools
                      </div>
                      <div>
                        <strong className="text-arcane-text">Pending Connections:</strong> Being established, may become available during mission
                      </div>
                      <div>
                        <strong className="text-arcane-text">Locked Connections:</strong> Require specific mission progress or tools to unlock
                      </div>
                      <div className="pt-2 border-t border-arcane-border">
                        <strong className="text-theme-primary">Pro Tip:</strong> Some tools can help establish new connections or upgrade existing ones. Plan your tool usage strategically!
                      </div>
                    </div>
                  </NexusCard>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}