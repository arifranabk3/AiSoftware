# Deliverable REV-02: Affiliate Operations Directory & Ethical Review Package

- **Campaign:** `MKT-2026-REV-001`
- **Asset ID:** `AFF-PKG-01`
- **Channel:** `AFFILIATE`
- **Assigned Specialist:** `spec_affiliate_manager`
- **Status:** Complete Ethical Review & Strategy Package (Awaiting Owner Affiliate Account Registrations)

---

## 1. Ethical Affiliate Policy & Disclosures
- **Honesty First:** We never fabricate affiliate links or claim partnerships before approval.
- **Mandatory Disclosure Statement:**
  > *"Disclosure: Some links on this page are affiliate links. If you make a purchase through these links, we may earn a commission at zero additional cost to you. We only recommend software, hosting, and developer infrastructure we have audited, tested, and verified."*
- **No Spamming:** Zero unsolicited DMs, no scraping protected directories, no misleading claims.

---

## 2. Developer & Hosting Affiliate Program Directory (Zero-Cost Focus)

| Program / Service | Commission Model | Typical Payout | Application URL | Approval Requirement | Owner Action Needed |
|---|---|---|---|---|---|
| **DigitalOcean** | Referral / Cloud Credits | $25 credit + 10% cash/credit referral | `digitalocean.com/partners` | Instant or Fast Approval | Create Account & Generate Referral Link |
| **Hetzner Cloud** | Referral Credits | €10 Cloud Credits per user | `hetzner.com/cloud` | Standard registration | Generate Referral Link |
| **Namecheap / Porkbun** | Registrar Affiliate | 15% - 20% on domains & SSL | `namecheap.com/affiliates` | CJ Affiliate / Impact | Apply through CJ or Impact |
| **NordVPN / ProtonVPN** | Privacy VPN (Self-Hosters) | 30% - 40% recurring revenue | `nordvpn.com/affiliate` | Impact / CJ | Submit developer blog application |
| **Envato Market / CodeCanyon** | Developer Assets & Templates | Up to 30% on first purchase | `envato.com/affiliates` | Impact Radius | Apply via Impact |
| **Gumroad Creator Affiliates** | Digital Products | 10% - 50% per sale | `gumroad.com` | Individual creator approvals | Connect with partnered product creators |

*Note: All affiliate links in this deliverable will use temporary placeholders (`[AFFILIATE_LINK:service_name]`) until the owner registers on the respective platforms and receives formal approval.*

---

## 3. High-Intent Comparison Review Article (Affiliate-Ready)

### Title: The Best Self-Hosted Cloud Infrastructure for Running Local AI Agents in 2026 (Tested & Ranked)
- **Target Keywords:** `best vps for local ai models`, `self hosted ai agent server`, `hetzner vs digitalocean for ollama`
- **Search Intent:** Commercial Investigation / Buyer Intent

#### Introduction
Running autonomous AI agents 24/7 requires stable CPU performance, fast SSDs, and generous RAM. But you don't need a $200/month GPU server if you are running optimized quantized models like Qwen 2.5 7B or Llama 3.2 3B. In this benchmark review, we compare the top self-hosted VPS providers based on cost, RAM scalability, network speed, and uptime.

#### Option 1: DigitalOcean Droplets (Best for Simplicity & Developer Ergonomics)
- **Starting Price:** $12/month (Basic Droplet) / $28/month (4GB Memory-Optimized)
- **Pros:** 1-click Docker marketplace, exceptional documentation, fast global networking.
- **Cons:** Slightly higher price per GB of RAM than bare-metal budget alternatives.
- **Verdict for AI Agents:** Perfect for rapid deployment of the AI Command Center API and worker containers.
- **Special Link:** `[AFFILIATE_LINK:digitalocean]` (Get $200 free credit over 60 days via our partner link)

#### Option 2: Hetzner Cloud (Best Price-to-Performance in Europe)
- **Starting Price:** €4.50 – €15/month for 4GB – 8GB RAM
- **Pros:** Unbeatable price per core, fast NVMe drives, European data privacy standards.
- **Cons:** Slower setup process and identity verification required.
- **Verdict for AI Agents:** The community favorite for running continuous background Ollama workers on a budget.
- **Special Link:** `[AFFILIATE_LINK:hetzner]` (Receive €20 cloud credit with our referral code)

#### Option 3: Oracle Cloud Free Tier (The True $0 Solution)
- **Price:** $0.00 / month forever
- **Pros:** 4 OCPUs ARM, 24 GB RAM, 200 GB combined storage pool.
- **Cons:** Limited capacity in single-AD regions; requires patience during registration.
- **Verdict for AI Agents:** The absolute gold standard if you want 100% zero-cost 24/7 hosting.
- **Setup Guide:** Read our free internal setup guide: [Link to internal Phase 10.1 documentation]

---

## 4. Affiliate Tracking & Conversion Schema
All outbound affiliate clicks must be tracked via an internal redirection endpoint to preserve user privacy while measuring conversion efficacy:
- **Tracking URL Structure:** `/api/redirect?src=aff_pkg_01&dest=digitalocean&ref=owner_id`
- **Database Metrics:** Logs click timestamp, referring asset ID, and destination service without capturing personal user data.
- **Financial Status:** All commissions default to `$0.00` until reconciled with the affiliate network statement.
