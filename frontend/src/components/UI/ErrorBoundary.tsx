/**
 * NEXUS PROTOCOL - Error Boundary Component
 * Performance-optimized error handling with graceful fallbacks
 * Version: 1.0.0
 * Last Updated: December 20, 2025
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class NexusErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error in development
    if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
      console.error('Nexus Protocol Error Boundary caught an error:', error, errorInfo);
    }
  }

  handleRestart = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default Nexus-themed error UI
      return (
        <div className="min-h-screen bg-arcane-dark flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <div className="bg-arcane-panel border border-red-500/30 rounded-lg p-8 text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-red-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>

              {/* Error Title */}
              <h2 className="text-xl font-bold text-red-400 mb-4 font-display">
                SYSTEM ERROR DETECTED
              </h2>

              {/* Error Message */}
              <p className="text-arcane-muted mb-6">
                The Nexus Protocol encountered an unexpected error. The system has been compromised.
              </p>

              {/* Error Details (Development Only) */}
              {typeof window !== 'undefined' && window.location?.hostname === 'localhost' && this.state.error && (
                <div className="mb-6 p-4 bg-arcane-dark rounded border border-arcane-border text-left">
                  <h3 className="text-sm font-semibold text-red-400 mb-2">Error Details:</h3>
                  <pre className="text-xs text-arcane-muted overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-arcane-muted cursor-pointer hover:text-arcane-text">
                        Stack Trace
                      </summary>
                      <pre className="text-xs text-arcane-muted mt-2 overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleRestart}
                  className="px-6 py-2 bg-arcane-teal text-arcane-dark font-semibold rounded hover:bg-arcane-teal/90 transition-colors duration-200"
                >
                  RESTART COMPONENT
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-6 py-2 border border-arcane-border text-arcane-text hover:border-arcane-teal hover:text-arcane-teal transition-colors duration-200 rounded"
                >
                  RELOAD PROTOCOL
                </button>
              </div>

              {/* Status Indicator */}
              <div className="mt-6 pt-4 border-t border-arcane-border">
                <div className="flex items-center justify-center text-xs text-arcane-muted">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                  SYSTEM STATUS: COMPROMISED
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NexusErrorBoundary;