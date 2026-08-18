#!/usr/bin/env bash
# Assembles the static site published to GitHub Pages into _site/.
#
# The site is the prerendered Nuxt app. The Stage 1 HTML mockups are kept
# under /design/ because those URLs have already been shared; they are
# reference material, not part of the app.
#
# NUXT_APP_BASE_URL must match the path the site is served from — GitHub Pages
# serves a project site from /<repo>/, not from the domain root.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/_site"
base="${NUXT_APP_BASE_URL:-/}"

echo "Generating the Nuxt app with baseURL=$base"
NUXT_APP_BASE_URL="$base" pnpm --filter @ai-trade/web generate

rm -rf "$out"
cp -R "$root/apps/web/.output/public" "$out"

# Without this, GitHub Pages runs Jekyll, which drops the _nuxt asset directory.
touch "$out/.nojekyll"

cp -R "$root/design" "$out/design"

# The Stage 1 artifact index used to be the home page. It is kept beside the
# mockups it links to, so those links become siblings rather than design/*.
sed 's|href="design/|href="|g' "$root/index.html" > "$out/design/stage1.html"

echo "Built $out:"
find "$out" -maxdepth 2 -type f | sed "s|$out|.|" | sort | head -30
