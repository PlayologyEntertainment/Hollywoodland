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
