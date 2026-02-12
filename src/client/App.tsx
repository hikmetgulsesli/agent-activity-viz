import React from 'react';
import GlassCard from './components/GlassCard';
import AgentList from './components/AgentList';
import ActivityFeed from './components/ActivityFeed';
import TokenUsage from './components/TokenUsage';
import ModelSwitches from './components/ModelSwitches';
import { useWebSocket } from './hooks/useWebSocket';
import './styles/global.css';
import './App.css';

function App(): React.ReactElement {
  const { activities, events, status } = useWebSocket('ws://localhost:3503');

  return (
    <div className="app">
      <header className="app-header">
        <h1>Agent Activity Visualizer</h1>
        <p className="app-subtitle">Real-time OpenClaw agent activity dashboard</p>
      </header>
      
      <main className="app-main">
        <div className="dashboard-grid">
          <GlassCard title="Active Agents" className="card-agents">
            <AgentList activities={activities} />
          </GlassCard>
          
          <GlassCard title="Tool Usage" className="card-tools">
            <p>Waiting for activity...</p>
          </GlassCard>
          
          <GlassCard title="Model Switching" className="card-models">
            <ModelSwitches events={events} />
          </GlassCard>
          
          <GlassCard title="Token Usage" className="card-tokens">
            <TokenUsage activities={activities} />
          </GlassCard>
          
          <GlassCard title="Recent Events" className="card-events">
            <ActivityFeed events={events} />
          </GlassCard>
          
          <GlassCard title="System Status" className="card-status">
            <p>{status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}</p>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}

export default App;
