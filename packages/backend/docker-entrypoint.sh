#!/bin/sh
set -eu

echo "Synchronizing the database schema..."
../../node_modules/.bin/prisma db push --skip-generate

echo "Starting the BizForce backend..."
exec node dist/index.js

