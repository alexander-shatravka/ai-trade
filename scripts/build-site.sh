#!/usr/bin/env bash
# Assembles the static site published to GitHub Pages into _site/.
#
# Layout rationale: the mockups link to each other with plain relative hrefs
# (landing.html -> pages.html#about), so they must stay siblings. They are
# therefore flattened to the site root, with landing.html duplicated as
# index.html to serve as the home page. The design/ directory is copied as
# well so previously shared /design/*.html URLs keep working.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/_site"

rm -rf "$out"
mkdir -p "$out"

cp "$root"/design/*.html "$out"/
cp "$root"/design/landing.html "$out"/index.html
cp -R "$root"/design "$out"/design
cp "$root"/.nojekyll "$out"/

# The former home page becomes the Stage 1 artifact index; its links pointed at
# design/ but the pages are now siblings at the root.
sed 's|href="design/|href="|g' "$root"/index.html > "$out"/stage1.html

echo "Built $out:"
find "$out" -type f | sed "s|$out|.|" | sort
