import React from 'react';
import GlassCard from './components/GlassCard';
import AgentList from './components/AgentList';
import ActivityFeed from './components/ActivityFeed';
import TokenUsage from './components/TokenUsage';
import ModelSwitches from './components/ModelSwitches';
import ErrorBoundary from './components/ErrorBoundary';
import { useWebSocket } from './hooks/useWebSocket';
import './styles/global.css';
import './styles/ErrorBoundary.css';
import './App.css';

function App(): React.ReactElement {
  const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
  const { activities, events, status } = useWebSocket(wsUrl);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  // Update timestamp whenever we receive new events or activity changes
  React.useEffect(() => {
    if (events.length > 0 || activities.size > 0) {
      setLastUpdate(new Date());
    }
  }, [events.length, activities.size]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'connected':
        return 'var(--color-success)';
      case 'connecting':
        return 'var(--color-warning)';
      case 'disconnected':
        return 'var(--color-error)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <h1>Agent Activity Visualizer</h1>
              <p className="app-subtitle">Real-time OpenClaw agent activity dashboard</p>
            </div>
            <div className="header-right">
              <div className="connection-status">
                <span 
                  className={`status-indicator status-${status}`}
                  style={{ backgroundColor: getStatusColor() }}
                  title={status}
                />
                <span className="status-text">{status}</span>
              </div>
              <div className="last-update">
                <span className="update-label">Last Update:</span>
                <span className="update-time">{formatTime(lastUpdate)}</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="app-main">
          <div className="dashboard-layout">
            {/* Left column: Agent List (25% width) */}
            <div className="column-left">
              <GlassCard title="Active Agents">
                <AgentList activities={activities} />
              </GlassCard>
            </div>

            {/* Center column: Activity Feed (50% width) */}
            <div className="column-center">
              <GlassCard title="Recent Activity">
                <ActivityFeed events={events} />
              </GlassCard>
            </div>

            {/* Right column: Token Usage + Model Switches (25% width) */}
            <div className="column-right">
              <GlassCard title="Token Usage">
                <TokenUsage activities={activities} />
              </GlassCard>
              <GlassCard title="Model Switches">
                <ModelSwitches events={events} />
              </GlassCard>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
