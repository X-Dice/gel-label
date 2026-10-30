# Publishing notes

The user created the public `X-Dice/gel-label` repository. Source publication is being prepared through the GitHub connector. `scripts/publish.sh` is provided for a future authorized publishing session; it has not been executed against GitHub. It cannot bypass browser permissions or a missing CLI login.

## Prepared metadata

- Account: `X-Dice`
- Repository: `gel-label`; fallback only when occupied: `gellabel-studio`
- Visibility: public
- Description: Label gel images in your browser. Paste lane names, add annotations, export SVG/PNG. No uploads.
- Topics: `gel-electrophoresis`, `image-annotation`, `bioinformatics`, `igem`, `offline-first`, `typescript`, `svg`
- License: MIT
- Tag: `v0.1.0`, marked prerelease while browser acceptance remains unverified
- Homepage after successful deployment: the actual Pages URL returned by GitHub (do not announce a guessed URL)

## Optional helper

With the official GitHub CLI already signed into X-Dice, run:

```sh
npm ci
npm run publish:github
```

The helper checks the account and repository names, refuses an existing `.git` checkout, tests/builds/packages, creates a local commit using a public noreply email, creates a **public** repository, pushes it, sets topics, enables Pages, and publishes the preview release with offline HTML and a checksum. It never reads browser credentials, changes global Git settings, overwrites a remote, or prints tokens.

If it fails after repository creation, it leaves the partial state in place. Inspect the existing repository and continue manually rather than rerunning or deleting anything. Pages/workflow permissions may need to be enabled in the repository settings. Use the GitHub connector or normal GitHub UI in an authorized session where available.

## Required follow-up

- Wait for both included workflows and check their final results.
- Complete the browser checklist in `VERIFICATION.md`.
- Open the actual deployed URL and download the release asset; check the checksum.
- Replace README publication-status notes with verified demo/release links and set the repository homepage.
- Capture real UI screenshots and a short browser interaction recording. The current visual examples show renderer output only.
- Replace placeholders in `SHARE_DRAFTS.md` before using those drafts. They have not been posted.

Official references: [repository creation](https://cli.github.com/manual/gh_repo_create), [GitHub Pages API](https://docs.github.com/en/rest/pages/pages#create-a-github-pages-site), [release creation](https://cli.github.com/manual/gh_release_create).

## Release automation

The included `Publish preview release` workflow runs checks and publishes the package version as a prerelease when `package.json` or the release workflow is pushed to main. Existing release assets are preserved. Pages still needs to be enabled in repository settings with GitHub Actions as its source.
