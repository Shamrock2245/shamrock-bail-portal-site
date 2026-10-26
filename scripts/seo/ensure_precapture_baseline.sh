#!/usr/bin/env bash
# Restore the preserved 2026-10-23 pre-cutover crawl into the working tree.
# This does not crawl the live site. The files stay untracked on the SEO branch.
# Their committed copy is PR #76 (cursor/studio-cutover-crawl-snapshot-4fc0).
# Commit a15f039 on feature/studio-cutover-seo-baseline holds the same blobs.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

JSON_PATH="docs/seo-baseline/live-2026-10-23.json"
CSV_PATH="docs/seo-baseline/live-2026-10-23.csv"
SNAPSHOT_REF="origin/cursor/studio-cutover-crawl-snapshot-4fc0"
HISTORY_REF="a15f039"

if [[ -s "$JSON_PATH" && -s "$CSV_PATH" ]]; then
    echo "Pre-cutover baseline already present at $JSON_PATH"
    exit 0
fi

restore_from() {
    local rev="$1"
    git cat-file -e "${rev}:${JSON_PATH}"
    git cat-file -e "${rev}:${CSV_PATH}"
    mkdir -p docs/seo-baseline
    git show "${rev}:${JSON_PATH}" > "$JSON_PATH"
    git show "${rev}:${CSV_PATH}" > "$CSV_PATH"
    echo "Restored the 2026-10-23 pre-cutover crawl from ${rev}."
    echo "Leave these files uncommitted on the SEO branch."
}

if git rev-parse --verify --quiet "$SNAPSHOT_REF" >/dev/null; then
    restore_from "$SNAPSHOT_REF"
    exit 0
fi

if git cat-file -e "${HISTORY_REF}:${JSON_PATH}" 2>/dev/null; then
    restore_from "$HISTORY_REF"
    exit 0
fi

echo "Fetching ${SNAPSHOT_REF} to recover the preserved crawl..."
git fetch origin cursor/studio-cutover-crawl-snapshot-4fc0
restore_from "$SNAPSHOT_REF"
