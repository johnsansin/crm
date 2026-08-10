#!/bin/bash
# Start BizForce CRM backend (:3000) + frontend dev (:5173).
# Survives reboots via @reboot crontab entry. Logs to /tmp/*.log
export PATH=/home/ubuntu/.nvm/versions/node/v20.20.2/bin:$PATH
export NVM_DIR="/home/ubuntu/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Backend (API) on :3000
if ss -tln | grep -q ':3000 '; then
  echo "backend already running"
else
  cd /home/ubuntu/crm/packages/backend || exit 1
  setsid nohup npm run dev > /tmp/backend.log 2>&1 < /dev/null &
  echo "backend started (pid $!)"
fi

# Frontend dev server on :5173 (production site is served by Apache from dist)
if ss -tln | grep -q ':5173 '; then
  echo "frontend already running"
else
  cd /home/ubuntu/crm/packages/frontend || exit 1
  setsid nohup npm run dev > /tmp/frontend.log 2>&1 < /dev/null &
  echo "frontend started (pid $!)"
fi
