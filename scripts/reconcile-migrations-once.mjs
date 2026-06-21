// ONE-TIME SCRIPT — reconciles Prisma migration history with reality.
//
// Background: earlier deploys used `prisma db push`, which applies schema
// changes directly without recording them in `_prisma_migrations`. Two
// migrations (20260608_signup_invite, 20260620000000_add_api_key) exist as
// files in this repo and their tables/columns already exist in the live
// database, but Prisma has no record of them — so `prisma migrate deploy`
// would try to re-run them and fail ("table already exists").
//
// This script marks those two as applied WITHOUT re-running their SQL,
// using the same approach as `prisma migrate resolve --applied` but over
// Neon's HTTPS driver instead of the CLI (which needs a TCP connection
// this script doesn't require).
//
// Safe to run more than once: it checks first and skips anything already
// recorded. This file is deleted from the repo immediately after the first
// successful deploy that uses it — see vercel.json history.

import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_TO_RECONCILE = [
  '20260608_signup_invite',
  '20260620000000_add_api_key',
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('[reconcile] No DATABASE_URL set, skipping.');
    return;
  }

  const sql = neon(process.env.DATABASE_URL);

  const existing = await sql`SELECT migration_name FROM "_prisma_migrations"`;
  const existingNames = new Set(existing.map((r) => r.migration_name));

  for (const name of MIGRATIONS_TO_RECONCILE) {
    if (existingNames.has(name)) {
      console.log(`[reconcile] ${name} already recorded, skipping.`);
      continue;
    }

    const migrationFile = path.join(
      process.cwd(),
      'prisma',
      'migrations',
      name,
      'migration.sql'
    );

    let checksum = '';
    if (fs.existsSync(migrationFile)) {
      const contents = fs.readFileSync(migrationFile, 'utf8');
      checksum = crypto.createHash('sha256').update(contents).digest('hex');
    } else {
      console.warn(`[reconcile] WARNING: ${migrationFile} not found, using empty checksum.`);
    }

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
