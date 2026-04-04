#!/bin/sh
set -e

echo "Pushing database schema..."
prisma db push --skip-generate

echo "Seeding database..."
prisma db seed || echo "Seeding skipped or already done."

echo "Starting server..."
exec node .output/server/index.mjs
