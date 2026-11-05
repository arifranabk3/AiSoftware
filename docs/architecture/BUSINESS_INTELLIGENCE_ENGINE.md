# BUSINESS INTELLIGENCE (BI) ENGINE

## 1. Purpose

The Business Intelligence Engine (`packages/ai-engine/src/bi-engine.ts`) screens every proposed business venture or company application before execution.

---

## 2. Evaluation Criteria

- **Market Demand Score:** B2B opportunities receive higher baseline scores due to clear budget availability.
- **Competition Resistance:** Assesses niche saturation and barrier to entry.
- **Tooling Score:** Checks whether free, open-source, or self-hosted tooling exists.
- **Execution Difficulty:** Estimates implementation complexity.
- **Zero-Cost Hard Filter:** Any opportunity requiring external paid APIs is rejected outright (`feasibilityScore: 0`, `recommendation: 'REJECT'`).
