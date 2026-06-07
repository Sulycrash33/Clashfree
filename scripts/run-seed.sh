#!/bin/bash
# ============================================================
# ClashFree — FEDKO Seed Runner
# Run from project root: bash scripts/run-seed.sh
# ============================================================

set -e

export DATABASE_URL="postgresql://neondb_owner:npg_oiutd1Un0QPV@ep-mute-glitter-abrmax8o-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

echo ""
echo "======================================================="
echo "  ClashFree — FEDKO Full Reseed"
echo "======================================================="
echo ""
echo "[STEP 1] Purging existing FEDKO data..."
npx ts-node --compiler-options '{"module":"commonjs"}' prisma/purge-fedko.ts

echo ""
echo "[STEP 2] Seeding fresh FEDKO data..."
npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed-fedko.ts

echo ""
echo "======================================================="
echo "  COMPLETE — FEDKO is fully populated"
echo "======================================================="
