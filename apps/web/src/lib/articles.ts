export interface Article {
  slug: string;
  title: string;
  description: string;
  publishDate: string;
  author: string;
  authorRole: string;
  readTime: string;
  category: string;
  keywords: string[];
  content: string[];
}

export const ARTICLES: Article[] = [
  {
    slug: 'zero-cost-local-llm-architecture',
    title: 'Zero-Cost Multi-Agent Engineering with Local Quantized LLMs',
    description:
      'A practical architectural guide to running sovereign multi-agent workflows using quantized local models and Ollama without recurring cloud API fees.',
    publishDate: '2026-11-05',
    author: 'AIsoftware Technical Editorial Staff',
    authorRole: 'Systems Architecture',
    readTime: '8 min read',
    category: 'Architecture',
    keywords: [
      'local llm architecture',
      'zero cost ai agents',
      'ollama multi agent',
      'quantized inference',
      'self hosted ai'
    ],
    content: [
      'Cloud-hosted artificial intelligence models offer convenient reasoning capabilities, but they introduce compounding financial friction when deployed inside autonomous loops. A standard multi-agent research or operational pipeline often executes between 10 and 50 sequential reasoning steps per goal, quickly escalating token costs.',
      'By decoupling your application logic from proprietary API gateways and deploying quantized open-weights models (such as Qwen 2.5 7B or Llama 3.2 3B) through local inference servers like Ollama or vLLM, teams achieve true zero-marginal-cost execution.',
      'Hardware Requirements & Quantization Realities: Running 7-billion parameter models quantized to 4-bit precision (Q4_K_M) requires approximately 4.5 GB to 5.5 GB of VRAM or unified system memory. This makes modern workstations and free-tier cloud instances fully capable of sustaining production agent operations without GPU rental services.',
      'Context Window Optimization: Local inference requires disciplined prompt engineering. Rather than transmitting exhaustive raw conversation logs, autonomous agents should utilize append-only state machines and discrete summarize-and-dispatch handoffs to keep context lengths well below 4,096 tokens.',
      'Sovereign Data Guarantees: Beyond economic advantages, self-hosting ensures zero outbound transmission of corporate knowledge, strategic plans, or proprietary source code to external third-party model providers.'
    ]
  },
  {
    slug: 'human-in-the-loop-agent-safety',
    title: 'Deterministic Human-in-the-Loop Safety Gates for Autonomous Agents',
    description:
      'How to implement non-bypassable human approval gateways and cryptographic audit trails to eliminate runaway agent risks in production.',
    publishDate: '2026-11-06',
    author: 'AIsoftware Security Staff',
    authorRole: 'Safety & Governance',
    readTime: '7 min read',
    category: 'Security',
    keywords: [
      'human in the loop ai',
      'agent approval gateway',
      'autonomous ai safety',
      'audit logging',
      'kill switch'
    ],
    content: [
      'Autonomous agency brings substantial productivity multipliers, but unrestrained agent execution poses severe operational risks. Hallucinated API calls, unauthorized external messaging, and unbounded task execution loops can cause irreparable business damage.',
      'The Fallacy of Soft Prompt Constraints: Prompt-level instructions—such as "Do not post without confirmation"—are non-deterministic and prone to prompt injection or model degradation during recursive execution.',
      'Hardware-Grade Approval Gateways: Safe autonomous architectures decouple task planning from external side-effects. High-risk operations (publishing articles, executing database mutations, dispatching webhooks, or processing payouts) must transition into an explicit PENDING_APPROVAL state in persistent storage.',
      'Worker Execution Boundaries: The background job consumer checks the approval status before calling external network adapters. If the approval token is absent or invalid, the task cannot transition to COMPLETED, regardless of model instructions.',
      'Append-Only Cryptographic Audit Logging: Every dispatched action, prompt duration, token count, and supervisor decision must be stored in an append-only collection chained with SHA-256 hashes to guarantee complete traceability for compliance and post-incident analysis.'
    ]
  },
  {
    slug: 'distributed-queues-bullmq-agents',
    title: 'Architecting Queue-Backed Agent Pipelines with Fastify and BullMQ',
    description:
      'Designing fault-tolerant, asynchronous multi-agent orchestration systems using Redis streams, BullMQ job queues, and real-time SSE telemetry.',
    publishDate: '2026-11-07',
    author: 'AIsoftware Engineering Team',
    authorRole: 'Distributed Systems',
    readTime: '9 min read',
    category: 'Engineering',
    keywords: [
      'bullmq agent queue',
      'fastify sse telemetry',
      'distributed ai agents',
      'nodejs agent worker',
      'fault tolerant agents'
    ],
    content: [
      'Direct synchronous HTTP communication between client interfaces and autonomous agents is notoriously fragile. AI reasoning tasks take seconds to minutes, exposing web servers to request timeouts, socket hangups, and memory exhaustion under concurrent load.',
      'Queue-Centric Decoupling: In a resilient architecture, the web API serves exclusively as a high-throughput admission layer built with Fastify. Incoming user requests or automated cron triggers generate discrete jobs pushed onto Redis-backed BullMQ queues.',
      'Independent Worker Pools: Specialized worker processes subscribe to dedicated task queues. If an inference daemon crashes or encounters rate limiting, the worker employs exponential backoff retries without dropping state or interrupting frontend clients.',
      'Idempotency and Concurrency Controls: Autonomous agents must declare unique idempotency keys derived from their parent objective and step index. This ensures repeated network deliveries or worker restarts never trigger duplicate side-effects.',
      'Real-Time Telemetry via Server-Sent Events (SSE): Client dashboards track queue progress, task milestones, and operational health streams over persistent SSE connections rather than polling APIs, delivering instantaneous feedback while minimizing database read overhead.'
    ]
  }
];

