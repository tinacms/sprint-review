"use client";
import React from "react";
import { tinaField } from "tinacms/dist/react";
import { A, DetailsTable, type DetailRow, H2, Section } from "../email/primitives";
import { calendarDays, formatDate, formatRange } from "../../lib/dates";
import { DEFAULT_PORTAL_HEADING, DEFAULT_RECORDING_HEADING } from "../../lib/ssw";
import type { Settings } from "../../lib/settings";
import type { SprintDoc } from "./sprint-frame";
import { plural, present, type Maybe, type SprintKind } from "./section-kit";

type DetailsDoc = SprintDoc & { capacity?: Maybe<string>; reviewDate?: Maybe<string> };

function duration(doc: SprintDoc) {
  const range = formatRange(doc.startDate, doc.endDate);
  if (!range) return "";
  const days = calendarDays(doc.startDate, doc.endDate);
  if (doc.workingDays != null && days != null) {
    const holidays = present(doc.publicHolidays).length;
    const note = holidays ? `, ${plural(holidays, "public holiday")}` : "";
    return `${range} (${plural(days, "calendar day")} / ${plural(doc.workingDays, "working day")}${note})`;
  }
  return doc.durationLabel ? `${range} (${doc.durationLabel})` : range;
}

const recordingLink = (doc: SprintDoc, label: string) => (
  <A href={doc.recordingUrl}>
    {label}
    {doc.recordingMinutes ? ` (${Math.round(doc.recordingMinutes)} min)` : null}
  </A>
);

/** Sprint Details: the facts of the Sprint as label and value pairs. */
export function Details({
  doc,
  kind,
  settings,
  committedPoints,
}: {
  doc: DetailsDoc;
  kind: SprintKind;
  settings: Settings;
  /** The forecast's total of backlog efforts. */
  committedPoints: number;
}) {
  const review = kind === "review";
  const attendees = present(doc.attendees);
  const holidays = present(doc.publicHolidays).map((holiday) => holiday.text);
  const durationText = duration(doc);

  const sprint: DetailRow = { label: "Sprint", value: doc.number, field: tinaField(doc as any, "number"), empty: doc.number == null, prompt: "Set the Sprint number" };
  const durationRow: DetailRow = {
    label: "Duration",
    value: durationText,
    field: tinaField(doc as any, "startDate"),
    empty: !durationText,
    prompt: "Set the Sprint start and end dates",
  };
  const project: DetailRow[] = settings.teamName ? [{ label: "Project", value: settings.teamName }] : [];
  const portal: DetailRow[] = settings.boardUrl
    ? [
        {
          label: settings.boardHeading || DEFAULT_PORTAL_HEADING,
          value: <A href={settings.boardUrl}>{settings.boardLabel || settings.boardUrl}</A>,
        },
      ]
    : [];
  const productOwner: DetailRow = {
    label: "Product Owner",
    value: doc.productOwner,
    field: tinaField(doc as any, "productOwner"),
    empty: !doc.productOwner?.trim(),
    prompt: "Set the Product Owner",
  };
  const attendeeRow: DetailRow = {
    label: "Attendees",
    value: attendees.map((attendee, position) => (
      <React.Fragment key={attendee.index}>
        {position > 0 ? ", " : null}
        <span data-tina-field={tinaField(doc as any, "attendees", attendee.index)}>{attendee.text}</span>
      </React.Fragment>
    )),
    field: attendees.length ? undefined : tinaField(doc as any, "attendees"),
    empty: !attendees.length,
    prompt: "Add the attendees",
  };

  const rows: DetailRow[] = review
    ? [
        sprint,
        durationRow,
        ...project,
        ...portal,
        productOwner,
        attendeeRow,
        {
          label: settings.recordingHeading || DEFAULT_RECORDING_HEADING,
          value: recordingLink(doc, "Watch the review"),
          field: tinaField(doc as any, "recordingUrl"),
          empty: !doc.recordingUrl,
          prompt: "Paste review recording link here",
        },
      ]
    : [
        sprint,
        durationRow,
        {
          label: "Public Holidays",
          value: holidays.join(", "),
          field: tinaField(doc as any, "publicHolidays"),
          empty: !holidays.length,
          prompt: "Add any public holidays",
        },
        ...project,
        ...portal,
        {
          label: "Capacity",
          value: doc.capacity,
          field: tinaField(doc as any, "capacity"),
          empty: !doc.capacity?.trim(),
          prompt: "Set the capacity",
        },
        { label: "Committed", value: `~${committedPoints} pts`, empty: !committedPoints, prompt: "Add backlog items to total the points" },
        productOwner,
        {
          label: "Sprint Review",
          value: formatDate(doc.reviewDate || doc.endDate),
          field: tinaField(doc as any, "reviewDate"),
          empty: !(doc.reviewDate || doc.endDate),
          prompt: "Set the Sprint Review date",
        },
        attendeeRow,
        ...(doc.recordingUrl
          ? [
              {
                label: "Planning Recording",
                value: recordingLink(doc, "Watch the planning"),
                field: tinaField(doc as any, "recordingUrl"),
              },
            ]
          : []),
      ];

  return (
    <Section>
      <H2>Sprint Details</H2>
      <DetailsTable rows={rows} />
    </Section>
  );
}
