/**
 * Core Organizational Structure & Departments
 */
export enum DepartmentId {
  EXECUTIVE = 'EXECUTIVE',
  ENGINEERING = 'ENGINEERING',
  OPERATIONS = 'OPERATIONS',
  PRODUCT_MARKETING = 'PRODUCT_MARKETING',
  FINANCE = 'FINANCE',
  BUSINESS_DEV = 'BUSINESS_DEV',
  SECURITY = 'SECURITY'
}

export interface DepartmentInfo {
  id: DepartmentId;
  name: string;
  code: string;
  description: string;
  specialistCount: number;
}

export const DEPARTMENTS: Record<DepartmentId, DepartmentInfo> = {
  [DepartmentId.EXECUTIVE]: {
    id: DepartmentId.EXECUTIVE,
    name: 'Executive & Strategic Management',
    code: 'EXEC',
    description:
      'High-level steering, strategic direction, prioritization, and human-in-the-loop escalations.',
    specialistCount: 5
  },
  [DepartmentId.ENGINEERING]: {
    id: DepartmentId.ENGINEERING,
    name: 'Engineering, Architecture & DevOps',
    code: 'ENG',
    description:
      'Software development, system architecture, database administration, testing, and deployment.',
    specialistCount: 10
  },
  [DepartmentId.OPERATIONS]: {
    id: DepartmentId.OPERATIONS,
    name: 'Operations & Process Automation',
    code: 'OPS',
    description: 'Queue execution, web scraping, data pipelines, and scheduled system maintenance.',
    specialistCount: 8
  },
  [DepartmentId.PRODUCT_MARKETING]: {
    id: DepartmentId.PRODUCT_MARKETING,
    name: 'Product, Marketing & Growth',
    code: 'MKTG',
    description:
      'Product lifecycle, organic growth, copywriting, social media distribution, and market intelligence.',
    specialistCount: 8
  },
  [DepartmentId.FINANCE]: {
    id: DepartmentId.FINANCE,
    name: 'Finance, Monetization & Cost Control',
    code: 'FIN',
    description:
      'Zero-cost enforcement, revenue tracking, invoice reconciliation, and monetization setups.',
    specialistCount: 8
  },
  [DepartmentId.BUSINESS_DEV]: {
    id: DepartmentId.BUSINESS_DEV,
    name: 'Business Development & Application Discovery',
    code: 'BIZDEV',
    description:
      'Discovering clients, grants, platforms, drafting tailored proposals, and application submissions.',
    specialistCount: 8
  },
  [DepartmentId.SECURITY]: {
    id: DepartmentId.SECURITY,
    name: 'Security, Compliance & Audit',
    code: 'SEC',
    description:
      'Access control, audit immutability, vulnerability scanning, and emergency kill-switch controls.',
    specialistCount: 8
  }
};
