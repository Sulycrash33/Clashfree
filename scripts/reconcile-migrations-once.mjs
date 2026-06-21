// ONE-TIME SCRIPT — reconciles Prisma migration history with reality.
//
// Background: earlier deploys used `prisma db push`, which applies schema
// changes directly without recording them in `_prisma_migrations`. Two
// migrations (20260608_signup_invite, 20260620000000_add_api_key) exist as
// files in this repo and their tables/columns already exist in the live
// database, but Prisma had no record of them — so `prisma migrate deploy`
// would try to re-run them and fail ("table already exists"). [RESOLVED]
//
// Separately, the original migration (20260530105632_echo_exit) was marked
// FAILED in _prisma_migrations — its migration.sql used literal `DATETIME`,
// which is not valid Postgres syntax (that's a MySQL/SQL Server type;
// Postgres uses TIMESTAMP). The migration genuinely never completed. The
// live database has the correct schema anyway, because `db push` (using
// schema.prisma's correct `DateTime` -> TIMESTAMP mapping) created it
// afterward, bypassing the broken .sql file entirely. The .sql file has
// now been corrected in this repo (DATETIME -> TIMESTAMP, 48 occurrences)
// to match reality. This script marks that migration as resolved/applied
// using the corrected file's checksum, clearing the P3009 block.
//
// This script marks migrations as applied WITHOUT re-running their SQL,
// using the same approach as `prisma migrate resolve --applied` but over
// Neon's HTTPS driver instead of the CLI (which needs a TCP connection
// this script doesn't require).
//
// Safe to run more than once: it checks first and skips anything already
// resolved. This file is deleted from the repo immediately after the first
// successful deploy that uses it — see vercel.json history.

import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_TO_INSERT = [
  '20260608_signup_invite',
  '20260620000000_add_api_key',
];

const FAILED_MIGRATION_TO_RESOLVE = '20260530105632_echo_exit';

function checksumFor(name) {
  const migrationFile = path.join(process.cwd(), 'prisma', 'migrations', name, 'migration.sql');
  if (!fs.existsSync(migrationFile)) {
    console.warn(`[reconcile] WARNING: ${migrationFile} not found, using empty checksum.`);
    return '';
  }
  const contents = fs.readFileSync(migrationFile, 'utf8');
  return crypto.createHash('sha256').update(contents).digest('hex');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('[reconcile] No DATABASE_URL set, skipping.');
    return;
  }

  const sql = neon(process.env.DATABASE_URL);

  const existing = await sql`
    SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"
  `;
  const byName = new Map(existing.map((r) => [r.migration_name, r]));

  // Step 1: resolve the genuinely failed migration (finished_at is NULL).
  const failedRow = byName.get(FAILED_MIGRATION_TO_RESOLVE);
  if (failedRow && failedRow.finished_at === null) {
    const checksum = checksumFor(FAILED_MIGRATION_TO_RESOLVE);
    await sql`
      UPDATE "_prisma_migrations"
      SET checksum = ${checksum}, finished_at = now(), applied_steps_count = 1, logs = NULL
      WHERE migration_name = ${FAILED_MIGRATION_TO_RESOLVE} AND finished_at IS NULL
    `;
    console.log(`[reconcile] Resolved failed migration ${FAILED_MIGRATION_TO_RESOLVE}.`);
  } else if (failedRow) {
    console.log(`[reconcile] ${FAILED_MIGRATION_TO_RESOLVE} already finished, skipping.`);
  } else {
    console.warn(`[reconcile] WARNING: ${FAILED_MIGRATION_TO_RESOLVE} not found in table at all.`);
  }

  // Step 2: insert rows for migrations applied via db push, never recorded.
  for (const name of MIGRATIONS_TO_INSERT) {
    if (byName.has(name)) {
      console.log(`[reconcile] ${name} already recorded, skipping.`);
      continue;
    }
    const checksum = checksumFor(name);
    await sql`
      INSERT INTO "_prisma_migrations"
        (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES
        (${crypto.randomUUID()}, ${checksum}, now(), ${name}, NULL, NULL, now(), 1)
    `;
    console.log(`[reconcile] Marked ${name} as applied.`);
  }

  console.log('[reconcile] Done.');
}

main().catch((err) => {
  console.error('[reconcile] FAILED:', err);
  process.exit(1);
});
