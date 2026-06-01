#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Verifying database connection..."
npx tsx scripts/startup-db-check.ts

echo "Starting RepoGuardX..."
exec node server.js
