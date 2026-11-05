export interface BusinessOpportunityInput {
  title: string;
  niche: string;
  monetizationModel: 'AFFILIATE' | 'SAAS' | 'SERVICES' | 'DIGITAL_PRODUCTS' | 'CONTENT';
  targetAudience: string;
  hasFreeTooling: boolean;
  requiredExternalPaidApis: boolean;
}

export interface BusinessIntelligenceReport {
  title: string;
  feasibilityScore: number; // 0 to 100
  zeroCostFeasible: boolean;
  estimatedTimeToFirstRevenueDays: number;
  risks: string[];
  recommendation: 'PROCEED' | 'HOLD_FOR_APPROVAL' | 'REJECT';
  breakdown: {
    marketDemandScore: number;
    competitionResistance: number;
    toolingScore: number;
    executionDifficulty: number;
  };
}

export class BusinessIntelligenceEngine {
  public evaluateOpportunity(input: BusinessOpportunityInput): BusinessIntelligenceReport {
    const risks: string[] = [];

    // Zero-Cost Policy Enforcement:
    if (input.requiredExternalPaidApis) {
      risks.push(
        'CRITICAL: Opportunity relies on paid external APIs, violating Non-Negotiable Zero-Cost Policy.'
      );
      return {
        title: input.title,
        feasibilityScore: 0,
        zeroCostFeasible: false,
        estimatedTimeToFirstRevenueDays: 999,
        risks,
        recommendation: 'REJECT',
        breakdown: {
          marketDemandScore: 0,
          competitionResistance: 0,
          toolingScore: 0,
          executionDifficulty: 100
        }
      };
    }

    let toolingScore = input.hasFreeTooling ? 90 : 40;
    if (!input.hasFreeTooling) {
      risks.push('Free tooling not readily identified; internal custom build required.');
    }

    const demandScore = input.niche.toLowerCase().includes('b2b') ? 85 : 70;
    const competitionResistance = 65;
    const executionDifficulty = input.monetizationModel === 'SERVICES' ? 30 : 60;

    const feasibilityScore = Math.round(
      (toolingScore + demandScore + competitionResistance + (100 - executionDifficulty)) / 4
    );

    let timeToRevenue = 30;
    if (input.monetizationModel === 'SERVICES') timeToRevenue = 7;
    if (input.monetizationModel === 'AFFILIATE') timeToRevenue = 45;

    const recommendation = feasibilityScore >= 70 ? 'PROCEED' : 'HOLD_FOR_APPROVAL';

    return {
      title: input.title,
      feasibilityScore,
      zeroCostFeasible: true,
      estimatedTimeToFirstRevenueDays: timeToRevenue,
      risks,
      recommendation,
      breakdown: {
        marketDemandScore: demandScore,
        competitionResistance,
        toolingScore,
        executionDifficulty
      }
    };
  }
}

export const biEngine = new BusinessIntelligenceEngine();
