# Phase 10.0 — Zero-Cost Safety Checklist & Deployment Prerequisites (Audited)

**Project:** AI Command Center
**Repository:** `arifranabk3/AiSoftware`
**Latest Release Commit:** `43e235d`
**Document Purpose:** Operator Pre-Deployment Checklist (Zero-Cost & Operational Safeguards)
**Date Checked:** 2026-11-07

---

## 1. Zero-Cost Safeguards Checklist

Before and during OCI console operations, verify every item below to guarantee **$0.00 total expense**:

- [ ] **Avoid Accidental PAYG Upgrade:** [OFFICIALLY VERIFIED] Remain in the **Always Free-Only** tier unless you explicitly understand and accept billing risk.
- [ ] **Verify Always Free Tag:** [OFFICIALLY VERIFIED] When provisioning in the OCI Console, ensure every resource displays the **"Always Free Eligible"** green badge.
- [ ] **Strict Compute Shape Selection:** [OFFICIALLY VERIFIED]
  - Select shape: **`VM.Standard.A1.Flex`** (Ampere Arm).
  - Configure OCPUs: **Exactly 2 OCPUs**.
  - Configure RAM: **Exactly 12 GB RAM**.
  - *Never configure 4 OCPUs / 24 GB for continuous 24/7 workloads* (exhausts the 1,500 OCPU-hours monthly limit).
  - *Never select standard AMD/Intel shapes* (e.g. `VM.Standard.E4.Flex`), as these consume paid or trial credits.
- [ ] **Strict Storage Allocation:** [OFFICIALLY VERIFIED]
  - Configure Boot Volume to **75 GB** (Always Free total pool is 200 GB combined boot and block storage).
  - Do **NOT** create extra secondary block volumes unless the combined total remains strictly $\le 200\text{ GB}$.
- [ ] **Network & Bandwidth Bounds:** [OFFICIALLY VERIFIED]
  - Inbound traffic is permanently free.
  - Outbound data transfer is free up to **10 TB / month** (AI Command Center dashboard typically consumes < 20 GB / month).
- [ ] **Set Up Cost & Budget Alerts:** [OFFICIALLY VERIFIED]
  - In OCI Console -> **Governance & Administration** -> **Cost Management** -> **Budgets**.
  - Create a budget with a threshold of **$1.00 USD**.
  - Configure email notifications for 100% threshold breach.
  - *Critical Reality:* **Budget alerts do NOT stop instances or automatically prevent charges.** They are purely notification alerts sent to the operator.
- [ ] **Acknowledge Idle Reclamation:** [OFFICIALLY VERIFIED]
  - Understand that if CPU, memory, and network utilization drop below threshold for 7 consecutive days, Oracle may stop the instance.
  - Check your registered email regularly for Oracle notifications.
  - Do not use synthetic CPU-spinning scripts to bypass policy.

---

## 2. Technical Deployment Prerequisites Checklist

Ensure all local and external prerequisites are prepared before connecting to the VM:

### 2.1 Domain & DNS Configuration
- [ ] **Domain Name:** Own or register a domain or dynamic DNS hostname (e.g., `control.yourdomain.com`).
- [ ] **DNS Record:** Once the OCI VM is provisioned, create an **`A` record** pointing `control.yourdomain.com` to the OCI VM Public IP address.
- [ ] **Port Ingress:** Ensure ports **80** (HTTP) and **443** (HTTPS) are open in the OCI VCN Security List for automated Let's Encrypt TLS issuance by Caddy.

### 2.2 SSH Key Pair Preparation
- [ ] Generate a dedicated Ed25519 SSH key pair on your local management machine:
  ```bash
  ssh-keygen -t ed25519 -C "admin@ai-command-center" -f ~/.ssh/oci_command_center
  ```
- [ ] Paste the public key (`~/.ssh/oci_command_center.pub`) into the OCI instance creation form.
- [ ] Restrict SSH ingress in OCI Security List: Allow port 22 **only from your static IP address** (`<YOUR_IP>/32`).

### 2.3 Database Network Allowlisting (MongoDB Atlas)
- [ ] Log in to **MongoDB Atlas Console** -> **Network Access**.
- [ ] Add the OCI VM Public IP (`<OCI_VM_IP>/32`).
- [ ] Verify database user credentials for the `ai_command_center` database.
- [ ] Verify connection string format uses TLS/SSL replica set (`mongodb+srv://...`).

### 2.4 Cryptographic Secrets Generation
- [ ] Generate high-entropy 64-character hex keys locally (never commit to git):
  ```bash
  # JWT Secret
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  # Refresh Token Secret
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  # Master Encryption Key
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  # Owner Initial Password (min 12 chars)
  node -e "console.log(require('crypto').randomBytes(16).toString('base64url'))"
  ```
- [ ] Ensure Shannon entropy is $\ge 3.5\text{ bits/char}$ and secrets are distinct.

### 2.5 Container & Registry Readiness
- [ ] Verified that Docker images build natively on ARM64 via GitHub Actions CI (`.github/workflows/arm64-docker-build.yml`).
- [ ] Compose orchestration uses pre-built images or internal Dockerfiles with non-root user `node:node` and `dumb-init`.

### 2.6 Backup & Disaster Recovery Readiness
- [ ] Verify that OCI automated boot volume backups are enabled (5 volume backups included free).
- [ ] Prepare weekly `mongodump` backup destination on local VM disk (`/opt/backups/mongodb`).
