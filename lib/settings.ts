import client from "../tina/__generated__/client";

export type Settings = {
  teamName: string;
  logo?: string | null;
  logoWidth?: number | null;
  boardHeading?: string | null;
  boardLabel?: string | null;
  boardUrl?: string | null;
  recordingHeading?: string | null;
  githubOwner?: string | null;
  signature?: string | null;
};

export async function getSettings(): Promise<Settings> {
  const { data } = await client.queries.settings({ relativePath: "settings.json" });
  const { teamName, logo, logoWidth, boardHeading, boardLabel, boardUrl, recordingHeading, githubOwner, signature } =
    data.settings;
  return { teamName, logo, logoWidth, boardHeading, boardLabel, boardUrl, recordingHeading, githubOwner, signature };
}
