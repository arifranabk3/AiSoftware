# DISTRIBUTED KILL SWITCH SPECIFICATION

## 1. Problem with In-Memory State

In multi-worker distributed architectures, relying on in-memory variables (`globalThis` or process memory) fails because an emergency stop in Node process A does not propagate to worker process B.

---

## 2. Persistent Distributed Implementation

- **Authoritative Store:** MongoDB collection `system_controls`.
- **Record Structure:**
  - `_id`: `"GLOBAL_KILL_SWITCH"`
  - `isHalted`: Boolean (`true` or `false`)
  - `version`: Monotonically increasing integer
  - `haltedBy`: Actor ID
  - `haltedAt`: ISO timestamp
  - `reason`: Reason provided by owner
- **Fail-Closed Guarantee:**
  If MongoDB is unreachable during a security check, `getLatestState()` fails closed and halts execution.

---

## 3. Two-Process Verification Result

Verified in `tests/phase3_1.test.ts`:
Activating the kill switch on Node A updates MongoDB, increments the version, and immediately causes Node B to abort and refuse any autonomous job execution.
