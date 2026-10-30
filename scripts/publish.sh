#!/usr/bin/env bash
# Optional publishing helper. Run only when ready to publish this project publicly.
set -euo pipefail
cd "$(dirname "$0")/.."
command -v gh >/dev/null || { echo 'Install the official GitHub CLI first: https://cli.github.com'; exit 1; }
gh auth status >/dev/null 2>&1 || { echo 'GitHub CLI is not signed in. Sign in yourself with gh auth login, then rerun.'; exit 1; }
account=$(gh api user --jq .login)
[[ "$account" == X-Dice ]] || { echo 'This helper is scoped to X-Dice; refusing to publish under another account.'; exit 1; }
[[ ! -e .git ]] || { echo 'Existing Git checkout detected. Publish it manually; this helper refuses to change its remotes.'; exit 1; }
repository='X-Dice/gel-label'
if gh repo view "$repository" >/dev/null 2>&1; then
  repository='X-Dice/gellabel-studio'
  if gh repo view "$repository" >/dev/null 2>&1; then
    echo 'Both intended repository names are occupied. No remote was changed.'; exit 1
  fi
fi
# Change only this new project's own links if the fallback name is selected.
if [[ "$repository" == X-Dice/gellabel-studio ]]; then
  node --input-type=module -e 'import fs from "node:fs";for(const p of ["src/main.ts","README.md","README.zh-CN.md"]){fs.writeFileSync(p,fs.readFileSync(p,"utf8").replaceAll("X-Dice/gel-label","X-Dice/gellabel-studio"));}'
fi
npm test
npm run package
git init -b main
git config user.name 'X-Dice'
git config user.email '244296632+X-Dice@users.noreply.github.com'
git add .gitignore .github src tests scripts docs examples public index.html package.json package-lock.json tsconfig.json vite.config.ts README.md README.zh-CN.md CONTRIBUTING.md LICENSE GelLabel-offline.html
git commit -m 'Build GelLabel v0.1.0: local gel annotation and editable exports'
gh repo create "$repository" --public --source . --remote origin --push --description 'Label gel images in your browser. Paste lane names, add annotations, export SVG/PNG. No uploads.'
gh repo edit "$repository" --add-topic gel-electrophoresis --add-topic image-annotation --add-topic bioinformatics --add-topic igem --add-topic offline-first --add-topic typescript --add-topic svg
# Enable Pages before creating the release. Failures are reported instead of hidden.
gh api --method POST "repos/$repository/pages" -f build_type=workflow >/dev/null
gh workflow run pages.yml --repo "$repository"
gh release create v0.1.0 release/GelLabel-offline.html release/SHA256SUMS.txt --repo "$repository" --target main --prerelease --title 'GelLabel v0.1.0 — initial preview' --notes-file docs/RELEASE_NOTES.md
echo "Repository: https://github.com/$repository"
echo 'Publication commands completed. Wait for Actions, then verify the demo and offline app before announcing them.'
echo 'README publication status and share-draft links must be updated after verification.'
