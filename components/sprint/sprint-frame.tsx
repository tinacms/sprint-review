"use client";
import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { tinaField } from "tinacms/dist/react";
import { Column, Img, Row } from "react-email";
import CopyEmailButton from "./copy-email-button";
import CopyText from "./copy-text";
import { A, Block } from "../email/primitives";
import { caps, colour, label, text } from "../email/theme";
import type { Settings } from "../../lib/settings";
import type { SiblingLink } from "../../lib/sibling";
import { formatDay } from "../../lib/dates";

type SprintDoc = {
  number?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  durationLabel?: string | null;
  productOwner?: string | null;
  recordingUrl?: string | null;
  recordingMinutes?: number | null;
  attendees?: (string | null)[] | null;
  email?: { subject?: string | null; to?: string | null; cc?: string | null } | null;
};

/** The copy controls, kept outside the sheet so none of them land in the email. */
export function SprintActions({
  doc,
  sibling,
  defaultSubject,
}: {
  doc: SprintDoc;
  sibling?: SiblingLink;
  defaultSubject: string;
}) {
  const email = doc.email;
  const pathname = usePathname();
  const field = (name: "subject" | "to" | "cc") => (email ? tinaField(email as any, name) : undefined);

  return (
    <div className="actions" data-copy="skip">
      <CopyEmailButton target="sheet" />
      {/* _top, or clicking it inside the admin's preview opens the admin inside itself. */}
      <a className="admin-link" href={`/admin/index.html#/~${pathname}`} target="_top">
        Edit in Tina
      </a>
      {sibling ? (
        <a className="admin-link" href={sibling.href}>
          {sibling.label}
        </a>
      ) : null}
      <div className="actions-headers">
        <div data-tina-field={field("subject")}>
          <CopyText label="Subject" value={email?.subject || defaultSubject} />
        </div>
        <div data-tina-field={field("to")}>
          <CopyText label="To" value={email?.to ?? ""} />
        </div>
        <div data-tina-field={field("cc")}>
          <CopyText label="Cc" value={email?.cc ?? ""} />
        </div>
      </div>
    </div>
  );
}

export function SprintMasthead({
  doc,
  settings,
  label: eyebrow,
  recordingLabel,
  recordingPending,
}: {
  doc: SprintDoc;
  settings: Settings;
  label: string;
  recordingLabel: string;
  recordingPending: string;
}) {
  const facts: { name: string; value: React.ReactNode; field?: string }[] = [
    { name: "Product Owner", value: doc.productOwner, field: tinaField(doc as any, "productOwner") },
    ...(settings.boardUrl
      ? [{ name: settings.boardHeading || "Board", value: <A href={settings.boardUrl}>{settings.boardLabel || "Sprint board"}</A> }]
      : []),
    {
      name: settings.recordingHeading || "Recording",
      value: doc.recordingUrl ? (
        <A href={doc.recordingUrl}>
          {recordingLabel}
          {doc.recordingMinutes ? ` (${Math.round(doc.recordingMinutes)} min)` : null}
        </A>
      ) : (
        <span style={{ color: colour.inkFaint, fontStyle: "italic" }}>{recordingPending}</span>
      ),
      field: tinaField(doc as any, "recordingUrl"),
    },
    {
      name: "Attendees",
      value: (doc.attendees ?? []).map((name, index) => (
        <React.Fragment key={index}>
          {index > 0 ? ", " : null}
          <span data-tina-field={tinaField(doc as any, "attendees", index)}>{name}</span>
        </React.Fragment>
      )),
      field: doc.attendees?.length ? undefined : tinaField(doc as any, "attendees"),
    },
  ];
  const rows = facts.reduce<(typeof facts)[]>((pairs, fact, index) => {
    if (index % 2 === 0) pairs.push([fact]);
    else pairs[pairs.length - 1].push(fact);
    return pairs;
  }, []);

  return (
    <Block style={{ paddingBottom: "18px", borderBottom: `2px solid ${colour.ink}` }}>
      <Row style={{ width: "100%", borderCollapse: "collapse" }}>
        <Column style={{ verticalAlign: "middle" }}>
          {settings.logo ? (
            <Img
              src={settings.logo}
              alt={settings.teamName}
              width={settings.logoWidth || 160}
              style={{ display: "block", height: "auto" }}
            />
          ) : (
            <p style={text(22, colour.ink, { fontWeight: 650, letterSpacing: "-0.01em", lineHeight: 1.2 })}>
              {settings.teamName}
            </p>
          )}
        </Column>
        <Column
          style={{ ...label, fontSize: "12.5px", letterSpacing: "0.09em", textAlign: "right", verticalAlign: "bottom", paddingBottom: "5px" }}
        >
          {caps(eyebrow)}
        </Column>
      </Row>
      <h1
        data-tina-field={tinaField(doc as any, "number")}
        style={text(56, colour.ink, { fontWeight: 640, letterSpacing: "-0.035em", lineHeight: 1.05, margin: "9px 0 2px" })}
      >
        Sprint {doc.number} {eyebrow.replace(/^Sprint /, "")}
      </h1>
      <p style={text(16, colour.inkSoft, { marginBottom: "20px" })}>
        {[[formatDay(doc.startDate), formatDay(doc.endDate)].filter(Boolean).join(" to "), doc.durationLabel]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map((pair, index) => (
            <tr key={index}>
              {pair.map((fact) => (
                <td
                  key={fact.name}
                  data-tina-field={fact.field}
                  colSpan={pair.length === 1 ? 2 : undefined}
                  style={{ width: pair.length === 1 ? "100%" : "50%", padding: "0 24px 11px 0", verticalAlign: "top" }}
                >
                  <p style={{ ...label, paddingBottom: "3px" }}>{caps(fact.name)}</p>
                  <p style={text()}>{fact.value}</p>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Block>
  );
}

// Settings are edited by the team but shown to every viewer, so only plain markup survives.
const cleanHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, iframe, object, embed, link, meta, base, form").forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((element) => {
    for (const { name, value } of Array.from(element.attributes)) {
      if (name.startsWith("on") || /^javascript:/i.test(value.replace(/[\u0000- ]/g, ""))) element.removeAttribute(name);
    }
  });
  return doc.body.innerHTML;
};

/** Rendered only in the copied email, below the sheet's last section. */
export function Signature({ signature }: { signature?: string | null }) {
  const html = signature?.trim().startsWith("<") ? signature : null;
  const holder = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (holder.current && html) holder.current.innerHTML = cleanHtml(html);
  }, [html]);

  if (html) return <div ref={holder} data-copy="only" style={{ display: "none" }} />;
  const lines = (signature ?? "").split("\n").filter((line) => line.trim());
  if (!lines.length) return null;
  return (
    <div data-copy="only" style={{ display: "none" }}>
      <Block top={40}>
        {lines.map((line, index) => (
          <p key={index} style={text(14.4, index === 0 ? colour.ink : colour.inkSoft, index === 0 ? { fontWeight: 600 } : {})}>
            {line}
          </p>
        ))}
      </Block>
    </div>
  );
}
