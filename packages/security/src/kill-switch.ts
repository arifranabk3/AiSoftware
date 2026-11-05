export interface KillSwitchState {
  isHalted: boolean;
  haltedAt?: string;
  haltedBy?: string;
  reason?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __AI_COMMAND_CENTER_KILL_SWITCH__: KillSwitchState | undefined;
}

export class EmergencyKillSwitch {
  private static instance: EmergencyKillSwitch;

  private constructor() {
    if (!globalThis.__AI_COMMAND_CENTER_KILL_SWITCH__) {
      globalThis.__AI_COMMAND_CENTER_KILL_SWITCH__ = { isHalted: false };
    }
  }

  public static getInstance(): EmergencyKillSwitch {
    if (!EmergencyKillSwitch.instance) {
      EmergencyKillSwitch.instance = new EmergencyKillSwitch();
    }
    return EmergencyKillSwitch.instance;
  }

  public getState(): Readonly<KillSwitchState> {
    return { ...(globalThis.__AI_COMMAND_CENTER_KILL_SWITCH__ || { isHalted: false }) };
  }

  public activate(haltedBy: string, reason: string): KillSwitchState {
    globalThis.__AI_COMMAND_CENTER_KILL_SWITCH__ = {
      isHalted: true,
      haltedAt: new Date().toISOString(),
      haltedBy,
      reason
    };
    return this.getState();
  }

  public deactivate(): KillSwitchState {
    globalThis.__AI_COMMAND_CENTER_KILL_SWITCH__ = {
      isHalted: false
    };
    return this.getState();
  }

  public assertOperational(): void {
    const current = globalThis.__AI_COMMAND_CENTER_KILL_SWITCH__;
    if (current?.isHalted) {
      throw new Error(
        `EMERGENCY HALT ACTIVE: System operations are frozen by ${current.haltedBy ?? 'Owner'} (Reason: ${current.reason ?? 'Safety halt'}).`
      );
    }
  }
}

export const killSwitch = EmergencyKillSwitch.getInstance();
