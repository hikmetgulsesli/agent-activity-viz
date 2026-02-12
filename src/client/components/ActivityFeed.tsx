import React, { useState, useEffect, useRef } from 'react';
import type { AgentEvent } from '../hooks/useWebSocket';
import './ActivityFeed.css';

export interface ActivityFeedProps {
  events: AgentEvent[];
}

/**
 * Get event type color class name
 */
function getEventTypeColor(eventType: string): string {
  switch (eventType) {
    case 'tool_called':
      return 'event-tool';
    case 'model_switched':
      return 'event-model';
    case 'agent_started':
      return 'event-agent-start';
    case 'agent_ended':
      return 'event-agent-end';
    default:
      return 'event-default';
  }
}

/**
 * Format timestamp as relative time (e.g., "2m ago")
 */
function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  
  if (diffMs < 0) {
    return 'just now';
  }
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return `${seconds}s ago`;
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return `${days}d ago`;
  }
}

/**
 * Get event details string from payload
 */
function getEventDetails(event: AgentEvent): string {
  switch (event.eventType) {
    case 'tool_called':
      return `Tool: ${event.payload.tool || 'unknown'}`;
    case 'model_switched':
      return `Model: ${event.payload.model || 'unknown'}`;
    case 'agent_started':
      return 'Agent started';
    case 'agent_ended':
      return 'Agent ended';
    case 'token_update':
      return `Tokens: ${event.payload.input || 0} in / ${event.payload.output || 0} out`;
    case 'heartbeat':
      return 'Heartbeat';
    default:
      return event.eventType;
  }
}

export default function ActivityFeed({ events }: ActivityFeedProps): React.ReactElement {
  const [userScrolled, setUserScrolled] = useState<boolean>(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const prevEventsLengthRef = useRef<number>(0);

  /**
   * Auto-scroll to bottom when new events arrive (unless user scrolled up)
   */
  useEffect(() => {
    if (!feedRef.current) {
      return;
    }

    // Only auto-scroll if:
    // 1. New events were added
    // 2. User hasn't manually scrolled up
    const newEventsAdded = events.length > prevEventsLengthRef.current;
    
    if (newEventsAdded && !userScrolled) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }

    prevEventsLengthRef.current = events.length;
  }, [events, userScrolled]);

  /**
   * Detect when user scrolls up (disable auto-scroll)
   * Re-enable auto-scroll when user scrolls to bottom
   */
  const handleScroll = (): void => {
    if (!feedRef.current) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10; // 10px threshold

    if (isAtBottom) {
      setUserScrolled(false);
    } else if (scrollTop < scrollHeight - clientHeight - 50) {
      // If user scrolled up more than 50px from bottom, mark as scrolled
      setUserScrolled(true);
    }
  };

  // Reverse events to show newest first
  const reversedEvents = [...events].reverse();

  // Show only last 100 events
  const displayEvents = reversedEvents.slice(0, 100);

  if (displayEvents.length === 0) {
    return (
      <div className="activity-feed-empty">
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div 
      className="activity-feed" 
      ref={feedRef}
      onScroll={handleScroll}
    >
      {displayEvents.map((event, index) => (
        <div 
          key={`${event.timestamp}-${event.agentId}-${index}`}
          className={`activity-event ${getEventTypeColor(event.eventType)}`}
        >
          <div className="event-header">
            <span className="event-timestamp">{formatRelativeTime(event.timestamp)}</span>
            <span className="event-agent">{event.agentId}</span>
          </div>
          <div className="event-details">
            <span className="event-type">{event.eventType}</span>
            <span className="event-info">{getEventDetails(event)}</span>
          </div>
        </div>
      ))}
      
      {userScrolled && (
        <div className="scroll-indicator">
          New events available ↓
        </div>
      )}
    </div>
  );
}
