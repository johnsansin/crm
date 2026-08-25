#!/bin/bash
cd /home/ubuntu/crm/packages/backend
setsid nohup npm run dev > /tmp/backend.log 2>&1 < /dev/null &
cd /home/ubuntu/crm/packages/frontend-next
setsid nohup npm run dev > /tmp/frontend.log 2>&1 < /dev/null &
echo "started"
