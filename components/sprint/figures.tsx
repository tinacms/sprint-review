"use client";
import React from "react";
import { Block, Figure, H3 } from "../email/primitives";
import { RichText } from "../email/rich-text";
import { figureParts, isFigureBodyEmpty } from "../../lib/figures";
import type { RichTextValue } from "../../lib/rich-text";
import { field, spaced, type Maybe, type SectionBlock, type SectionRenderer } from "./section-kit";

// A figure as the list stored it before the body: one item with its own title, image, caption and source.
type OldFigure = {
  title?: Maybe<string>;
  image?: Maybe<string>;
  caption?: RichTextValue;
  sourceLabel?: Maybe<string>;
  sourceUrl?: Maybe<string>;
  placeholder?: Maybe<string>;
};

/** Empty when the body draws nothing and no item of the old list has a picture. */
export const isFiguresEmpty = (section: SectionBlock) =>
  isFigureBodyEmpty(section.body) && !(section.items ?? []).some((item) => item?.image);

// The 16px between parts, the same as between two figures of the old list.
const PART_GAP = 16;

function FigureBody({ value, tinaField }: { value: RichTextValue; tinaField?: string }) {
  return (
    <>
      {figureParts(value).map((part, index) => (
        <Block key={index} top={index ? PART_GAP : 0} tinaField={tinaField}>
          {part.title ? <H3 top={0}>{part.title}</H3> : null}
          {part.picture ? (
            <Figure
              image={part.picture.url}
              alt={part.picture.alt}
              caption={part.picture.caption ? { type: "root", children: [part.picture.caption] } : undefined}
              captionField={tinaField}
            />
          ) : null}
          {part.blocks ? <RichText value={{ type: "root", children: part.blocks }} gap={12} size={16} /> : null}
        </Block>
      ))}
    </>
  );
}

// A section saved before the body existed keeps drawing its list until the migration moves it.
function OldFigures({ section }: { section: SectionBlock }) {
  const items: Maybe<OldFigure>[] = section.items ?? [];
  const heading = section.heading || "Figure";
  const gaps = spaced(items.map((item) => !item?.image));
  return (
    <>
      {items.map((item, index) => (
        <Block
          key={index}
          top={gaps[index].top}
          bottom={gaps[index].bottom}
          tinaField={field(item)}
          copy={item?.image ? undefined : "empty"}
          label={item?.title ? `${heading}: ${item.title}` : heading}
        >
          {item?.title ? (
            <H3 top={0} tinaField={field(item, "title")}>
              {item.title}
            </H3>
          ) : null}
          <Figure
            image={item?.image}
            caption={item?.caption}
            sourceLabel={item?.sourceLabel}
            sourceUrl={item?.sourceUrl}
            captionField={field(item, "caption")}
            pending={item?.placeholder || (item?.title ? `Paste ${item.title} screenshot in the editor` : `Paste screenshot of ${heading} in the editor`)}
          />
        </Block>
      ))}
    </>
  );
}

export const Figures: SectionRenderer = ({ section }) => {
  const heading = section.heading || "Figure";
  if (!isFigureBodyEmpty(section.body)) return <FigureBody value={section.body} tinaField={field(section, "body")} />;
  if (section.items?.length) return <OldFigures section={section} />;
  return (
    <Block tinaField={field(section, "body")}>
      <Figure pending={section.placeholder || `Paste screenshot of ${heading} in the editor`} />
    </Block>
  );
};
