#!/usr/bin/env bash
# Disabled in juanevillam/tridi. The live demo (https://tridi-alpha.vercel.app) deploys from the
# public mirror Torpass/tridi, which copies the hackathon repo's main
# (platanus-hack/platanus-hack-26-ve-team-26), not this one. Pushing this private repo's main
# there would publish private work (yc/) and change the live demo, so it never happens on its own.
# Moving the deploy to this repo is a separate decision: see yc/README.md.
echo "mirror: disabled in this repo; the deploy still follows the hackathon repo."
exit 0
