# OWNER CONTROL CENTER & EMERGENCY PROCEDURES

## 1. Authority & Access

Only the authenticated Owner account can trigger emergency halt or resume operations.

---

## 2. Distributed Emergency Shutdown Procedure

1. Owner opens **Owner Control Center** in Dashboard.
2. Enters reason in the audit input field (e.g. "Scheduled security investigation").
3. Clicks **TRIGGER EMERGENCY KILL SWITCH**.
4. Frontend dispatches `POST /api/v1/system/kill-switch/activate`.
5. Backend atomically updates MongoDB `system_controls`, increments version counter, and cryptographically signs an audit event.
6. All running BullMQ workers freeze immediately upon their next execution check.
