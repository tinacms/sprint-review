"use client";
import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { tinaField } from "tinacms/dist/react";
import { Img } from "react-email";
import CopyEmailButton from "./copy-email-button";
import CopyText from "./copy-text";
import { Block } from "../email/primitives";
import { colour, text } from "../email/theme";
import type { Settings } from "../../lib/settings";
import type { SiblingLink } from "../../lib/sibling";
import { formatDate, formatRange, today as todayLocal } from "../../lib/dates";
import { LOGO_ALT } from "../../lib/ssw";

export type SprintDoc = {
  number?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  workingDays?: number | null;
  publicHolidays?: (string | null)[] | null;
  durationLabel?: string | null;
  productOwner?: string | null;
  recordingUrl?: string | null;
  recordingMinutes?: number | null;
  attendees?: (string | null)[] | null;
  references?: ({ label?: string | null; url?: string | null } | null)[] | null;
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
  const field = (name: "subject" | "to" | "cc") => (email ? tinaField(email as any, name) : undefined);

  return (
    <div className="actions" data-copy="skip">
      <CopyEmailButton target="sheet" />
      <PageLinks sibling={sibling} />
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

// The llama from tina.io's own edit link (tinacms/tina.io components/AdminLink.tsx).
function TinaIcon() {
  return (
    <svg viewBox="0 0 49 68" aria-hidden="true">
      <path d="M31.4615 30.1782C34.763 27.4475 36.2259 11.3098 37.6551 5.50906C39.0843 -0.291715 44.995 0.00249541 44.995 0.00249541C44.995 0.00249541 43.4605 2.67299 44.0864 4.66584C44.7123 6.65869 49 8.44005 49 8.44005L48.0752 10.8781C48.0752 10.8781 46.1441 10.631 44.995 12.9297C43.8459 15.2283 45.7336 37.9882 45.7336 37.9882C45.7336 37.9882 38.8271 51.6106 38.8271 57.3621C38.8271 63.1136 41.5495 67.9338 41.5495 67.9338H37.7293C37.7293 67.9338 32.1252 61.2648 30.9759 57.9318C29.8266 54.5988 30.2861 51.2658 30.2861 51.2658C30.2861 51.2658 24.1946 50.921 18.7931 51.2658C13.3915 51.6106 9.78922 56.2539 9.13908 58.8512C8.48894 61.4486 8.21963 67.9338 8.21963 67.9338H5.19906C3.36057 62.2603 1.90043 60.2269 2.69255 57.3621C4.88665 49.4269 4.45567 44.9263 3.94765 42.9217C3.43964 40.9172 0 39.1676 0 39.1676C1.68492 35.7349 3.4048 34.0854 10.8029 33.9133C18.201 33.7413 28.1599 32.9088 31.4615 30.1782Z" />
      <path d="M12.25 57.03C12.25 57.03 13.0305 64.2533 17.1773 67.9342H20.7309C17.1773 63.9085 16.7897 53.415 16.7897 53.415C14.9822 54.0035 12.4799 56.1106 12.25 57.03Z" />
    </svg>
  );
}

function PageLinks({ sibling }: { sibling?: SiblingLink }) {
  const pathname = usePathname();
  return (
    <>
      {/* _top, or clicking it inside the admin's preview opens the admin inside itself. */}
      <a className="edit-link" href={`/admin/index.html#/~${pathname}`} target="_top" aria-label="Edit in Tina">
        <TinaIcon />
        Edit ✏️
      </a>
      {sibling ? (
        <a className="admin-link" href={sibling.href}>
          {sibling.label}
        </a>
      ) : null}
    </>
  );
}

/** The same page links again under the sheet, so a long page needs no scroll back up. */
export function SprintFooterLinks({ sibling }: { sibling?: SiblingLink }) {
  return (
    <div className="actions actions-bottom" data-copy="skip">
      <PageLinks sibling={sibling} />
    </div>
  );
}

// NOTE: [12 Oct 2026] EK - The title and dates are text in a span that Copy for Email redraws as a PNG
// with the band colour baked in. Outlook Web recolours text on a dark background, and flattens a
// transparent PNG against white, so the picture carries the background itself.
const raster = (size: number, colourValue: string, weight: number, leading: number) => ({
  "data-raster": "",
  "data-raster-size": size,
  "data-raster-colour": colourValue,
  "data-raster-weight": weight,
  "data-raster-leading": leading,
  "data-raster-bg": colour.band,
});

/** The dark band: title and dates on the left, the logo on the right. */
export function Masthead({ doc, settings, title }: { doc: SprintDoc; settings: Settings; title: string }) {
  const dates = formatRange(doc.startDate, doc.endDate);
  const logoWidth = settings.logoWidth || 80;
  return (
    <Block pad="24px 32px" bgcolor={colour.band} style={{ backgroundColor: colour.band, borderBottom: `2px solid ${colour.accent}` }}>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: "middle" }}>
              <h1
                data-tina-field={tinaField(doc as any, "number")}
                style={text(32, "#ffffff", { fontWeight: 700, lineHeight: 1.2, margin: "0 0 4px" })}
              >
                <span {...raster(32, "#ffffff", 700, 1.2)} style={{ display: "inline-block" }}>
                  {title}
                </span>
              </h1>
              <p
                data-copy={dates ? undefined : "skip"}
                data-tina-field={tinaField(doc as any, "startDate")}
                style={text(16, colour.bandSub, { lineHeight: 1.4 })}
              >
                {dates ? (
                  <span {...raster(16, colour.bandSub, 400, 1.4)} style={{ display: "inline-block" }}>
                    {dates}
                  </span>
                ) : (
                  "Set the Sprint start and end dates"
                )}
              </p>
            </td>
            {settings.logo ? (
              <td width={logoWidth} style={{ verticalAlign: "middle", textAlign: "right" }}>
                <Img src={settings.logo} alt={LOGO_ALT} width={logoWidth} data-raster-bg={colour.band} style={{ display: "block" }} />
              </td>
            ) : null}
          </tr>
        </tbody>
      </table>
    </Block>
  );
}

/** The grey band that closes the card. */
export function Footer({ team, name, number }: { team: string; name: string; number?: number | null }) {
  const [today, setToday] = useState("");
  // Set after mount, or the server's date and the browser's would differ.
  useEffect(() => setToday(formatDate(todayLocal())), []);
  return (
    <Block pad="16px 32px" bgcolor={colour.chip} style={{ backgroundColor: colour.chip }}>
      <p style={text(12, colour.inkSoft, { textAlign: "center" })}>
        {team} {"\u2022"} Sprint {number} {name}
        {today ? ` \u2022 Generated on ${today} with v${process.env.NEXT_PUBLIC_SITE_VERSION ?? ""}` : null}
      </p>
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

/** Rendered only in the copied email, below the card. */
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
