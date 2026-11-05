import { describe, it, expect, beforeEach } from 'vitest';
import {
  ceoOrchestrator,
  CEOState,
  biEngine,
  promptRegistry,
  dispatcherRegistry,
  costInterceptor,
  ProviderType,
  MockAIProvider,
  GeminiFreeProvider,
  GroqFreeProvider,
  OllamaLocalProvider
} from '../packages/ai-engine/src/index.js';
import { DepartmentId } from '../packages/shared/src/departments.js';
import { distributedKillSwitch } from '../packages/security/src/kill-switch.js';

describe('Phase 4: CEO Orchestrator, Department Dispatchers & AI Reasoning Engine', () => {
  beforeEach(async () => {
    await distributedKillSwitch.deactivate('Owner');
  });

  describe('1. CEO State Machine & Autonomous Execution Loop', () => {
    it('should autonomously plan, decompose, dispatch, and complete a valid zero-cost objective', async () => {
      const result = await ceoOrchestrator.executeObjective({
        id: 'obj_market_launch_01',
        title: 'Launch B2B Outreach Campaign',
        description: 'Scrape publicly available directories and draft tailored proposals',
        targetDepartment: DepartmentId.BUSINESS_DEV,
        preferredSpecialistId: 'spec_discovery_hunter',
        parameters: { niche: 'B2B Software Development' },
        requiresOwnerApproval: false
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.assignedSpecialistId).toBe('spec_discovery_hunter');
      expect(result.result).toBeDefined();
      expect(result.biReport?.zeroCostFeasible).toBe(true);

      const history = ceoOrchestrator.getHistory();
      expect(history.map((h) => h.toState)).toContain(CEOState.OBJECTIVE_RECEIVED);
      expect(history.map((h) => h.toState)).toContain(CEOState.ANALYZING);
      expect(history.map((h) => h.toState)).toContain(CEOState.PLANNING);
      expect(history.map((h) => h.toState)).toContain(CEOState.TASK_DECOMPOSITION);
      expect(history.map((h) => h.toState)).toContain(CEOState.DEPARTMENT_ASSIGNMENT);
      expect(history.map((h) => h.toState)).toContain(CEOState.SPECIALIST_ASSIGNMENT);
      expect(history.map((h) => h.toState)).toContain(CEOState.EXECUTION);
      expect(history.map((h) => h.toState)).toContain(CEOState.RESULT_EVALUATION);
      expect(history.map((h) => h.toState)).toContain(CEOState.COMPLETED);
    });

    it('should halt and transition to EMERGENCY_HALTED if kill-switch is active', async () => {
      await distributedKillSwitch.activate('Owner', 'Emergency anomaly halt');

      const result = await ceoOrchestrator.executeObjective({
        id: 'obj_halt_test',
        title: 'Halt Verification Task',
        description: 'Should not execute',
        targetDepartment: DepartmentId.OPERATIONS,
        parameters: {}
      });

      expect(result.status).toBe('EMERGENCY_HALTED');
      expect(ceoOrchestrator.getState()).toBe(CEOState.EMERGENCY_HALTED);

      await distributedKillSwitch.deactivate('Owner');
    });

    it('should transition to OWNER_APPROVAL_REQUIRED for sensitive or financial actions', async () => {
      const result = await ceoOrchestrator.executeObjective({
        id: 'obj_approval_test',
        title: 'Submit Binding Application',
        description: 'Requires owner review before submitting',
        targetDepartment: DepartmentId.BUSINESS_DEV,
        preferredSpecialistId: 'spec_application_submitter', // Has approvalRequired: true
        parameters: {},
        requiresOwnerApproval: true
      });

      expect(result.status).toBe('AWAITING_OWNER_APPROVAL');
      expect(ceoOrchestrator.getState()).toBe(CEOState.OWNER_APPROVAL_REQUIRED);
    });
  });

  describe('2. Business Intelligence Engine Feasibility', () => {
    it('should reject opportunities relying on external paid APIs with zero feasibility', () => {
      const report = biEngine.evaluateOpportunity({
        title: 'Paid OpenAI Scraper Bot',
        niche: 'B2B',
        monetizationModel: 'SAAS',
        targetAudience: 'Startups',
        hasFreeTooling: false,
        requiredExternalPaidApis: true // VIOLATION
      });

      expect(report.zeroCostFeasible).toBe(false);
      expect(report.recommendation).toBe('REJECT');
      expect(report.feasibilityScore).toBe(0);
      expect(report.risks.some((r) => r.includes('Non-Negotiable Zero-Cost Policy'))).toBe(true);
    });

    it('should approve valid zero-cost business ventures', () => {
      const report = biEngine.evaluateOpportunity({
        title: 'Direct Client Consulting Outreach',
        niche: 'B2B Technical Architecture',
        monetizationModel: 'SERVICES',
        targetAudience: 'Enterprises',
        hasFreeTooling: true,
        requiredExternalPaidApis: false
      });

      expect(report.zeroCostFeasible).toBe(true);
      expect(report.recommendation).toBe('PROCEED');
      expect(report.feasibilityScore).toBeGreaterThanOrEqual(70);
    });
  });

  describe('3. Department Dispatchers & Specialist Registry', () => {
    it('should verify all 7 department dispatchers and correct queue mappings', () => {
      const depts = Object.values(DepartmentId);
      expect(depts.length).toBe(7);

      for (const dept of depts) {
        const dispatcher = dispatcherRegistry.getDispatcher(dept);
        expect(dispatcher.departmentId).toBe(dept);
        expect(dispatcher.targetQueue).toBeDefined();
      }
    });

    it('should have compiled instruction prompts for all 55 specialist profiles', () => {
      expect(promptRegistry.getCount()).toBe(55);
      const hunterPrompt = promptRegistry.getPrompt('spec_discovery_hunter');
      expect(hunterPrompt).toBeDefined();
      expect(hunterPrompt?.profile.roleNumber).toBe(40);
      expect(hunterPrompt?.prohibitedActions.length).toBeGreaterThan(0);
    });
  });

  describe('4. AI Provider Abstraction & Zero-Cost Quota Interceptor', () => {
    it('proves external providers (Gemini, Groq, Ollama) remain DISABLED by default', async () => {
      const gemini = new GeminiFreeProvider();
      expect(gemini.isEnabled).toBe(false);
      await expect(gemini.generateText({ userPrompt: 'test' })).rejects.toThrow(
        'PROVIDER_DISABLED'
      );

      const groq = new GroqFreeProvider();
      expect(groq.isEnabled).toBe(false);
      await expect(groq.generateText({ userPrompt: 'test' })).rejects.toThrow('PROVIDER_DISABLED');

      const ollama = new OllamaLocalProvider();
      expect(ollama.isEnabled).toBe(false);
      await expect(ollama.generateText({ userPrompt: 'test' })).rejects.toThrow(
        'PROVIDER_DISABLED'
      );

      const mock = new MockAIProvider();
      expect(mock.isEnabled).toBe(true);
      const res = await mock.generateText({ userPrompt: 'test', responseFormat: 'json' });
      expect(res.tokensUsed).toBeDefined();
    });

    it('cost interceptor must block requests when quota is exhausted', () => {
      costInterceptor.assertCanExecute(ProviderType.MOCK);

      // Artificially exhaust quota
      const quota = costInterceptor.getQuota(ProviderType.MOCK);
      if (quota) quota.requestsUsedToday = quota.dailyRequests;

      expect(() => costInterceptor.assertCanExecute(ProviderType.MOCK)).toThrow('QUOTA_EXHAUSTED');

      // Reset
      if (quota) quota.requestsUsedToday = 0;
      expect(() => costInterceptor.assertCanExecute(ProviderType.MOCK)).not.toThrow();
    });
  });
});
