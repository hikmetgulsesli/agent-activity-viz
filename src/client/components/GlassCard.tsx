import React from 'react';
import './GlassCard.css';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

function GlassCard({ children, className = '', title }: GlassCardProps): React.ReactElement {
  return (
    <div className={`glass-card ${className}`}>
      {title && <h3 className="glass-card-title">{title}</h3>}
      <div className="glass-card-content">
        {children}
      </div>
    </div>
  );
}

export default GlassCard;
