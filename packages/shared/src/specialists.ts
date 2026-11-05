import { DepartmentId } from './departments.js';

export enum PermissionLevel {
  READ_ONLY = 'READ_ONLY',
  STANDARD_EXECUTE = 'STANDARD_EXECUTE',
  ELEVATED_EXECUTE = 'ELEVATED_EXECUTE',
  CRITICAL_EXECUTE = 'CRITICAL_EXECUTE',
  ADMIN = 'ADMIN'
}

export interface ExecutionLimits {
  maxExecutionTimeMs: number;
  maxTokensPerTask: number;
  maxRetries: number;
  concurrencyLimit: number;
}

export interface SpecialistProfile {
  id: string;
  roleNumber: number;
  title: string;
  departmentId: DepartmentId;
  responsibilities: string[];
  skills: string[];
  allowedTools: string[];
  permissionLevel: PermissionLevel;
  executionLimits: ExecutionLimits;
  approvalRequired: boolean;
  isActive: boolean;
}

export const SPECIALIST_PROFILES: SpecialistProfile[] = [
  // --- EXECUTIVE (5 roles) ---
  {
    id: 'spec_ceo_orchestrator',
    roleNumber: 1,
    title: 'CEO Orchestrator',
    departmentId: DepartmentId.EXECUTIVE,
    responsibilities: [
      'Autonomous coordination',
      'High-level decision making',
      'Task delegation across departments'
    ],
    skills: ['Strategic Planning', 'Orchestration', 'Multi-Agent Routing'],
    allowedTools: ['task_dispatch', 'agent_query', 'system_status', 'escalate_owner'],
    permissionLevel: PermissionLevel.ADMIN,
    executionLimits: {
      maxExecutionTimeMs: 60000,
      maxTokensPerTask: 8192,
      maxRetries: 3,
      concurrencyLimit: 5
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_chief_of_staff',
    roleNumber: 2,
    title: 'Chief of Staff',
    departmentId: DepartmentId.EXECUTIVE,
    responsibilities: [
      'Task priority scheduling',
      'Cross-department mediation',
      'Daily agenda synthesis'
    ],
    skills: ['Priority Queueing', 'Resource Allocation', 'Agenda Synthesis'],
    allowedTools: ['queue_reorder', 'task_inspect'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 3
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_enterprise_strategist',
    roleNumber: 3,
    title: 'Enterprise Strategist',
    departmentId: DepartmentId.EXECUTIVE,
    responsibilities: [
      'Long-term portfolio alignment',
      'Strategic trend evaluation',
      'Business model planning'
    ],
    skills: ['Market Forecasting', 'Strategic Roadmapping'],
    allowedTools: ['read_portfolio', 'generate_brief'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 6000,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_operations_supervisor',
    roleNumber: 4,
    title: 'Operations Supervisor',
    departmentId: DepartmentId.EXECUTIVE,
    responsibilities: ['Automated quality assurance of decisions', 'SLA monitoring'],
    skills: ['Output Quality Review', 'Metric Analysis'],
    allowedTools: ['task_audit', 'flag_anomaly'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 4
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_hitl_gateway_manager',
    roleNumber: 5,
    title: 'Human-in-the-Loop Gateway Manager',
    departmentId: DepartmentId.EXECUTIVE,
    responsibilities: [
      'Owner approval dispatching',
      'Escalation routing',
      'Owner decision recording'
    ],
    skills: ['Notification Formatting', 'Approval Lifecycle'],
    allowedTools: ['dispatch_approval_request', 'await_owner_response', 'record_decision'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 120000,
      maxTokensPerTask: 2048,
      maxRetries: 5,
      concurrencyLimit: 10
    },
    approvalRequired: false,
    isActive: true
  },

  // --- ENGINEERING, ARCHITECTURE & DEVOPS (10 roles) ---
  {
    id: 'spec_principal_architect',
    roleNumber: 6,
    title: 'Principal Software Architect',
    departmentId: DepartmentId.ENGINEERING,
    responsibilities: ['System design', 'Schema governance', 'API contract validation'],
    skills: ['Distributed Systems', 'TypeScript Architecture', 'Schema Design'],
    allowedTools: ['read_code', 'validate_contracts', 'propose_schema'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 60000,
      maxTokensPerTask: 8192,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_lead_fullstack',
    roleNumber: 7,
    title: 'Lead Full-Stack Engineer',
    departmentId: DepartmentId.ENGINEERING,
    responsibilities: ['Fullstack implementation coordination', 'Code structure review'],
    skills: ['Next.js', 'Node.js', 'TypeScript', 'Prisma'],
    allowedTools: ['read_code', 'write_code', 'run_tests'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 60000,
      maxTokensPerTask: 8192,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_frontend_specialist',
    roleNumber: 8,
    title: 'Frontend Specialist',
    departmentId: DepartmentId.ENGINEERING,
    responsibilities: ['Tailwind styling', 'Component building', 'UI responsiveness'],
    skills: ['Tailwind CSS', 'React', 'Component Design', 'A11y'],
    allowedTools: ['read_code', 'write_code'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 6000,
      maxRetries: 2,
      concurrencyLimit: 3
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_backend_specialist',
    roleNumber: 9,
    title: 'Backend Specialist',
    departmentId: DepartmentId.ENGINEERING,
    responsibilities: ['REST API endpoints', 'Service logic', 'Middleware'],
    skills: ['Express/Fastify', 'Node.js', 'REST API Design'],
    allowedTools: ['read_code', 'write_code', 'test_endpoints'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 6000,
      maxRetries: 2,
      concurrencyLimit: 3
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_devops_engineer',
    roleNumber: 10,
    title: 'DevOps & Cloud Engineer',
    departmentId: DepartmentId.ENGINEERING,
    responsibilities: ['CI/CD workflows', 'Build automation', 'Deployment verification'],
    skills: ['GitHub Actions', 'Docker', 'Vercel CLI', 'Bash/PowerShell'],
    allowedTools: ['inspect_ci', 'validate_build', 'check_deploy_status'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 60000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: true,
    isActive: true
  },
  {
    id: 'spec_sre_engineer',
    roleNumber: 11,
    title: 'Site Reliability Engineer (SRE)',
    departmentId: DepartmentId.ENGINEERING,
    responsibilities: ['Uptime monitoring', 'Healthchecks', 'Circuit breakers'],
    skills: ['Health Metrics', 'Failover Logic', 'Logging'],
    allowedTools: ['ping_services', 'inspect_metrics', 'trigger_restarts'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 4096,
      maxRetries: 3,
      concurrencyLimit: 5
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_database_admin',
    roleNumber: 12,
    title: 'Database Administrator',
    departmentId: DepartmentId.ENGINEERING,
    responsibilities: ['Prisma migrations', 'Index optimization', 'Integrity checks'],
    skills: ['PostgreSQL', 'Prisma Schema', 'Query Optimization'],
    allowedTools: ['validate_schema', 'generate_migrations', 'inspect_indexes'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 60000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 1
    },
    approvalRequired: true,
    isActive: true
  },
  {
    id: 'spec_automation_engineer',
    roleNumber: 13,
    title: 'Automation Engineer',
    departmentId: DepartmentId.ENGINEERING,
    responsibilities: ['Playwright headless scripts', 'Resilient selectors', 'Session handling'],
    skills: ['Playwright', 'Puppeteer', 'DOM Parsing', 'Headless Automation'],
    allowedTools: ['run_browser_script', 'capture_page_state', 'inspect_dom'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 90000,
      maxTokensPerTask: 6000,
      maxRetries: 3,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_qa_engineer',
    roleNumber: 14,
    title: 'QA & Test Engineer',
    departmentId: DepartmentId.ENGINEERING,
    responsibilities: ['Unit testing', 'Regression testing', 'Test suite assertions'],
    skills: ['Vitest', 'Jest', 'Integration Testing', 'Assertions'],
    allowedTools: ['run_tests', 'read_test_reports', 'generate_test_cases'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 60000,
      maxTokensPerTask: 6000,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_release_engineer',
    roleNumber: 15,
    title: 'Release Engineer',
    departmentId: DepartmentId.ENGINEERING,
    responsibilities: ['Changelog compilation', 'Semantic versioning', 'Release tagging'],
    skills: ['SemVer', 'Git Tagging', 'Release Governance'],
    allowedTools: ['inspect_git_log', 'prepare_release_notes'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 1
    },
    approvalRequired: true,
    isActive: true
  },

  // --- OPERATIONS & PROCESS AUTOMATION (8 roles) ---
  {
    id: 'spec_workflow_automation_lead',
    roleNumber: 16,
    title: 'Workflow Automation Lead',
    departmentId: DepartmentId.OPERATIONS,
    responsibilities: [
      'BullMQ queue architecture',
      'Job flow composition',
      'Topology optimization'
    ],
    skills: ['BullMQ', 'Redis Streams', 'Queue Design'],
    allowedTools: ['inspect_queues', 'configure_job_topology'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 3
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_data_pipeline_engineer',
    roleNumber: 17,
    title: 'Data Pipeline Engineer',
    departmentId: DepartmentId.OPERATIONS,
    responsibilities: ['ETL pipelines', 'Data normalisation', 'Schema mapping'],
    skills: ['Data Wrangling', 'Batch Processing', 'JSON Transformation'],
    allowedTools: ['transform_payload', 'validate_data_schema'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 60000,
      maxTokensPerTask: 6000,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_scraping_discovery',
    roleNumber: 18,
    title: 'Scraping & Discovery Specialist',
    departmentId: DepartmentId.OPERATIONS,
    responsibilities: [
      'Web data harvesting',
      'Polite rate-limiting',
      'Parsing unstructured content'
    ],
    skills: ['Cheerio', 'Playwright Scraping', 'HTML Sanitization'],
    allowedTools: ['fetch_html', 'parse_markup', 'extract_structured_fields'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 60000,
      maxTokensPerTask: 4096,
      maxRetries: 3,
      concurrencyLimit: 3
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_content_publishing_bot',
    roleNumber: 19,
    title: 'Content Publishing Bot',
    departmentId: DepartmentId.OPERATIONS,
    responsibilities: ['Programmatic multi-channel distribution', 'Post scheduling'],
    skills: ['Publishing Workflows', 'Webhook Dispatch'],
    allowedTools: ['schedule_post', 'dispatch_publish_payload'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 2048,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: true,
    isActive: true
  },
  {
    id: 'spec_job_queue_monitor',
    roleNumber: 20,
    title: 'Job Queue Monitor',
    departmentId: DepartmentId.OPERATIONS,
    responsibilities: [
      'Dead-letter queue handling',
      'Stalled job recovery',
      'Worker throughput monitoring'
    ],
    skills: ['Queue Auditing', 'Error Categorization'],
    allowedTools: ['inspect_dlq', 'retry_job', 'purge_failed'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 2048,
      maxRetries: 2,
      concurrencyLimit: 5
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_api_integration_handler',
    roleNumber: 21,
    title: 'API Integration Handler',
    departmentId: DepartmentId.OPERATIONS,
    responsibilities: [
      'External webhook reception',
      'Signature verification',
      'Payload dispatching'
    ],
    skills: ['Webhook Processing', 'HMAC Verification', 'Payload Routing'],
    allowedTools: ['verify_webhook', 'route_event'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 15000,
      maxTokensPerTask: 2048,
      maxRetries: 2,
      concurrencyLimit: 10
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_doc_media_processor',
    roleNumber: 22,
    title: 'Document & Media Processor',
    departmentId: DepartmentId.OPERATIONS,
    responsibilities: ['PDF parsing', 'Markdown generation', 'Metadata extraction'],
    skills: ['PDF Extract', 'Text Normalisation', 'Asset Organization'],
    allowedTools: ['read_document', 'extract_text', 'format_markdown'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 6000,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_system_cleanup_worker',
    roleNumber: 23,
    title: 'System Cleanup Worker',
    departmentId: DepartmentId.OPERATIONS,
    responsibilities: ['Expired token pruning', 'Temporary file deletion', 'Old log archival'],
    skills: ['Storage Hygiene', 'Database Garbage Collection'],
    allowedTools: ['prune_temp_files', 'archive_audit_logs'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 2048,
      maxRetries: 2,
      concurrencyLimit: 1
    },
    approvalRequired: false,
    isActive: true
  },

  // --- PRODUCT, MARKETING & GROWTH (8 roles) ---
  {
    id: 'spec_product_manager',
    roleNumber: 24,
    title: 'Product Manager',
    departmentId: DepartmentId.PRODUCT_MARKETING,
    responsibilities: [
      'Feature requirements drafting',
      'User journey mapping',
      'Milestone planning'
    ],
    skills: ['Product Roadmapping', 'Specification Writing'],
    allowedTools: ['read_portfolio', 'draft_specification'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 6000,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_growth_hacker',
    roleNumber: 25,
    title: 'Growth Hacker',
    departmentId: DepartmentId.PRODUCT_MARKETING,
    responsibilities: [
      'Funnel optimization',
      'Viral distribution loops',
      'A/B hypothesis formulation'
    ],
    skills: ['Growth Experiments', 'Conversion Rate Optimization'],
    allowedTools: ['analyze_funnels', 'suggest_experiments'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_seo_specialist',
    roleNumber: 26,
    title: 'SEO Specialist',
    departmentId: DepartmentId.PRODUCT_MARKETING,
    responsibilities: ['Organic keyword research', 'Meta-tag generation', 'Sitemap optimization'],
    skills: ['Semantic SEO', 'Search Intent Analysis', 'Structured Data'],
    allowedTools: ['inspect_metadata', 'generate_schema_markup', 'keyword_density_check'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 3
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_copywriter_content',
    roleNumber: 27,
    title: 'Copywriter & Content Generator',
    departmentId: DepartmentId.PRODUCT_MARKETING,
    responsibilities: ['Persuasive copy drafting', 'Landing page copy', 'Email draft generation'],
    skills: ['Direct Response Copywriting', 'Brand Voice Adaptation'],
    allowedTools: ['draft_copy', 'review_copy_tone'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 6000,
      maxRetries: 2,
      concurrencyLimit: 3
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_social_media_strategist',
    roleNumber: 28,
    title: 'Social Media Strategist',
    departmentId: DepartmentId.PRODUCT_MARKETING,
    responsibilities: ['Social post scheduling', 'Trend alignment', 'Engagement prompt drafting'],
    skills: ['Content Calendars', 'Platform-Specific Formatting'],
    allowedTools: ['draft_social_post', 'prepare_content_calendar'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 3
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_email_marketing',
    roleNumber: 29,
    title: 'Email Marketing Specialist',
    departmentId: DepartmentId.PRODUCT_MARKETING,
    responsibilities: ['Drip campaign logic', 'Subject line variants', 'Deliverability formatting'],
    skills: ['Email Funnels', 'Subject Line Optimization', 'Spam Score Checking'],
    allowedTools: ['draft_email_campaign', 'inspect_spam_triggers'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 3
    },
    approvalRequired: true,
    isActive: true
  },
  {
    id: 'spec_brand_creative_director',
    roleNumber: 30,
    title: 'Brand & Creative Director',
    departmentId: DepartmentId.PRODUCT_MARKETING,
    responsibilities: ['Visual style consistency', 'Color palette enforcement', 'Design tokens'],
    skills: ['Design Tokens', 'Brand Consistency', 'UI Aesthetics'],
    allowedTools: ['inspect_theme_tokens', 'validate_brand_assets'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 2048,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_competitive_intelligence',
    roleNumber: 31,
    title: 'Competitive Intelligence Analyst',
    departmentId: DepartmentId.PRODUCT_MARKETING,
    responsibilities: ['Competitor feature matrices', 'Pricing teardowns', 'Positioning insights'],
    skills: ['Competitive Analysis', 'Feature Comparison', 'SWOT Mapping'],
    allowedTools: ['compare_offerings', 'summarize_market_landscape'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 6000,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },

  // --- FINANCE, MONETIZATION & COST CONTROL (8 roles) ---
  {
    id: 'spec_cfo_controller',
    roleNumber: 32,
    title: 'Chief Financial Officer (CFO)',
    departmentId: DepartmentId.FINANCE,
    responsibilities: ['Revenue tracking', 'Financial integrity', 'Budget governance'],
    skills: ['Financial Modeling', 'Monetary Audit', 'P&L Synthesis'],
    allowedTools: ['view_financial_ledgers', 'generate_pnl_report'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_zero_cost_controller',
    roleNumber: 33,
    title: 'Zero-Cost Controller',
    departmentId: DepartmentId.FINANCE,
    responsibilities: [
      'Zero-cost enforcement',
      'Outbound request interception',
      'Quota exhaustion prevention'
    ],
    skills: ['Rate Limit Tracking', 'Free Tier Quota Management', 'Policy Enforcement'],
    allowedTools: ['check_quota_state', 'block_paid_calls', 'enforce_free_tiers'],
    permissionLevel: PermissionLevel.ADMIN,
    executionLimits: {
      maxExecutionTimeMs: 15000,
      maxTokensPerTask: 2048,
      maxRetries: 1,
      concurrencyLimit: 10
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_monetization_strategist',
    roleNumber: 34,
    title: 'Monetization Strategist',
    departmentId: DepartmentId.FINANCE,
    responsibilities: [
      'Pricing tier design',
      'Affiliate monetization models',
      'Fee-free checkout paths'
    ],
    skills: ['Pricing Architecture', 'Affiliate Programs', 'Monetization Logic'],
    allowedTools: ['read_affiliate_catalogs', 'propose_pricing_tiers'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_billing_invoice_auditor',
    roleNumber: 35,
    title: 'Billing & Invoice Auditor',
    departmentId: DepartmentId.FINANCE,
    responsibilities: ['Zero-fee webhook reconciliation', 'Payment receipt verification'],
    skills: ['Invoice Matching', 'Webhook Reconciliation', 'Ledger Balancing'],
    allowedTools: ['verify_receipt_webhook', 'reconcile_transaction'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 2048,
      maxRetries: 2,
      concurrencyLimit: 3
    },
    approvalRequired: true,
    isActive: true
  },
  {
    id: 'spec_unit_economics_analyst',
    roleNumber: 36,
    title: 'Unit Economics Analyst',
    departmentId: DepartmentId.FINANCE,
    responsibilities: ['Net margin per project', 'Serverless execution efficiency analysis'],
    skills: ['Margin Calculation', 'Compute Efficiency Metrics'],
    allowedTools: ['calculate_margins', 'audit_compute_usage'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 2048,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_expense_watchdog',
    roleNumber: 37,
    title: 'Expense Watchdog',
    departmentId: DepartmentId.FINANCE,
    responsibilities: [
      'Real-time spend blocking',
      'Alerting on any unauthorized card charge attempts'
    ],
    skills: ['Credit Card Guarding', 'Spend Alerting'],
    allowedTools: ['intercept_spend_attempts', 'fire_cost_alert'],
    permissionLevel: PermissionLevel.CRITICAL_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 15000,
      maxTokensPerTask: 2048,
      maxRetries: 1,
      concurrencyLimit: 10
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_payment_gateway_integrator',
    roleNumber: 38,
    title: 'Payment Gateway Integrator',
    departmentId: DepartmentId.FINANCE,
    responsibilities: ['Stripe/PayPal zero-fee webhook setup', 'Secure webhook signature checking'],
    skills: ['Webhook Signing', 'Payment API Contracts'],
    allowedTools: ['validate_payment_configs', 'test_webhook_signatures'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: true,
    isActive: true
  },
  {
    id: 'spec_revenue_attribution',
    roleNumber: 39,
    title: 'Revenue Attribution Specialist',
    departmentId: DepartmentId.FINANCE,
    responsibilities: ['Mapping revenue to lead channels', 'Affiliate link click attribution'],
    skills: ['UTM Tracking', 'Click Attribution', 'Conversion Modeling'],
    allowedTools: ['track_conversion_source', 'aggregate_attribution'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 2048,
      maxRetries: 2,
      concurrencyLimit: 3
    },
    approvalRequired: false,
    isActive: true
  },

  // --- BUSINESS DEV & APPLICATION DISCOVERY (8 roles) ---
  {
    id: 'spec_discovery_hunter',
    roleNumber: 40,
    title: 'Discovery Hunter',
    departmentId: DepartmentId.BUSINESS_DEV,
    responsibilities: [
      'Discovering client postings, freelance opportunities, grants, enterprise leads'
    ],
    skills: ['Directory Mining', 'Opportunity Identification', 'Lead Prospecting'],
    allowedTools: ['search_public_listings', 'extract_lead_profiles'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 60000,
      maxTokensPerTask: 4096,
      maxRetries: 3,
      concurrencyLimit: 3
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_opportunity_evaluator',
    roleNumber: 41,
    title: 'Opportunity Evaluator',
    departmentId: DepartmentId.BUSINESS_DEV,
    responsibilities: ['Scoring lead match score, expected payout, feasibility check'],
    skills: ['Opportunity Scoring', 'Feasibility Assessment'],
    allowedTools: ['score_opportunity', 'filter_unqualified_leads'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 3
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_proposal_pitch_drafter',
    roleNumber: 42,
    title: 'Proposal & Pitch Drafter',
    departmentId: DepartmentId.BUSINESS_DEV,
    responsibilities: ['Crafting hyper-personalized business proposals and cover letters'],
    skills: ['Proposal Writing', 'Requirement Matching', 'Persuasion'],
    allowedTools: ['draft_proposal', 'tailor_portfolio_references'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 6000,
      maxRetries: 2,
      concurrencyLimit: 3
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_application_submitter',
    roleNumber: 43,
    title: 'Application Submitter',
    departmentId: DepartmentId.BUSINESS_DEV,
    responsibilities: ['Programmatic submission of approved proposals and job/partner forms'],
    skills: ['Form Automation', 'Submission Verification'],
    allowedTools: ['fill_application_form', 'record_submission_receipt'],
    permissionLevel: PermissionLevel.CRITICAL_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 90000,
      maxTokensPerTask: 4096,
      maxRetries: 1,
      concurrencyLimit: 1
    },
    approvalRequired: true,
    isActive: true
  },
  {
    id: 'spec_crm_manager',
    roleNumber: 44,
    title: 'CRM Manager',
    departmentId: DepartmentId.BUSINESS_DEV,
    responsibilities: ['Lead pipeline management', 'Stage transitions', 'Activity logging'],
    skills: ['Pipeline Governance', 'Contact Lifecycle Management'],
    allowedTools: ['update_lead_stage', 'log_interaction'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 2048,
      maxRetries: 2,
      concurrencyLimit: 5
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_partnership_scout',
    roleNumber: 45,
    title: 'Partnership Scout',
    departmentId: DepartmentId.BUSINESS_DEV,
    responsibilities: ['Identifying complementary B2B partners and high-paying affiliate networks'],
    skills: ['Affiliate Scouting', 'B2B Syndicate Analysis'],
    allowedTools: ['find_partner_programs', 'summarize_partner_terms'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_outreach_dispatcher',
    roleNumber: 46,
    title: 'Outreach Dispatcher',
    departmentId: DepartmentId.BUSINESS_DEV,
    responsibilities: ['Preparing cold email sequences and contact messages for owner review'],
    skills: ['Outreach Sequencing', 'Anti-Spam Formatting'],
    allowedTools: ['queue_outreach_message', 'preview_draft'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: true,
    isActive: true
  },
  {
    id: 'spec_deal_closer_assistant',
    roleNumber: 47,
    title: 'Deal Closer Assistant',
    departmentId: DepartmentId.BUSINESS_DEV,
    responsibilities: [
      'Final checklist verification',
      'Contract clause review',
      'Deliverable scheduling'
    ],
    skills: ['Checklist Auditing', 'Requirement Verification'],
    allowedTools: ['validate_contract_terms', 'schedule_deliverables'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: true,
    isActive: true
  },

  // --- SECURITY, COMPLIANCE & AUDIT (8 roles) ---
  {
    id: 'spec_ciso_architect',
    roleNumber: 48,
    title: 'Chief Information Security Officer (CISO)',
    departmentId: DepartmentId.SECURITY,
    responsibilities: ['Threat modeling', 'Overall security posture', 'Policy sign-off'],
    skills: ['Threat Modeling', 'Zero Trust Architecture', 'Cryptographic Governance'],
    allowedTools: ['audit_system_posture', 'review_security_exceptions'],
    permissionLevel: PermissionLevel.ADMIN,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_access_control_admin',
    roleNumber: 49,
    title: 'Access Control Administrator',
    departmentId: DepartmentId.SECURITY,
    responsibilities: ['RBAC validation', 'JWT signature verification', 'Token revocation'],
    skills: ['RBAC', 'JWT Lifecycle', 'Session Invalidation'],
    allowedTools: ['revoke_session', 'validate_permissions'],
    permissionLevel: PermissionLevel.CRITICAL_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 15000,
      maxTokensPerTask: 2048,
      maxRetries: 2,
      concurrencyLimit: 5
    },
    approvalRequired: true,
    isActive: true
  },
  {
    id: 'spec_secret_key_vault_guard',
    roleNumber: 50,
    title: 'Secret & Key Vault Guard',
    departmentId: DepartmentId.SECURITY,
    responsibilities: [
      'Environment variable masking',
      'Preventing credential leaks in logs/responses'
    ],
    skills: ['Secret Masking', 'Entropy Analysis', 'Credential Scanning'],
    allowedTools: ['mask_sensitive_payloads', 'verify_env_hygiene'],
    permissionLevel: PermissionLevel.ADMIN,
    executionLimits: {
      maxExecutionTimeMs: 15000,
      maxTokensPerTask: 2048,
      maxRetries: 1,
      concurrencyLimit: 10
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_audit_log_verifier',
    roleNumber: 51,
    title: 'Audit Log Verifier',
    departmentId: DepartmentId.SECURITY,
    responsibilities: ['Cryptographic chain integrity of audit logs', 'Tamper evidence detection'],
    skills: ['Immutable Logging', 'Merkle Tree / Hash Chaining', 'Audit Trail Analysis'],
    allowedTools: ['verify_audit_hash_chain', 'detect_log_anomalies'],
    permissionLevel: PermissionLevel.ELEVATED_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 2048,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_vulnerability_scanner',
    roleNumber: 52,
    title: 'Vulnerability Scanner',
    departmentId: DepartmentId.SECURITY,
    responsibilities: ['Automated npm audit inspection', 'Known CVE dependency tracking'],
    skills: ['CVE Analysis', 'Dependency Auditing', 'Software Bill of Materials (SBOM)'],
    allowedTools: ['run_dependency_audit', 'generate_vuln_report'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 45000,
      maxTokensPerTask: 4096,
      maxRetries: 2,
      concurrencyLimit: 2
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_compliance_officer',
    roleNumber: 53,
    title: 'Compliance Officer',
    departmentId: DepartmentId.SECURITY,
    responsibilities: [
      'Data privacy policies',
      'Robots.txt compliance',
      'Terms of Service boundaries'
    ],
    skills: ['Data Ethics', 'Robots.txt Interpretation', 'ToS Adherence'],
    allowedTools: ['check_robots_txt', 'audit_privacy_terms'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 30000,
      maxTokensPerTask: 2048,
      maxRetries: 2,
      concurrencyLimit: 3
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_rate_limit_anti_ban',
    roleNumber: 54,
    title: 'Rate Limiting & Anti-Ban Specialist',
    departmentId: DepartmentId.SECURITY,
    responsibilities: [
      'Traffic shaping',
      'Exponential backoff algorithms',
      'IP cooldown enforcement'
    ],
    skills: ['Adaptive Throttling', 'Exponential Backoff', 'Circuit Breaking'],
    allowedTools: ['calculate_backoff', 'enforce_endpoint_cooldown'],
    permissionLevel: PermissionLevel.STANDARD_EXECUTE,
    executionLimits: {
      maxExecutionTimeMs: 15000,
      maxTokensPerTask: 2048,
      maxRetries: 1,
      concurrencyLimit: 10
    },
    approvalRequired: false,
    isActive: true
  },
  {
    id: 'spec_emergency_killswitch_operator',
    roleNumber: 55,
    title: 'Emergency Kill-Switch Operator',
    departmentId: DepartmentId.SECURITY,
    responsibilities: ['Immediate execution freezing', 'Terminating background workers on anomaly'],
    skills: ['System Halt Logic', 'Process Signals', 'Emergency Orchestration'],
    allowedTools: ['trigger_emergency_halt', 'resume_system', 'inspect_halt_state'],
    permissionLevel: PermissionLevel.ADMIN,
    executionLimits: {
      maxExecutionTimeMs: 10000,
      maxTokensPerTask: 1024,
      maxRetries: 1,
      concurrencyLimit: 1
    },
    approvalRequired: true,
    isActive: true
  }
];
