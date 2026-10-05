import React from "react";
import { A } from "../components/email/primitives";
import { link } from "../components/email/theme";

// "web#42" links into the team's GitHub owner; "acme/web#42" names its owner.
const ISSUE_REF = /\b(?:([\w.-]+)\/)?([\w.-]+)#(\d+)\b/g;
const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

export function linkifyRefs(text: string, githubOwner?: string | null, keyPrefix = "") {
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(ISSUE_REF)) {
    const [ref, owner = githubOwner, repo, number] = match;
    if (!owner) continue;
    parts.push(text.slice(cursor, match.index));
    parts.push(
      <a key={`${keyPrefix}${match.index}-${ref}`} href={`https://github.com/${owner}/${repo}/issues/${number}`} style={link}>
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
