This migration file is kept for documentation/history purposes only.

This project's deploy pipeline uses `prisma db push` (see vercel.json),
not `prisma migrate deploy` — db push does not read or apply files in
this migrations/ folder. The ApiKey table this migration describes gets
created automatically by `db push` reading prisma/schema.prisma directly
on the next deploy.

(Background: the existing migration history in this folder was never
actually applied to the production database via `prisma migrate` — the
build never ran that command until 2026-06-20, at which point the first
migration in the folder failed because it predates the project's switch
to Postgres and still contains SQLite-only syntax. Rather than repair a
migration history nothing has ever successfully consumed, we switched
the deploy pipeline to db push, which ignores this folder entirely.)
