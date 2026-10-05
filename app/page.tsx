import Link from "next/link";
import client from "../tina/__generated__/client";
import { formatDay } from "../lib/dates";
import { getSettings } from "../lib/settings";
import { backlogOf, backlogPoints } from "../lib/sections";

// The CMS writes the content file while the dev server is running, so never serve a cached copy.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type Doc = { sections?: Parameters<typeof backlogOf>[0] } | null | undefined;

const points = (doc: Doc, status?: string) => backlogPoints(backlogOf(doc?.sections)?.items ?? [], status);

export default async function Home() {
  const [settings, reviews, forecasts] = await Promise.all([
    getSettings(),
    client.queries.sprintReviewConnection(),
    client.queries.sprintForecastConnection(),
  ]);
  const reviewNodes = (reviews.data?.sprintReviewConnection?.edges ?? []).map((edge) => edge?.node);
  const forecastNodes = (forecasts.data?.sprintForecastConnection?.edges ?? []).map((edge) => edge?.node);
  // A Sprint's review and the next Sprint's forecast share one meeting: the review day.
  const reviewDay = (review: (typeof reviewNodes)[number]) => review?.endDate ?? "";
  const forecastDay = (forecast: (typeof forecastNodes)[number]) => forecast?.startDate ?? "";
  const days = [...new Set([...reviewNodes.map(reviewDay), ...forecastNodes.map(forecastDay)])].sort((a, b) =>
    b.localeCompare(a)
  );

  return (
    <div className="index">
      <h1>{settings.teamName} Sprint Reviews</h1>
      <p className="index-lead">
        The review, retro and forecast for every Sprint, edited in Tina and copied into an email.
      </p>

      {days.length ? null : (
        <p className="index-lead">
          No Sprints yet. <a href="/admin/index.html">Open Tina</a> and add a Sprint Review.
        </p>
      )}

      {days.map((day) => (
        <section key={day}>
          <h2 className="index-group">{formatDay(day) || "Undated"}</h2>
          <ul className="index-list">
            {reviewNodes
              .filter((review) => reviewDay(review) === day)
              .map((review) => (
                <li key={review!.id}>
                  <Link href={`/review/${review!._sys.filename}`}>
                    <span className="index-number">Sprint {review!.number} Review + Retro</span>
                    <span className="index-meta">
                      {points(review, "done")} of {points(review)} points closed
                    </span>
                  </Link>
                </li>
              ))}
            {forecastNodes
              .filter((forecast) => forecastDay(forecast) === day)
              .map((forecast) => (
                <li key={forecast!.id}>
                  <Link href={`/forecast/${forecast!._sys.filename}`}>
                    <span className="index-number">Sprint {forecast!.number} Forecast</span>
                    <span className="index-meta">{points(forecast)} points forecast</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
