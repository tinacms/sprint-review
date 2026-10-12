#!/usr/bin/env node
// Moves saved Sprints to Tina's rich-text fields, which hold markdown strings. Run it once after pulling the
// starter update that needs it. Running it again changes nothing.
//
// Retro: each list (wentWell, didntGoWell, improvements) becomes one bulleted markdown list, because Tina
// rejects a list where it expects rich text. Entries read back as typed, except that `*` and `**` stay markup,
// so *italic* and **bold** show. Other markup characters are escaped, and a web address is left as typed.
//
// Figures: a list of figures (title, image, caption, source, placeholder) becomes the section's one body: a
// heading, the picture, and the caption with the source link added. It moves only when every figure has its
// image, so the email reads the same. A figure still waiting for its picture would start showing as bare
// text, so that section is left as it is and the output says which figure to finish.
//
//   node scripts/migrate-rich-text.mjs            convert every file in place
//   node scripts/migrate-rich-text.mjs --dry-run  only say what would change

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FOLDERS = ["content/sprint-review", "content/sprint-forecast"];
const RETRO_FIELDS = ["wentWell", "didntGoWell", "improvements"];
const dryRun = process.argv.includes("--dry-run");

const WEB_ADDRESS = /((?:https?:\/\/|www\.)[^\s<>]+)/i;
const MARKUP = /[\\`_~&<[]/g;

// Everything but a web address, whose underscores and ampersands are part of the link.
const escapeMarkup = (text) => text.split(WEB_ADDRESS).map((part, index) => (index % 2 ? part : part.replace(MARKUP, "\\$&"))).join("");

// A line that starts like a heading, quote, bullet, rule or number would turn into one, so its first character is escaped.
function escapeLead(line) {
  if (/^(#{1,6}(\s|$)|>|[-+*](\s|$)|[-=*]+\s*$)/.test(line)) return `\\${line}`;
  return line.replace(/^(\d+)([.)](\s|$))/, "$1\\$2");
}

function bullet(entry) {
  // A line break inside an item is a hard break, indented to stay inside the item.
  const lines = entry.trim().split(/\s*\n\s*/).map((line) => escapeLead(escapeMarkup(line)));
  return `* ${lines.join("\\\n  ")}`;
}

// A list of strings becomes one bulleted markdown list, written as Tina writes it (`*` bullets and a
// closing newline). Tina may tidy an escape on the first save, but the words stay the same. Blank entries are dropped.
function fromList(entries) {
  const bullets = entries.filter((entry) => typeof entry === "string" && entry.trim()).map(bullet);
  return bullets.length ? `${bullets.join("\n")}\n` : "";
}

function migrateRetro(document) {
  const changes = [];
  const retro = document.retro;
  if (!retro || typeof retro !== "object") return changes;
  RETRO_FIELDS.forEach((field) => {
    const value = retro[field];
    if (!Array.isArray(value)) return;
    const markdown = fromList(value);
    const count = value.filter((entry) => typeof entry === "string" && entry.trim()).length;
    if (markdown) retro[field] = markdown;
    else delete retro[field];
    const bold = markdown.includes("**") ? ", bold kept" : "";
    changes.push(`retro.${field}: ${count ? `${count} item${count === 1 ? "" : "s"} to a bulleted list${bold}` : "empty list removed"}`);
  });
  return changes;
}

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
const text = (value) => (typeof value === "string" ? value.trim() : "");
const isBlank = (value) => value == null || (typeof value === "string" ? value.trim() === "" : typeof value === "object" && !Object.keys(value).length);

// NOTE: [12 Oct 2026] EK - The same tests as safeImageUrl and safeUrl in lib/rich-text.ts. An image or link they
// would drop is not moved into the body, where it would vanish from the email.
const compact = (url) => url.replace(/[\u0000-\u001f\u007f\s]+/g, "");
const isImageUrl = (url) => /^(https?:\/\/|\/(?!\/))/i.test(compact(url));
const isLinkUrl = (url) => /^(https?:|mailto:|tel:|\/|#)/i.test(compact(url));

// Plain text as markdown that reads back as typed. Unlike the retro, `*` is escaped: a title or a source
// label was a plain string, so an asterisk in one was never formatting.
const escapePlain = (value) => value.replace(/[\\`*_~&<[]/g, "\\$&");

// A destination with a space, a bracket or an angle bracket is wrapped in <>, and an ampersand is escaped, as Tina writes it.
const destination = (url) => {
  const safe = url.replace(/&/g, "\\&");
  return /[\s()<>]/.test(url) ? `<${safe.replace(/</g, "%3C").replace(/>/g, "%3E")}>` : safe;
};

// A caption block that is a plain paragraph, so a source link can follow its last word.
const isParagraph = (block) =>
  !block.split("\n").some((line) => /^( {0,3}(#{1,6}(\s|$)|>|[-+*](\s|$)|\d+[.)](\s|$)|```|~~~|\||<|[-=*_]{3,}\s*$)| {4})/.test(line));

const defaultPrompt = (item, heading) => (text(item.title) ? `Paste ${text(item.title)} screenshot in the editor` : `Paste screenshot of ${heading} in the editor`);

// A figure as markdown blocks: its title as a heading, the picture, and the caption under it with the source added.
function figureBlocks(item) {
  const label = text(item.sourceLabel);
  const url = text(item.sourceUrl);
  const source = label ? (url && isLinkUrl(url) ? `[${escapePlain(label).replace(/]/g, "\\]")}](${destination(url)})` : escapePlain(label)) : "";
  const rest = text(item.caption) ? text(item.caption).replace(/\r\n?/g, "\n").split(/\n{2,}/) : [];
  const first = rest.length && isParagraph(rest[0]) ? rest.shift().trim() : "";
  const title = escapePlain(text(item.title).replace(/\s+/g, " ")).replace(/(\s)(#+)$/, "$1\\$2");
  return [title && `### ${title}`, `![](${destination(text(item.image))})`, first && source ? `${first} - ${source}` : first || source, ...rest].filter(Boolean);
}

// Why a section cannot move yet, as the sentence that tells the person what to do. Empty when it can.
function blocker(items) {
  const name = (item, index) => `Figure ${index + 1}${text(item.title) ? ` (${text(item.title)})` : ""}`;
  for (const [index, item] of items.entries()) {
    if (["title", "image", "caption", "sourceLabel", "sourceUrl", "placeholder"].some((key) => !isBlank(item[key]) && typeof item[key] !== "string")) {
      return `${name(item, index)} has a field that is not text. Open it in the editor and save it, then run this again.`;
    }
    if (text(item.image) && !isImageUrl(text(item.image))) {
      return `${name(item, index)} has an image that is not a path on this site or a web address. Add it through the media manager, then run this again.`;
    }
    const blocks = text(item.caption).replace(/\r\n?/g, "\n").split(/\n{2,}/);
    if (text(item.caption) && (!isParagraph(blocks[0]) || blocks.some((block) => /^ {0,3}#{1,6}(\s|$)/m.test(block)))) {
      return `${name(item, index)} has a caption that starts with a list or holds a heading, which the body would not read as a caption. Make its first line a paragraph and take out the heading in the editor, then run this again.`;
    }
    if (text(item.sourceUrl) && !text(item.sourceLabel)) {
      return `${name(item, index)} has a source link with no source label, so the email never showed it. Add a label or clear the link, then run this again.`;
    }
  }
  const waiting = items.findIndex((item) => !text(item.image));
  const typed = items.some((item) => !text(item.image) && (text(item.caption) || text(item.sourceLabel)));
  if (waiting === -1 || (!typed && items.every((item) => !text(item.image)))) return "";
  return `${name(items[waiting], waiting)} has no image yet. Add its image in the editor or delete it, then run this again.`;
}

function migrateFigures(document) {
  const changes = [];
  const left = [];
  (document.sections ?? []).forEach((section, index) => {
    if (!isObject(section) || section._template !== "figures" || !Array.isArray(section.items)) return;
    const heading = text(section.heading) || "Figures";
    const where = `sections[${index}] ${heading}`;
    const items = section.items.filter((item) => isObject(item) && !Object.values(item).every(isBlank));
    if (!isBlank(section.body) && items.length) {
      left.push(`${where}: not moved. Figures already has text, so the old list is ignored. Delete the old figures in the editor.`);
      return;
    }
    const reason = blocker(items);
    if (reason) {
      left.push(`${where}: not moved. ${reason}`);
      return;
    }
    let body = "";
    let placeholder = text(section.placeholder);
    if (items.some((item) => text(item.image))) {
      body = `${items.flatMap(figureBlocks).join("\n\n")}\n`;
      const prompts = items.map((item) => text(item.placeholder)).filter((prompt, at) => prompt && prompt !== defaultPrompt(items[at], heading));
      const kept = prompts.length === 1 && items.length === 1 && !placeholder;
      if (kept) placeholder = prompts[0];
      const lost = kept ? [] : prompts;
      const carried = [
        items.some((item) => text(item.title)) && "title",
        items.some((item) => text(item.caption)) && "caption",
        items.some((item) => text(item.sourceLabel)) && "source link",
      ].filter(Boolean);
      changes.push(
        `${where}: ${plural(items.length, "figure")} moved to the body${carried.length ? ` (kept: ${carried.join(", ")})` : ""}${lost.length ? `. Not kept, the page never showed ${plural(lost.length, "prompt")}: ${lost.join("; ")}` : ""}`
      );
    } else if (items.length) {
      const prompts = items.map((item) => text(item.placeholder) || text(item.title)).filter(Boolean).join(". ");
      const moved = !placeholder && prompts !== defaultPrompt(items[0], heading);
      if (moved) placeholder = prompts;
      changes.push(`${where}: ${plural(items.length, "prompt")} ${moved ? "moved to the section's placeholder" : "removed, because the page shows the same prompt itself"}`);
    } else {
      changes.push(`${where}: empty list removed`);
    }
    // The body takes the list's place among the section's keys, so a diff shows one swap.
    const next = {};
    for (const [key, value] of Object.entries(section)) {
      if (key === "items") {
        if (body) next.body = body;
        if (placeholder) next.placeholder = placeholder;
      } else if (key !== "body" && key !== "placeholder") next[key] = value;
    }
    document.sections[index] = next;
  });
  return { changes, left };
}

let changedFiles = 0;
let checkedFiles = 0;
let leftSections = 0;
for (const folder of FOLDERS) {
  let names = [];
  try {
    names = readdirSync(join(root, folder)).filter((name) => name.endsWith(".json")).sort();
  } catch {
    continue;
  }
  for (const name of names) {
    const path = join(root, folder, name);
    checkedFiles += 1;
    const document = JSON.parse(readFileSync(path, "utf8"));
    const figures = migrateFigures(document);
    const changes = [...migrateRetro(document), ...figures.changes];
    leftSections += figures.left.length;
    if (!changes.length && !figures.left.length) continue;
    console.log(relative(root, path));
    changes.forEach((change) => console.log(`  ${change}`));
    figures.left.forEach((line) => console.log(`  ${line}`));
    if (!changes.length) continue;
    changedFiles += 1;
    if (!dryRun) writeFileSync(path, `${JSON.stringify(document, null, 2)}\n`);
  }
}

const left = leftSections ? ` ${plural(leftSections, "section")} left as ${leftSections === 1 ? "it is" : "they are"}.` : "";
console.log(
  changedFiles
    ? `${dryRun ? "Would change" : "Changed"} ${changedFiles} of ${checkedFiles} files.${left}`
    : `Nothing to change in ${checkedFiles} files.${left}`
);
