import React from "react";
import { A } from "../components/email/primitives";
import { link } from "../components/email/theme";
import { ISSUE_REF, issueUrl } from "./issue-ref";

const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

export function linkifyRefs(text: string, githubOwner?: string | null, keyPrefix = "") {
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(ISSUE_REF)) {
    const [ref, owner = githubOwner, repo, number] = match;
    if (!owner) continue;
    parts.push(text.slice(cursor, match.index));
    parts.push(
      <a key={`${keyPrefix}${match.index}-${ref}`} href={issueUrl(owner, repo, number)} style={link}>
        {ref}
      </a>
    );
    cursor = (match.index ?? 0) + ref.length;
  }
  parts.push(text.slice(cursor));

  return parts;
}

/** Issue references plus [label](https://...) links. */
export function linkify(text: string, githubOwner?: string | null) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(MARKDOWN_LINK)) {
    const [whole, label, href] = match;
    parts.push(...linkifyRefs(text.slice(cursor, match.index), githubOwner, `${cursor}:`));
    parts.push(
      <A key={`link-${match.index}`} href={href}>
        {label}
      </A>
    );
    cursor = (match.index ?? 0) + whole.length;
  }
  parts.push(...linkifyRefs(text.slice(cursor), githubOwner, `${cursor}:`));

  return parts;
}

// Jira and Linear style keys: ABC-123.
const TRACKER_KEY = /\b[A-Z][A-Z0-9]+-\d+\b/;

/** What the backlog ID column shows: a typed ID, else one read from the link, else the word Link. Never the whole URL. */
export function itemId(item: { id?: string | null; url?: string | null }) {
  if (item.id?.trim()) return item.id.trim();
  const url = item.url?.trim();
  if (!url) return null;
  const github = url.match(/github\.com\/[^/]+\/([^/]+)\/(?:issues|pull)\/(\d+)/);
  if (github) return `${github[1].replace(/^SSW\./, "")}#${github[2]}`;
  const segments = url
    .split(/[?#]/)[0]
    .replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, "")
    .split("/")
    .filter(Boolean);
  // A number after "projects" or "views" is a GitHub Projects board or view, not an item.
  const numeric = [...segments]
    .reverse()
    .find((segment, index, reversed) => /^\d+$/.test(segment) && !/^(projects|views)$/i.test(reversed[index + 1] ?? ""));
  if (numeric) return `#${numeric}`;
  return segments.join("/").match(TRACKER_KEY)?.[0] ?? "Link";
}
