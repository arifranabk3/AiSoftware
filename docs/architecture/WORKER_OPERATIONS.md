# WORKER OPERATIONS & WINDOWS DAEMON RUNNER

## 1. Running the Worker Manually

```cmd
cd D:\projects\AiSoftware\ai-command-center
npm run dev --workspace=@ai-command-center/worker
```

---

## 2. Running as a Persistent Windows Service (PM2)

```cmd
npm install -g pm2
pm2 start apps/worker/dist/index.js --name "ai-command-center-worker"
pm2 save
pm2 startup
```

This ensures the background worker restarts automatically whenever the host machine reboots.
