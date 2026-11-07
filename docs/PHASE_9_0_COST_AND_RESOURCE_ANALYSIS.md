# Phase 9.0 — Cost & Resource Feasibility Analysis (Final Corrected)

**Project:** AI Command Center
**Scope:** Financial & Computational Resource Model for Oracle Cloud Infrastructure
**Core Policy:** Absolute Zero-Cost ($0.00 Total Expense)

---

## 1. Verified Monthly Budget Model ($0.00)

| Infrastructure Item | Provider | Plan / Tier | Allocated Resource | Monthly Free Allowance | Billed Cost |
|---|---|---|---|---|---|
| **ARM64 Compute** | Oracle Cloud Infrastructure | Always Free Tier | `VM.Standard.A1.Flex` (2 OCPU, 12 GB RAM) | 1,500 OCPU-hours, 9,000 GB-hours / month | **$0.00** |
| **Boot Storage** | Oracle Cloud Infrastructure | Always Free Tier | 75 GB Block Storage (Paravirtualized) | 200 GB total allowance | **$0.00** |
| **Outbound Transfer** | Oracle Cloud Infrastructure | Always Free Tier | Inbound free; outbound under 10 TB/mo | 10 TB / month | **$0.00** |
| **Public IPv4** | Oracle Cloud Infrastructure | Always Free Tier | 1 Ephemeral / Reserved Public IP | Included in compute instance | **$0.00** |
| **Database Persistence** | MongoDB Atlas | M0 Shared Tier | 512 MB Storage, 3-node replica set | Shared free sandbox | **$0.00** |
| **Task Queue Cache** | Local Docker Redis | In-VM Container | 128 MB RAM, local memory/disk | Runs on free VM allocation | **$0.00** |
| **Local AI Inference** | Ollama on Ampere A1 | Host systemd / Docker | `llama3.2:1b` (1.3 GB model) | Runs on free VM allocation | **$0.00** |
| **SSL / TLS Certificate** | Let's Encrypt / Caddy | Automated ACME | Wildcard / Hostname TLS 1.3 | Public automated service | **$0.00** |
| **TOTAL MONTHLY EXPENSE** | | | | | **$0.00** |

---

## 2. Realistic CPU & Memory Utilization on 2 OCPU / 12 GB RAM

```
Total Physical CPU: 2.0 OCPUs (Non-oversubscribed hard ceiling)
========================================================================
Ollama: 0.80 OCPU | Worker: 0.35 OCPU | API: 0.35 OCPU | Web: 0.25 OCPU | Caddy: 0.15 OCPU | Redis: 0.10 OCPU

Total Physical Memory: 12.0 GB (12,288 MB)
========================================================================
[==================== 46% ALLOCATED ====================] [ 54% BUFFER ]
Ollama: 3.5 GB | Worker: 0.8 GB | API: 0.5 GB | Web: 0.5 GB | Redis: 0.1 GB | OS: 0.4 GB | Headroom: 6.2 GB
```

| Component | Hard CPU Limit | Memory Limit (`--memory`) | Expected Active Memory | Memory Status | Performance Impact Under Concurrency |
|---|---|---|---|---|---|
| **Caddy Gateway** | 0.15 OCPU | 128 MB | ~40 MB | Estimated | Top priority CPU shares; sub-10ms proxy latency. |
| **Fastify API Server** | 0.35 OCPU | 512 MB | ~160 MB | Estimated | Top priority CPU shares; UI requests stay responsive during background tasks. |
| **Next.js Web Dashboard** | 0.25 OCPU | 512 MB | ~180 MB | Estimated | Static prerendered pages require minimal server computation. |
| **Local Redis Container** | 0.10 OCPU | 128 MB | ~35 MB | Estimated | In-memory queues with AOF persistence; sub-millisecond dispatch. |
| **BullMQ Worker Daemon** | 0.35 OCPU | 768 MB | ~220 MB | Estimated | Concurrency = 2 jobs; processes tasks in background queue. |
| **Ollama Inference Engine** | 0.80 OCPU | 3,500 MB | ~1,800 MB | Measured | Concurrency = 1 request; token generation ~10–14 tokens/sec on 0.8 OCPU. |
| **Host OS & systemd** | Shared | N/A | ~400 MB | Estimated | Linux kernel, containerd, logging, SSH daemon. |
| **UNALLOCATED HEADROOM** | **0.00 OCPU** | **~6,200 MB** | **N/A** | **N/A** | **54% Free RAM Headroom** prevents kernel OOM killer under burst memory usage. |

---

## 3. Ollama CPU Inference Throughput on 0.8 OCPU Quota

Restricting Ollama to 0.8 OCPU prevents CPU starvation of the Fastify API and Caddy gateway:
- **Model:** `llama3.2:1b` (Q4_K_M quantization, 1.23B parameters)
- **Concurrency:** **Strictly 1 inference request at a time**.
- **Prompt Evaluation:** ~25–35 tokens/second
- **Token Generation:** ~10–14 tokens/second
- **Feasibility:** Fully functional for automated agent summarization, task decomposition, and routing without impacting web dashboard responsiveness. Overflow tasks are automatically routed to Groq or Gemini free-tier endpoints.

---

## 4. Quota Exhaustion & Rate-Limit Safeguards

1. **Zero-Cost Strict Mode (`ZERO_COST_STRICT_MODE=true`):** Enforced in software to reject paid external API calls.
2. **Local Redis:** Completely avoids external third-party command quotas (such as Upstash 500k/month).
3. **MongoDB Atlas 512 MB Ceiling:** Audit logs and task historical records older than 30 days are purged to keep cluster size below 200 MB.
