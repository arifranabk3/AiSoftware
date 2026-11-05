# SCHEDULER GUIDE & IDEMPOTENCY

## 1. Minute-Level Idempotency Keys

To prevent duplicate autonomous task executions, every scheduled run calculates an idempotency key:
`idempotencyKey = ${taskId}:${timestampMinute}`

If an execution is registered within the same minute, subsequent triggers are blocked.

---

## 2. Emergency Kill-Switch Integration

Prior to evaluating cron patterns or dispatching scheduled runs, the scheduler invokes `killSwitch.assertOperational()`.
If the owner has activated the emergency freeze, no new tasks are scheduled or triggered.
