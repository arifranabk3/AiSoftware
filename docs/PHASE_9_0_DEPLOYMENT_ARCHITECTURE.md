# Phase 9.0 — Deployment Architecture Specification (Corrected)

**Project:** AI Command Center
**Target Environment:** Oracle Cloud Infrastructure (OCI) Ampere A1 (ARM64)
**Hardware Profile:** 2 OCPUs, 12 GB RAM, 75 GB Boot Volume (Single VM)
**Document Status:** Corrected Architectural Specification

---

## 1. Single-Node System Architecture Diagram

```mermaid
flowchart TD
    subgraph Internet ["Public Internet"]
        User["Authenticated Operator / Browser"]
    end

    subgraph OCI_VCN ["Oracle Cloud VCN (Virtual Cloud Network)"]
        subgraph SecurityList ["Ingress Firewalls"]
            P80["Port 80 (HTTP Redirect)"]
            P443["Port 443 (HTTPS Ingress)"]
            P22["Port 22 (SSH - Restricted to Owner IP)"]
        end

        subgraph VM ["Single Ampere A1 VM (2 OCPU / 12 GB RAM)"]
            subgraph DockerCompose ["Internal Docker Network (command_center_net)"]
                Caddy["Caddy Gateway (Ports 80/443 -> Internal)"]
                Web["Next.js Web Dashboard (Port 3000)"]
                API["Fastify REST API (Port 3001)"]
                Worker["BullMQ Worker Daemon"]
                Redis["Local Redis Container (Port 6379, Internal Only)"]
            end

            subgraph HostServices ["Host Native OS Layer"]
                Ollama["Ollama Daemon (Port 11434, 127.0.0.1 Only)"]
                OS["Ubuntu 24.04 ARM64 / Systemd"]
            end
        end
    end

    subgraph ExternalFreeDB ["External Free Tier Services"]
        Atlas["MongoDB Atlas M0 (512MB, TLS Encrypted)"]
        Gemini["Google Gemini API (Free Tier Fallback)"]
        Groq["Groq API (Free Tier Fallback)"]
    end

    User -->|HTTPS| P443
    P443 --> Caddy
    Caddy -->|Proxy /| Web
    Caddy -->|Proxy /api/*| API
    API -->|Enqueue Tasks & Locks| Redis
    API -->|Persist Objectives & Users| Atlas
    Worker -->|Consume Queue| Redis
    Worker -->|Update Status & Outbox| Atlas
    Worker -->|Zero-Cost Local Inference| Ollama
    Worker -.->|Tier 1 Fallback| Groq
    Worker -.->|Tier 2 Fallback| Gemini
```

---

## 2. Container Startup Sequence & Dependency Graph

On host boot, services start sequentially to prevent connection race conditions:

```mermaid
sequenceDiagram
    autonumber
    participant Host as OCI Host OS (systemd)
    participant Ollama as Ollama Daemon
    participant Redis as Local Redis Container
    participant Mongo as MongoDB Atlas (External)
    participant API as Fastify API Container
    participant Worker as BullMQ Worker Container
    participant Caddy as Caddy Reverse Proxy

    Host->>Ollama: Start systemd service (ollama serve)
    Host->>Redis: docker compose up -d redis
    Redis-->>Host: Ready on internal port 6379
    Host->>Mongo: Verify connectivity (TCP 27017)
    Host->>API: docker compose up -d api
    API->>Mongo: Initialize indexes & bootstrap owner
    API->>Redis: Connect to BullMQ task dispatcher
    API-->>Host: Healthcheck PASS (HTTP 200 on /api/v1/system/health)
    Host->>Worker: docker compose up -d worker
    Worker->>Redis: Connect to BullMQ queue
    Worker->>Ollama: Check provider health
    Worker-->>Host: Worker polling active
    Host->>Caddy: docker compose up -d caddy
    Caddy->>Caddy: Issue Let's Encrypt TLS cert
    Caddy-->>Host: Listening on 80 and 443
```

---

## 3. Redis Placement: Local Container vs. Upstash

**Decision:** **Deploy Local Redis 7 Container on the VM**.
- **Rationale:** All consumers (API and Worker) run on the same physical VM. Deploying local Redis (`redis:7-alpine`) on the internal Docker bridge network eliminates network latency, provides sub-millisecond BullMQ queue operations, avoids Upstash monthly command quotas (500k/month), and consumes < 50 MB RAM.
- **Upstash Role:** Upstash is kept as an optional secondary fallback for multi-node disaster scenarios only, not in primary single-node runtime.

---

## 4. Single-VM Failure Domain & Recovery Boundaries

- **Single Point of Failure (SPOF):** The VM itself is a single point of failure. If the VM reboots or the OCI host experiences maintenance, the entire system is unavailable until the VM returns online.
- **Persistent Data:**
  - Database state is safe on MongoDB Atlas M0.
  - TLS certificates are stored on persistent named volume `caddy_data`.
  - Downloaded Ollama weights are stored on the host filesystem (`~/.ollama`).
- **Graceful Shutdown:** All containers run with `dumb-init` to ensure clean SIGTERM propagation and process flushing before exit.
