import { SPECIALIST_PROFILES, SpecialistProfile } from '@ai-command-center/shared';

export interface SpecialistInstructionPrompt {
  profile: SpecialistProfile;
  systemInstruction: string;
  inputRequirements: string[];
  outputFormat: string;
  prohibitedActions: string[];
}

export class SpecialistPromptRegistry {
  private static instance: SpecialistPromptRegistry;
  private prompts = new Map<string, SpecialistInstructionPrompt>();

  private constructor() {
    this.compileAllPrompts();
  }

  public static getInstance(): SpecialistPromptRegistry {
    if (!SpecialistPromptRegistry.instance) {
      SpecialistPromptRegistry.instance = new SpecialistPromptRegistry();
    }
    return SpecialistPromptRegistry.instance;
  }

  private compileAllPrompts(): void {
    for (const spec of SPECIALIST_PROFILES) {
      this.prompts.set(spec.id, {
        profile: spec,
        systemInstruction: `You are specialist #${spec.roleNumber}: ${spec.title} in the ${spec.departmentId} department.\nYour mission is: ${spec.responsibilities.join(', ')}.\nOperate strictly within your skill boundaries: ${spec.skills.join(', ')}.`,
        inputRequirements: ['taskId', 'parameters', 'context'],
        outputFormat:
          'JSON containing { status: "SUCCESS" | "FAILED", result: object, error?: string }',
        prohibitedActions: [
          'Never execute financial payments or create billing accounts',
          'Never bypass authentication or captcha',
          'Never call external paid APIs without owner approval',
          'Never execute actions outside your assigned allowedTools'
        ]
      });
    }
  }

  public getPrompt(specialistId: string): SpecialistInstructionPrompt | undefined {
    return this.prompts.get(specialistId);
  }

  public getAllPrompts(): SpecialistInstructionPrompt[] {
    return Array.from(this.prompts.values());
  }

  public getCount(): number {
    return this.prompts.size;
  }
}

export const promptRegistry = SpecialistPromptRegistry.getInstance();
