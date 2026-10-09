# TinaCMS & TinaCloud sprint review site

This site holds TinaCMS & TinaCloud's Sprint Reviews, Retros and Forecasts. It is built from
https://github.com/tinacms/sprint-review-starter with Next.js and TinaCMS. Each Sprint is a JSON file
under `content/`, people edit it at `/admin`, and the page is also the email: Copy for Email puts it on
the clipboard. `README.md` covers the editor and the section types. The starter's root `CLAUDE.md`,
once the site has it, holds the rules for changing code. This file holds the team's own notes.

## Run it

`npm ci`, then `npm run dev`. The site is http://localhost:3000 and the editor is
http://localhost:3000/admin. In local mode a save writes the file in `content/` directly.

## Each Sprint

Run `/prepare-sprint-review` (from the ssw-scrum plugin of SSWConsulting/SSW.AISkills) before the Sprint
Review, from the folder that holds the team's `sprint-emails/.project.json` (often the product repo),
not from this site. It reads the board and writes Sprint N's review and Sprint N+1's forecast here. Run it
again after Sprint Planning and the forecast takes the board's plan. In the meeting, people fill in goal
outcomes, figures and the retro in Tina, then Copy for Email.

Rules for writing the files:

- Never overwrite an existing sprint file by hand. The prepare-sprint-review script only refreshes the
  backlog of a review that has no meeting notes yet, and of a forecast after Sprint Planning.
- Goals, highlights and the retro are the team's words. Leave them empty for people to fill.
- An open Tina editor tab holds its own copy of the document and writes all of it back on save. After a
  script writes a file, tell anyone with it open to reload `/admin`.
- Commit what changed. The site has no remote yet; if the team adds one, pull before writing and push
  only when the person says so.

## Files this site owns

`content/`, `public/uploads/`, `.claude/`, `tina/collections/custom-sections.ts`,
`components/sprint/custom-sections.tsx`, and the colours in `components/email/theme.ts`. Everything else
comes from the starter. For a bug in a starter file, raise an issue on
https://github.com/tinacms/sprint-review-starter rather than editing it here, so every team gets the fix
and starter merges stay clean.

After a schema change, such as a custom section, run `npm run dev` once and commit `tina/tina-lock.json`
with it.

## Pulling starter changes

The site shares the starter's git history, so an update is an ordinary merge:

```bash
git remote get-url starter >/dev/null 2>&1 || git remote add starter https://github.com/tinacms/sprint-review-starter.git
git remote set-url --push starter no-pushing-to-the-starter
git fetch starter
git merge starter/main
npm ci
npm run dev  # regenerates tina/tina-lock.json if the schema changed
```

Commit the merge, plus the lock file if it changed. These conflicts are routine:

- `content/settings/settings.json`: keep this site's values, and add any new keys the starter introduced.
- `tina/tina-lock.json`: take either side, then run `npm run dev` once to regenerate it, and commit that.
- `components/email/theme.ts`: keep this site's colour values, and add any new tokens the starter
  introduced.
- A starter sample sprint file (`sprint-12.json` or `sprint-13.json`) the site had moved out: move it to
  `junk/` again and stage the removal with `git add -A content/`.
