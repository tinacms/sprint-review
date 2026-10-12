"use client";
import React from "react";
import { useTina } from "tinacms/dist/react";
import type { SprintForecastQuery } from "../../../tina/__generated__/types";
import { Sheet } from "../../../components/email/primitives";
import { References } from "../../../components/sprint/closing";
import { Details } from "../../../components/sprint/details";
import { Goals, Intro } from "../../../components/sprint/goals";
import { Footer, Masthead, Signature, SprintActions, SprintFooterLinks } from "../../../components/sprint/sprint-frame";
import { Sections, isEmpty } from "../../../components/sprint/sections";
import type { Settings } from "../../../lib/settings";
import type { SiblingLink } from "../../../lib/sibling";
import { backlogOf, backlogPoints, hasSection, withoutBlank } from "../../../lib/sections";

interface ClientPageProps {
  query: string;
  variables: { relativePath: string };
  data: SprintForecastQuery;
  settings: Settings;
  sibling: SiblingLink;
}

export default function SprintForecastPage(props: ClientPageProps) {
  const { data } = useTina({
    query: props.query,
    variables: props.variables,
    data: props.data,
  });

  const { settings } = props;
  const forecast = data.sprintForecast;
  const committedPoints = backlogPoints(backlogOf(forecast.sections)?.items ?? []);
  // An older document may carry its own Sprint Details or References section; that one wins once it has content.
  const ownDetails = hasSection(forecast.sections, "Sprint Details", isEmpty);
  const ownReferences = hasSection(forecast.sections, "References", isEmpty);

  return (
    <div className="review">
      <SprintActions
        doc={forecast}
        sibling={props.sibling}
        defaultSubject={`${settings.teamName} - Sprint ${forecast.number} Forecast`}
      />

      <div className="sheet-host">
        <Sheet after={<Signature signature={settings.signature} />}>
          <Masthead doc={forecast} settings={settings} title={`${settings.teamName} - Sprint ${forecast.number} Forecast`} />
          <Intro doc={forecast} />
          <Goals doc={forecast} kind="forecast" githubOwner={settings.githubOwner} />
          {ownDetails ? null : <Details doc={forecast} kind="forecast" settings={settings} committedPoints={committedPoints} />}
          <Sections sections={withoutBlank(forecast.sections, isEmpty)} kind="forecast" githubOwner={settings.githubOwner} sprintNumber={forecast.number} />
          {ownReferences ? null : <References doc={forecast} kind="forecast" settings={settings} />}
          <Footer team={settings.teamName} name="Forecast" number={forecast.number} />
        </Sheet>
      </div>

      <SprintFooterLinks sibling={props.sibling} />
    </div>
  );
}
