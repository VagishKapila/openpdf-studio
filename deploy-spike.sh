#!/usr/bin/env bash
# OpenPDF Studio — Day 1 Spike Deployment
# Run this ONCE from your local machine to deploy to Cloudflare Pages.
# Prerequisites: Node 22+, pnpm 9+, Cloudflare account
set -e

echo "OpenPDF Spike — Cloudflare Pages deploy"
echo "========================================"

cd "$(dirname "$0")/apps/pwa"

# 1. Install dependencies
echo "→ Installing dependencies..."
pnpm install

# 2. Build
echo "→ Building production bundle..."
pnpm build

# 3. Deploy
echo "→ Deploying to Cloudflare Pages..."
echo "   (You may be prompted to log in to Cloudflare)"
npx wrangler pages deploy dist --project-name=openpdf-spike

echo ""
echo "✅ Deployed! Your spike URL:"
echo "   https://openpdf-spike.pages.dev"
echo ""
echo "Layer 9 checklist — test on a real iPhone AND Android:"
echo "  [ ] PDF renders, legible, not blurry"
echo "  [ ] Prev/Next navigation works"
echo "  [ ] Pinch zoom works"
echo "  [ ] No console errors"
echo "  [ ] Install to home screen works"
echo "  [ ] PWA launches without browser chrome"
