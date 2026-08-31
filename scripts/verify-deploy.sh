#!/usr/bin/env bash
# Wait for THIS commit's workflow run and report its real conclusion.
#
# The obvious version — `gh run list --limit 1` straight after a push — is
# wrong, and quietly so. GitHub takes a few seconds to create the run, so the
# newest one is often still the PREVIOUS commit's, which has already succeeded.
# You then watch a finished run, print "success", and walk away from a deploy
# that has not started. That happened, and the site served a stale bundle while
# the terminal said green.
set -euo pipefail

REPO="${REPO:-ryan-mapa/ts-dojo}"
SHA="$(git rev-parse HEAD)"
echo "waiting for a run on ${SHA:0:7}…"

# Poll until a run exists for this exact sha, rather than assuming one does.
until [ -n "$(gh run list --repo "$REPO" --commit "$SHA" --json databaseId --jq '.[0].databaseId // empty')" ]; do
  sleep 3
done

RID="$(gh run list --repo "$REPO" --commit "$SHA" --json databaseId --jq '.[0].databaseId')"
gh run watch "$RID" --repo "$REPO" --exit-status >/dev/null 2>&1 || true

CONCLUSION="$(gh run list --repo "$REPO" --commit "$SHA" --json conclusion --jq '.[0].conclusion')"
echo "run $RID for ${SHA:0:7}: $CONCLUSION"
[ "$CONCLUSION" = "success" ]
