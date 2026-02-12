import { describe, it, expect } from 'vitest';
import { AgentActivityStreamer } from '../server/AgentActivityStreamer.js';
import { DataCollector } from '../server/DataCollector.js';

describe('Server Unit Tests', () => {
  describe('AgentActivityStreamer', () => {
    it('should create instance', () => {
      const streamer = new AgentActivityStreamer();
      expect(streamer).toBeDefined();
      expect(streamer).toBeInstanceOf(AgentActivityStreamer);
    });

    it('should track client count', () => {
      const streamer = new AgentActivityStreamer();
      const initialCount = streamer.getClientCount();
      expect(initialCount).toBe(0);
    });
  });

  describe('DataCollector', () => {
    it('should create instance', () => {
      const collector = new DataCollector();
      expect(collector).toBeDefined();
      expect(collector).toBeInstanceOf(DataCollector);
    });

    it('should take snapshot', () => {
      const collector = new DataCollector();
      const snapshot = collector.takeSnapshot();
      expect(snapshot).toBeDefined();
      expect(snapshot).toHaveProperty('agents');
      expect(Array.isArray(snapshot.agents)).toBe(true);
    });

    it('should detect state changes', () => {
      const collector = new DataCollector();
      const snapshot = collector.takeSnapshot();
      const changes = collector.detectStateChanges(snapshot.agents);
      expect(Array.isArray(changes)).toBe(true);
    });

    it('should detect model switches', () => {
      const collector = new DataCollector();
      const snapshot = collector.takeSnapshot();
      const switches = collector.detectModelSwitches(snapshot.agents);
      expect(Array.isArray(switches)).toBe(true);
    });

    it('should calculate token deltas', () => {
      const collector = new DataCollector();
      const snapshot = collector.takeSnapshot();
      const deltas = collector.calculateTokenDeltas(snapshot.agents);
      expect(Array.isArray(deltas)).toBe(true);
    });
  });
});
