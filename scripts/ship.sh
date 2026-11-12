#!/usr/bin/env bash
# Ships the current branch to main: rebase, push, open a PR, squash-merge it,
# then reset the branch to the new main so work continues on the same branch.
# Usage: scripts/ship.sh ["feat(area): squash commit title"]
set -euo pipefail

branch=$(git symbolic-ref --short HEAD)
if [ "$branch" = main ]; then
  echo "ship: you are on main. Create your branch first: git switch -c <name>/<topic>"
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "ship: uncommitted changes. Commit them first."
  exit 1
fi

git fetch --quiet origin main
git rebase origin/main

if [ -z "$(git log --oneline origin/main..HEAD)" ]; then
  echo "ship: nothing new on '$branch' compared to main."
  exit 0
fi

# Default title: the oldest commit on the branch, which usually names the feature.
title=${1:-$(git log --reverse --format=%s origin/main..HEAD | head -n 1)}

git push --force-with-lease -u origin "$branch"
# Only an open PR counts: the branch name is reused after every ship, so older merged PRs share it.
pr=$(gh pr list --head "$branch" --state open --json number -q '.[0].number')
if [ -z "$pr" ]; then
  url=$(gh pr create --base main --head "$branch" --title "$title" --body "$(git log --reverse --format='- %s' origin/main..HEAD)")
  pr=${url##*/}
fi
gh pr merge "$pr" --squash --subject "$title"
if [ "$(gh pr view "$pr" --json state -q .state)" != MERGED ]; then
  echo "ship: PR #$pr did not merge. Your branch is untouched; fix it and run ship.sh again."
  exit 1
fi
git push --quiet origin --delete "$branch" 2>/dev/null || true

# The squash commit holds everything this branch had, so the branch can safely become main again.
git fetch --quiet origin main
git reset --quiet --hard origin/main
git branch --quiet --unset-upstream 2>/dev/null || true

# Automatically build & deploy web/dist to Cloudflare Pages (https://trytridi.com)
if [ -d "web" ]; then
  echo "ship: building and deploying web/dist to https://trytridi.com ..."
  npm --prefix web run build
  CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-3ffb7774e947f05433f775bce098f81f}" \
    npx --yes wrangler pages deploy web/dist --project-name=tridi --branch=main --commit-dirty=true || \
    echo "ship: warning: wrangler pages deploy skipped or failed (check wrangler login)."
fi

echo "ship: '$title' is on main and deployed to https://trytridi.com. '$branch' now matches main; keep working here."
