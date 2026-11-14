#!/usr/bin/env bash
# Publish the web app to S3 + CloudFront, or roll it back (G60). Called by .github/workflows/deploy.yml and
# rollback.yml; tested against a stand-in `aws` (scripts/__tests__/webapp.test.js).
#
#   webapp.sh release <sha> <dist dir>   upload the build to releases/<sha>/, then publish it
#   webapp.sh rollback previous|<sha>    publish an earlier release again (no build)
#
# Environment: BUCKET, DISTRIBUTION_ID, SUMMARY_FILE (optional, markdown appended).
#
# Layout: every build stays under releases/<sha>/; CloudFront serves live/. Publishing copies the release's hashed
# assets/ first (cached a year, immutable) and then index.html, sw.js and the rest (no-cache), so a new index.html
# never points at a file that is not there yet. Old assets stay in live/: a tab still running another release can
# load its chunks after a deploy or a rollback. releases/LIVE names the live release, releases/HISTORY lists every
# publish (oldest first).

set -euo pipefail

IMMUTABLE='public, max-age=31536000, immutable'
NO_CACHE='no-cache'

fail() { echo "::error title=${1}::${2}" >&2; exit 1; }
summary() { if [ -n "${SUMMARY_FILE:-}" ]; then echo "$*" >> "$SUMMARY_FILE"; fi; }
check_sha() { [[ "$1" =~ ^[0-9a-f]{7,40}$ ]] || fail "Bad release" "'$1' is not a commit SHA."; }

exists() { aws s3api head-object --bucket "$BUCKET" --key "$1" --output json > /dev/null 2>&1; }

read_object() {  # prints the object's text, or nothing if it does not exist
  local tmp
  tmp=$(mktemp)
  if exists "$1"; then aws s3 cp "s3://$BUCKET/$1" "$tmp" --only-show-errors; cat "$tmp"; fi
  rm -f "$tmp"
}

upload() {
  local sha=$1 dist=$2
  [ -f "$dist/index.html" ] || fail "No build" "$dist/index.html does not exist."
  if exists "releases/$sha/index.html"; then
    echo "releases/$sha/ is already uploaded; publishing it as it is." >&2
    return
  fi
  if [ -d "$dist/assets" ]; then
    aws s3 cp "$dist/assets" "s3://$BUCKET/releases/$sha/assets" --recursive --only-show-errors \
      --cache-control "$IMMUTABLE"
  fi
  aws s3 cp "$dist" "s3://$BUCKET/releases/$sha" --recursive --only-show-errors --exclude 'assets/*' \
    --cache-control "$NO_CACHE"
}

publish() {
  local sha=$1 tmp
  exists "releases/$sha/index.html" || fail "Release not found" "releases/$sha/ has no index.html in $BUCKET."
  aws s3 cp "s3://$BUCKET/releases/$sha/assets" "s3://$BUCKET/live/assets" --recursive --only-show-errors \
    --cache-control "$IMMUTABLE" --metadata-directive REPLACE
  aws s3 cp "s3://$BUCKET/releases/$sha" "s3://$BUCKET/live" --recursive --only-show-errors --exclude 'assets/*' \
    --cache-control "$NO_CACHE" --metadata-directive REPLACE

  tmp=$(mktemp)
  { read_object releases/HISTORY; echo "$sha $(date -u +%Y-%m-%dT%H:%M:%SZ)"; } | sed '/^$/d' > "$tmp"
  aws s3 cp "$tmp" "s3://$BUCKET/releases/HISTORY" --only-show-errors --cache-control "$NO_CACHE"
  printf '%s\n' "$sha" > "$tmp"
  aws s3 cp "$tmp" "s3://$BUCKET/releases/LIVE" --only-show-errors --cache-control "$NO_CACHE"
  rm -f "$tmp"

  local id
  id=$(aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths '/*' --output json \
    | jq -r '.Invalidation.Id')
  echo "Waiting for CloudFront invalidation $id ..." >&2
  aws cloudfront wait invalidation-completed --distribution-id "$DISTRIBUTION_ID" --id "$id"
  summary "- Live web app: \`$sha\` (invalidation \`$id\`)"
}

previous_release() {  # the newest release in HISTORY that is not the live one
  local live sha
  live=$(read_object releases/LIVE | tr -d '[:space:]')
  sha=$(read_object releases/HISTORY | awk -v live="$live" '$1 != live { last = $1 } END { print last }')
  [ -n "$sha" ] || fail "Nothing to roll back to" "No earlier release than ${live:-none} in releases/HISTORY."
  echo "$sha"
}

[ -n "${BUCKET:-}" ] || fail "Not configured" "BUCKET is not set."
[ -n "${DISTRIBUTION_ID:-}" ] || fail "Not configured" "DISTRIBUTION_ID is not set."

case "${1:-}" in
  release)
    sha=${2:-}; dist=${3:-}
    check_sha "$sha"
    summary "### Web app released"
    upload "$sha" "$dist"
    publish "$sha"
    ;;
  rollback)
    target=${2:-}
    if [ "$target" = "previous" ]; then sha=$(previous_release) || exit 1; else sha=$target; fi
    check_sha "$sha"
    summary "### Web app rolled back"
    publish "$sha"
    ;;
  *) echo "usage: webapp.sh release <sha> <dist> | rollback previous|<sha>" >&2; exit 2 ;;
esac
