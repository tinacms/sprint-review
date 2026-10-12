"use client";
import React from "react";
import { useTina } from "tinacms/dist/react";
import type { SprintReviewQuery } from "../../../tina/__generated__/types";
import { Sheet } from "../../../components/email/primitives";
import { RetroSection, References } from "../../../components/sprint/closing";
import { Details } from "../../../components/sprint/details";
import { Goals } from "../../../components/sprint/goals";
import { Footer, Masthead, Signature, SprintActions, SprintFooterLinks } from "../../../components/sprint/sprint-frame";
import { Sections, isEmpty } from "../../../components/sprint/sections";
import type { Settings } from "../../../lib/settings";
import type { SiblingLink } from "../../../lib/sibling";
import { hasSection, withoutBlank } from "../../../lib/sections";

interface ClientPageProps {
  query: string;
  variables: { relativePath: string };
  data: SprintReviewQuery;
  settings: Settings;
  sibling: SiblingLink;
}

export default function SprintReviewPage(props: ClientPageProps) {
  const { data } = useTina({
    query: props.query,
    variables: props.variables,
    data: props.data,
  });

  const { settings } = props;
  const review = data.sprintReview;
  // An older document may carry its own Sprint Details or References section; that one wins once it has content.
  const ownDetails = hasSection(review.sections, "Sprint Details", isEmpty);
  const ownReferences = hasSection(review.sections, "References", isEmpty);

  return (
    <div className="review">
      <SprintActions
        doc={review}
        sibling={props.sibling}
        defaultSubject={`${settings.teamName} - Sprint ${review.number} Review + Retro`}
      />

      <div className="sheet-host">
        <Sheet after={<Signature signature={settings.signature} />}>
          <Masthead doc={review} settings={settings} title={`${settings.teamName} - Sprint ${review.number} Review + Retro`} />
          <Goals doc={review} kind="review" githubOwner={settings.githubOwner} />
          {ownDetails ? null : <Details doc={review} kind="review" settings={settings} committedPoints={0} />}
          <Sections sections={withoutBlank(review.sections, isEmpty)} kind="review" githubOwner={settings.githubOwner} sprintNumber={review.number} />
          <RetroSection doc={review} />
          {ownReferences ? null : <References doc={review} kind="review" settings={settings} />}
          <Footer team={settings.teamName} name="Review + Retro" number={review.number} />
        </Sheet>
      </div>

      <SprintFooterLinks sibling={props.sibling} />
    </div>
  );
}
