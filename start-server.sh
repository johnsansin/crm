#!/bin/bash
# Start the BizForce CRM API (:3000). The production frontend is served by nginx.
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
