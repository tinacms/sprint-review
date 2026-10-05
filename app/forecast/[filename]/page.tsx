import SprintForecastPage from "./client-page";
import client from "../../../tina/__generated__/client";
import { getSettings } from "../../../lib/settings";
import { reviewBefore } from "../../../lib/sibling";

// The CMS writes the content file while the dev server is running, so never serve a cached copy.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function Page({ params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const [data, settings] = await Promise.all([
    client.queries.sprintForecast({ relativePath: `${filename}.json` }),
    getSettings(),
  ]);
  const sibling = await reviewBefore(data.data.sprintForecast.number);

  return <SprintForecastPage {...data} settings={settings} sibling={sibling} />;
}
