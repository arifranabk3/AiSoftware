export interface KillSwitchState {
  isHalted: boolean;
  haltedAt?: string;
  haltedBy?: string;
  reason?: string;
}

export class EmergencyKillSwitch {
  private static instance: EmergencyKillSwitch;
  private state: KillSwitchState = { isHalted: false };

  private constructor() {}

  public static getInstance(): EmergencyKillSwitch {
    if (!EmergencyKillSwitch.instance) {
      EmergencyKillSwitch.instance = new EmergencyKillSwitch();
    }
    return EmergencyKillSwitch.instance;
  }

  public getState(): Readonly<KillSwitchState> {
    return { ...this.state };
  }

  public activate(haltedBy: string, reason: string): KillSwitchState {
    this.state = {
      isHalted: true,
      haltedAt: new Date().toISOString(),
      haltedBy,
      reason
    };
    return this.getState();
  }

  public deactivate(): KillSwitchState {
    this.state = {
      isHalted: false
    };
    return this.getState();
  }

  public assertOperational(): void {
    if (this.state.isHalted) {
      throw new Error(
        `EMERGENCY HALT ACTIVE: System operations are frozen by ${this.state.haltedBy ?? 'Owner'} (Reason: ${this.state.reason ?? 'Safety halt'}).`
      );
    }
  }
}

export const killSwitch = EmergencyKillSwitch.getInstance();
