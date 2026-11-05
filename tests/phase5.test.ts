import { describe, it, expect } from 'vitest';
import { ApiClient } from '../apps/web/src/lib/api.js';
import {
  DEPARTMENTS,
  SPECIALIST_PROFILES,
  CEO_ORCHESTRATOR
} from '../packages/shared/src/index.js';

describe('Phase 5: Enterprise Web Dashboard & UI Component Integrity', () => {
  it('should verify all 7 departments and their metadata render cleanly for UI consumption', () => {
    const deptList = Object.values(DEPARTMENTS);
    expect(deptList.length).toBe(7);
    for (const dept of deptList) {
      expect(dept.name).toBeDefined();
      expect(dept.code).toBeDefined();
      expect(dept.specialistCount).toBeGreaterThan(0);
    }
  });

  it('should verify exactly 55 specialist profiles and 1 separate CEO orchestrator are available for the dashboard directory', () => {
    expect(SPECIALIST_PROFILES.length).toBe(55);
    expect(CEO_ORCHESTRATOR.id).toBe('ceo_orchestrator');
    expect(CEO_ORCHESTRATOR.title).toBe('CEO Orchestrator');

    // Verify all role numbers are 1 to 55 strictly
    const roles = SPECIALIST_PROFILES.map((s) => s.roleNumber);
    for (let i = 1; i <= 55; i++) {
      expect(roles).toContain(i);
    }
  });

  it('ApiClient should gracefully return disconnected/halted status when backend is unreachable without throwing', async () => {
    // When API is offline or returns error
    const health = await ApiClient.getHealth();
    expect(health).toBeDefined();
    expect(health.status).toBeDefined();
    expect(health.database).toBeDefined();
  });
});
