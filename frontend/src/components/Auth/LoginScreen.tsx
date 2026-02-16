/**
 * NEXUS PROTOCOL - Login Screen Component
 * Team authentication interface
 * Version: 1.0.0
 * Last Updated: December 20, 2025
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { useAudio } from '../../context/AudioContext';
import NexusButton from '../UI/NexusButton';
import NexusCard from '../UI/NexusCard';

export default function LoginScreen() {
  const navigate = useNavigate();

  const [teamName, setTeamName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useGame();
  const { playSound } = useAudio();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(teamName, accessCode);
      if (result.success) {
        playSound('success');
        navigate('/agent-select');
      } else {
        playSound('error');
        setError(result.message || 'Invalid team name or access code');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setTeamName('Ghost');
    setAccessCode('1234');
  };

  return (
    <div className="min-h-screen bg-arcane-dark flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-display text-theme-primary mb-4">
            NEXUS PROTOCOL
          </h1>
          <p className="text-text-muted">
            Enter your team credentials to access the system
          </p>
        </div>

        <NexusCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="teamName" className="block text-sm font-medium text-text-main mb-2">
                Team Name
              </label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="input-theme"
                placeholder="Enter team name"
                required
              />
            </div>

            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-text-main mb-2">
                Access Code
              </label>
              <input
                id="accessCode"
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="input-theme"
                placeholder="Enter access code"
                required
              />
            </div>

            {error && (
              <div className="text-arcane-red text-sm text-center">
                {error}
              </div>
            )}

            <NexusButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={!teamName || !accessCode}
            >
              {isLoading ? 'Authenticating...' : 'Access Protocol'}
            </NexusButton>
          </form>

          <div className="mt-6 pt-6 border-t border-bg-border">
            <div className="text-center">
              <p className="text-sm text-text-muted mb-3">
                Demo Credentials
              </p>
              <NexusButton
                variant="secondary"
                size="sm"
                onClick={handleDemoLogin}
              >
                Use Demo Login
              </NexusButton>
              <p className="text-xs text-text-muted mt-2">
                Team: Ghost, Code: 1234
              </p>
            </div>
          </div>
        </NexusCard>
      </div>
    </div>
  );
}