# Tina sprint review site

Next + TinaCMS (local mode), served on http://localhost:3007 by the LaunchAgent
`com.kulesy.tina-sprint-review`. Not a git repo, so nothing here has history: move files to `junk/`, never delete.

## The code is the starter's

Since 5 Oct 2026 this site is `~/Projects/sprint-review-starter` plus TinaCMS content. Every
source file is byte-identical to the starter's except these, which belong to this site:

- `package.json`, `package-lock.json` (name, and ports 3007 / 4007 / 9007 with `-H 0.0.0.0` for
  Tailscale)
- `tina/config.ts` (meeting sync: review N and forecast N+1 share their meeting fields),
  `lib/meeting.ts`, `app/api/meeting-sync/route.ts`
- `tina/collections/custom-sections.ts` and `components/sprint/custom-sections.tsx` (the `hours`
  and `aiTools` sections)
- `next.config.js` (old `/sprint/<file>` links redirect to `/review/<file>`)
- `tina/tina-lock.json` (generated from this site's schema), `CLAUDE.md`, `README.md`, `content/`,
  `public/uploads/`, `public/brand/`

A change to anything else is a starter change: make it in the starter and copy it across, so the two
never drift. This lists every shared file that differs, and must print nothing:

```bash
cd ~/Projects/tina-sprint-review && for f in $(cd ../sprint-review-starter && find app components lib tina .github next-env.d.ts tsconfig.json .eslintrc.json .gitignore .prettierrc .env.example -type f -not -path "*/__generated__/*"); do case $f in tina/config.ts|tina/tina-lock.json|tina/collections/custom-sections.ts|components/sprint/custom-sections.tsx) continue;; esac; cmp -s "$f" "../sprint-review-starter/$f" || echo "$f"; done
```

Team name, logo, Project Portal link, masthead headings and the HTML signature are content, in
`content/settings/settings.json`. The logo is one SVG, `public/uploads/brand/tinacms-and-tinacloud.svg`,
drawn to match the old two-logos-and-ampersand masthead pixel for pixel. It must sit under
`public/uploads/`: TinaCloud serves every image field from assets.tina.io, which only holds the media
folder, so a logo anywhere else 404s on the deployed site.

## The sheet IS the email

Each page's orange sheet is what Eli copies into Outlook with Copy for Email. Since 26 Sep 2026 it is
built so the page and the email cannot drift apart:

- Everything inside the sheet is built from `components/email/primitives.tsx` (on `react-email`) and
  the tokens in `components/email/theme.ts`: inline styles only, px and hex only, tables for layout.
- No CSS class may style anything inside the sheet. `app/globals.css` styles only the page chrome
  (actions bar, home page), and `.sheet-host` resets the sheet to browser defaults so page styles
  cannot leak in. If a change seems to need a class inside the sheet, it needs an inline style.
- Spacing is cell padding (`Block`, `Section`), never margins on tables or padding on divs: Outlook
  ignores both.
- Every text element names its own font, size and colour through `text()`. Nothing inherits.
- No web font. The page uses the same system font stack the email gets.
- Outlook's paste filter drops some styles, found by a real paste on 26 Sep 2026: `text-transform` and
  `text-decoration-color` everywhere, and padding, margin and `white-space` on inline elements (span,
  a). So small caps are written in capitals (`caps()`), inline spacing is non-breaking spaces (`gap()`),
  and anything boxed (pills, tags) gets its shape from text and background, not padding.
  `lib/outlook-safe.ts` flags these, and Copy for Email reports them on the page.
- Text that must stay on one line (table headers, pills) joins its words with `gap()` and sits in a
  cell with `white-space: nowrap`. Non-breaking spaces hold in every client; `Grid` does this for
  every header.
- Columns get spare room, never an exact fit. `Grid` measures each column's narrowest width, adds
  25% (`COLUMN_SLACK`), gives the rest to the columns that want to grow, and sets the result as
  percentages on the page. An exact fit broke in Outlook (ESTIM / ATE, PERSO / N): its body sets
  `overflow-wrap: break-word`, it strips `width` attributes and `nowrap` from header cells, and it
  drew text about 20% wider than Chrome measured. The copy step then freezes every column's width
  into the email. Never hand-set column widths on a `Grid` with a header row; a header-less one (deployments,
  epics) keeps the fixed widths its count and progress cells set.
- Every list item is individually editable: table cells carry `tinaField(row, "<field>")`, string
  list items carry `tinaField(doc, "<list>", index)` (`List` takes `itemField` for this), and an item's
  box carries `tinaField(item)`. A list-level hook goes ONLY on the empty-state placeholder, so the
  first item can be added. On a populated list it makes a click select the whole list, and for a
  list of objects Tina opens an empty input you cannot type in (Eli, 29 Sep 2026, on the backlog,
  cloners, R&D and forecast goals).
- `lib/copy-for-email.ts` strips editing hooks, freezes column widths and embeds images. Column
  widths are the only thing it reads off the page; it never reads styles, so do not add style
  fix-ups there; fix the primitive instead.

## Every change is checked in the EMAIL too, not just the page

Eli, 26 Sep 2026: "when you do any change can you make sure the email looks fine too". After ANY
change to a page, a primitive, the theme or the copy code, run this parity check in the browser pane
on a review (`/review/...`) AND a forecast (`/forecast/...`), with the pane at least 1100px wide
(`resize_window` 1100x800): a narrower pane shrinks the page sheet and every position then differs. It copies the email, renders it in a
standards-mode iframe (a `<!DOCTYPE>` matters: quirks mode lays tables out differently), and compares
the position and size of every leaf element against the page:

```js
const pick = (el, b) => [...el.querySelectorAll("h1,h2,h3,img,td,p,li,span,th")]
  .filter((e) => (e.children.length === 0 || e.tagName === "IMG") && !e.closest("[data-copy=only]"))
  .map((e) => { const r = e.getBoundingClientRect();
    return [e.tagName, (e.textContent || e.getAttribute("alt") || "").trim().slice(0, 22),
      Math.round(r.top - b.top), Math.round(r.left - b.left), Math.round(r.width), Math.round(r.height)]; });
const sheet = document.getElementById("sheet"); const base = sheet.getBoundingClientRect();
const page = pick(sheet, base);
let cap = null;
navigator.clipboard.write = async (items) => { cap = await (await items[0].getType("text/html")).text(); };
document.querySelector(".copy-email").click();
for (let k = 0; k < 60 && !cap; k++) await new Promise((r) => setTimeout(r, 500));
const f = document.createElement("iframe");
f.style.cssText = "position:fixed;left:0;top:0;width:1000px;height:900px;border:0";
document.body.appendChild(f);
f.srcdoc = '<!DOCTYPE html><html><head><meta charset=utf-8></head><body style="margin:0">' + cap + "</body></html>";
await new Promise((r) => (f.onload = r)); await new Promise((r) => setTimeout(r, 1500));
const es = f.contentDocument.querySelector("table[align=center] table"); const eb = es.getBoundingClientRect();
const email = pick(es, eb).slice(0, page.length);
const diffs = page.map((m, i) => { const e = email[i] || [];
  return m[1] !== e[1] || m.slice(2).some((v, j) => Math.abs(v - (e[j + 2] ?? -999)) > 1) ? { page: m, email: e } : null; })
  .filter(Boolean);
f.remove();
({ compared: page.length, diffs: diffs.length, first: diffs.slice(0, 5) });
```

`diffs` must be 0, and the Copy for Email message must read "Copied - paste with Keep source
formatting". "Copied, but N things Outlook will render differently" means the change used a style
Outlook's filter removes, and the console lists them. Reload the page afterwards, since the check stubs the clipboard,
then screenshot the part you changed and say in the report that the check passed.

Then stress the headers the way Outlook treats them. Render the copy with `overflow-wrap:
break-word` on the body, and on every `th` remove the `width` attribute and `white-space`, set
`font-size: 13.8px` (20% wider) and turn non-breaking spaces back into spaces. No header may break
onto a second line. At 16px it should break, which proves the test can fail.

The check proves the copied HTML renders like the page in Chrome. It cannot see what Outlook's paste
filter strips, and the guard only knows the drops found so far. So when a change uses a style
property the sheet has not used before, also paste into a fresh Outlook web draft with Keep source
formatting and look. Add anything newly dropped to `lib/outlook-safe.ts`.
