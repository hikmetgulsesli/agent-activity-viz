import React from 'react';
import GlassCard from './components/GlassCard';
import './styles/global.css';
import './App.css';

function App(): React.ReactElement {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Agent Activity Visualizer</h1>
        <p className="app-subtitle">Real-time OpenClaw agent activity dashboard</p>
      </header>
      
      <main className="app-main">
        <div className="dashboard-grid">
          <GlassCard title="Active Agents" className="card-agents">
            <p>No agents currently active</p>
          </GlassCard>
          
          <GlassCard title="Tool Usage" className="card-tools">
            <p>Waiting for activity...</p>
          </GlassCard>
          
          <GlassCard title="Model Activity" className="card-models">
            <p>Waiting for activity...</p>
          </GlassCard>
          
          <GlassCard title="Token Usage" className="card-tokens">
            <p>Waiting for activity...</p>
          </GlassCard>
          
          <GlassCard title="Recent Events" className="card-events">
            <p>No recent events</p>
          </GlassCard>
          
          <GlassCard title="System Status" className="card-status">
            <p>Connected</p>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}

export default App;
