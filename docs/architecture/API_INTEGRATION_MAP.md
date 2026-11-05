# API INTEGRATION MAP & DATA FLOW

| UI Module / Button       | HTTP Method | Endpoint                                | Description                                            |
| ------------------------ | ----------- | --------------------------------------- | ------------------------------------------------------ |
| Master Health Poller     | `GET`       | `/api/v1/system/health`                 | Fetches live database and kill-switch state every 10s. |
| Security Status          | `GET`       | `/api/v1/system/security`               | Checks zero-cost compliance and audit chain depth.     |
| Kill-Switch Activation   | `POST`      | `/api/v1/system/kill-switch/activate`   | Freezes all worker queues and sets `isHalted: true`.   |
| Kill-Switch Deactivation | `POST`      | `/api/v1/system/kill-switch/deactivate` | Resumes autonomous execution upon owner command.       |
