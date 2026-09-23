# Deploying to Hostinger

The game is a static Vite build served from `https://www.playologyentertainment.com/Hollywoodland/`
(the path is case-sensitive on Hostinger's Linux hosting, and matches `base` in `vite.config.ts`).

## Releasing
1. Push the commit to `main` and let CI (`ci.yml`) go green.
2. GitHub > Actions > **Deploy to Hostinger** > **Run workflow**. Leave `client_dir` at `Hollywoodland/`
   unless the FTP login lands above `public_html` (then `public_html/Hollywoodland/`).
3. The workflow typechecks, tests, builds with `VITE_BUILD_ID` set to the commit SHA, and uploads `dist/`.
4. Open the live URL and check the browser console and network tab for 404s.

Required repo secrets: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` (the same values OtakuPalace uses).

## Rolling back
`git revert` the bad commit on `main`, push, and run the workflow again. The workflow always builds the branch
it is run from, and the deploy syncs the folder to match that build.

## Caching
- `public/.htaccess` ships in `dist/`: hashed JS/CSS cached for a year, `index.html` and JSON never cached,
  art and audio cached for a month.
- Art and data in `public/` keep their filenames, so `src/shared/assetUrl.ts` appends `?v=<build id>` to every
  URL; new releases therefore fetch fresh files. Build any new `public/` asset URL with `assetUrl()`.

## Notes
- The FTP deploy action tracks what it uploaded in `.ftp-deploy-sync-state.json` inside the target folder and
  only deletes files it knows about. Never point `client_dir` at the web root.
- Sourcemaps are off in production builds.

## How this was set up (2026-09-23)

### Decisions
| Question | Decision | Why |
|---|---|---|
| Where it lives | `https://www.playologyentertainment.com/Hollywoodland/` on Hostinger shared hosting | A subfolder of the existing site, alongside `/OtakuPalace/`. |
| Path casing | `/Hollywoodland/` (capital H) | Hostinger runs Linux, so paths are case-sensitive. Matches OtakuPalace's convention. The old `/hollywoodland/` base and its doc references were changed. |
| Deploy mechanism | GitHub Actions builds, then uploads `dist/` over FTP | Shared hosting has no Node build step, and this keeps `dist/` out of the repo. Copied from OtakuPalace's `deploy-hostinger.yml`, minus its Supabase and game-server steps (Hollywoodland is client-only). |
| Trigger | Manual (`workflow_dispatch`) only | A push to `main` must never publish to the live site. Same as OtakuPalace. |
| FTP account | Same login as OtakuPalace, with its own copies of the three secrets on this repo | GitHub secrets are per repo. |
| Sourcemaps | Off in production | Smaller upload; source isn't exposed on a public site. |
| Stale-art protection | `?v=<commit SHA>` on every asset URL built in code | Files in `public/` keep their names between releases, so browsers would otherwise keep cached art. |

### What changed in the repo (commit `0cdb74c`)
- `vite.config.ts`: `base: '/Hollywoodland/'`, `sourcemap: false`.
- `src/shared/assetUrl.ts` (new): the one place asset URLs are built. `AppShell`, `CharacterCreator`, both Boulevard scenes and `WebAudioEngine` now use it. `WebAudioEngine` no longer takes a base URL. The Boulevard manifest and walk-cycle loads dropped their `?t=Date.now()`.
- `public/.htaccess` (new): compression, one-year cache for hashed JS/CSS, no cache for HTML and JSON, one month for art and audio.
- `.github/workflows/deploy-hostinger.yml` (new): the manual deploy (secrets preflight, typecheck, tests, build, FTP upload).
- `tests/asset-url.test.ts` (new); one source-text assertion in `tests/level-up-celebration.test.ts` updated for the new helper.

### Verification performed
- Typecheck, 618 tests and the production build passed locally.
- `vite preview` served the build under `/Hollywoodland/`; every asset path in the bundle returned 200.
- After the first deploy, the live site was checked by hand, and the live headers were confirmed: `no-cache` on HTML/JSON, gzip and a one-year cache on the JS bundle, a 30-day cache on art, and no sourcemaps (404).

### Known quirks
- Only URLs built through `assetUrl()` get `?v=`. Images referenced straight from `index.html` and `styles.css` (logos, main menu slate, creator background) rely on the one-month `.htaccess` cache; rename such a file when it changes.
- The bundle's `Cache-Control` on Hostinger is `public, max-age=31536000` without `immutable` (the `Expires` rule wins). Harmless: the filename changes whenever the content does.
- CI builds on Linux, so the live bundle's hash differs from a local Windows build of the same commit (line endings). This is expected.
- The repo is public. Nothing secret belongs in it; FTP credentials live only in GitHub Actions secrets.
