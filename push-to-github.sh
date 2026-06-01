#!/bin/bash
# ClashFree — Push to GitHub

git add .
git commit -m "feat: migrate from SQLite to Neon PostgreSQL"

# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/Sulycrash33/clashfree.git
git branch -M main
git push -u origin main

echo "Done! Now go to Vercel and add these environment variables:"
echo "  DATABASE_URL  — pooled connection from Neon"
echo "  DIRECT_URL    — direct connection from Neon"
echo "  NEXTAUTH_SECRET — any random string"
echo "  NEXTAUTH_URL  — your Vercel app URL"
echo ""
echo "After first deploy, run in Vercel console:"
echo "  bunx prisma migrate deploy"
