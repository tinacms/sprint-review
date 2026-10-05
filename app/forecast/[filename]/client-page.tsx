"use client";
import React from "react";
import { tinaField, useTina } from "tinacms/dist/react";
import type { SprintForecastQuery } from "../../../tina/__generated__/types";
import { statusMeta } from "../../../components/sprint/status";
import { Block, H2, Pending, Section, Sheet } from "../../../components/email/primitives";
import { colour, text } from "../../../components/email/theme";
import { Signature, SprintActions, SprintMasthead } from "../../../components/sprint/sprint-frame";
import { Sections } from "../../../components/sprint/sections";
import type { Settings } from "../../../lib/settings";
import type { SiblingLink } from "../../../lib/sibling";
import { linkify } from "../../../lib/refs";

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

  return (
    <div className="review">
      <SprintActions
        doc={forecast}
        sibling={props.sibling}
        defaultSubject={`${settings.teamName} Sprint ${forecast.number} Forecast`}
      />

      <div className="sheet-host">
        <Sheet>
          <SprintMasthead
            doc={forecast}
            settings={settings}
            label="Sprint Forecast"
            recordingLabel="Watch the planning"
            recordingPending="Added after Planning"
          />

          <Section first>
            <H2>Sprint Goals</H2>
            {forecast.goals?.length ? (
              forecast.goals.map((goal, index) => (
                <Block key={index} bottom={10}>
                  <table
                    data-tina-field={goal ? tinaField(goal) : undefined}
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      backgroundColor: colour.paper,
                      border: `1px solid ${colour.line}`,
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={text(16, colour.ink, { width: "35px", padding: "14px 0 14px 14px", verticalAlign: "top" })}>
                          {statusMeta("backlog").icon}
                        </td>
                        <td
                          data-tina-field={goal ? tinaField(goal, "text") : undefined}
                          style={text(16, colour.ink, { padding: "14px 16px 14px 0", verticalAlign: "top" })}
                        >
                          {linkify(goal?.text ?? "", settings.githubOwner)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Block>
              ))
            ) : (
              <div data-tina-field={tinaField(forecast, "goals")}>
                <Pending>Set at Sprint Planning</Pending>
              </div>
            )}
          </Section>

          {forecast.scopeNote ? (
            <Section>
              <p data-tina-field={tinaField(forecast, "scopeNote")} style={text(16, colour.inkSoft)}>
                {forecast.scopeNote}
              </p>
            </Section>
          ) : null}

          <Sections sections={forecast.sections} kind="forecast" githubOwner={settings.githubOwner} />

          <Signature signature={settings.signature} />
        </Sheet>
      </div>
    </div>
  );
}
