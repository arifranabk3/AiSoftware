import { describe, it, expect } from 'vitest';
import { DEPARTMENTS, DepartmentId } from '../packages/shared/src/departments.js';
import { SPECIALIST_PROFILES } from '../packages/shared/src/specialists.js';
import { validateEnvironment } from '../packages/config/src/index.js';

describe('Organizational Structure & Role Reconciliation', () => {
  it('should have exactly 7 departments defined', () => {
    const deptKeys = Object.keys(DEPARTMENTS);
    expect(deptKeys.length).toBe(7);
  });

  it('should have exactly 55 specialist roles defined', () => {
    expect(SPECIALIST_PROFILES.length).toBe(55);
  });

  it('each department should match its configured specialist count', () => {
    for (const deptId of Object.values(DepartmentId)) {
      const dept = DEPARTMENTS[deptId];
      const matchingSpecialists = SPECIALIST_PROFILES.filter((s) => s.departmentId === deptId);
      expect(matchingSpecialists.length).toBe(dept.specialistCount);
    }
  });

  it('each specialist should have unique role numbers from 1 to 55', () => {
    const roleNumbers = SPECIALIST_PROFILES.map((s) => s.roleNumber);
    const uniqueRoleNumbers = new Set(roleNumbers);
    expect(uniqueRoleNumbers.size).toBe(55);
    for (let i = 1; i <= 55; i++) {
      expect(roleNumbers).toContain(i);
    }
  });
});

describe('Configuration Engine & Zero-Cost Validation', () => {
  it('should fail when required security variables are missing', () => {
    expect(() => {
      validateEnvironment({
        DATABASE_URL: 'postgresql://localhost:5432/db'
      });
    }).toThrow('CRITICAL CONFIGURATION ERROR');
  });

  it('should pass with valid environment variables', () => {
    const validConfig = validateEnvironment({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
      JWT_SECRET: 'super_secret_jwt_key_at_least_32_characters_long',
      REFRESH_TOKEN_SECRET: 'super_secret_refresh_key_at_least_32_characters',
      MASTER_ENCRYPTION_KEY: 'master_encryption_key_32_chars_12',
      OWNER_PHONE_NUMBER: '+1234567890'
    });

    expect(validConfig.NODE_ENV).toBe('test');
    expect(validConfig.ZERO_COST_STRICT_MODE).toBe(true);
    expect(validConfig.SYSTEM_EMERGENCY_HALT).toBe(false);
  });
});
