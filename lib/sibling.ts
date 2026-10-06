import client from "../tina/__generated__/client";

export type SiblingLink = { href: string; label: string } | null;

type Node = { number?: number | null; _sys: { filename: string } } | null | undefined;

// Prefer the canonical sprint-N file, so a test copy of the same sprint never wins over the real one.
const pick = (nodes: Node[], number: number) => {
  const matches = nodes.filter((node) => node?.number === number);
  return matches.find((node) => node?._sys.filename === `sprint-${number}`) ?? matches[0];
};

export async function forecastAfter(reviewNumber?: number | null): Promise<SiblingLink> {
  if (reviewNumber == null) return null;
  const forecasts = await client.queries.sprintForecastConnection();
  const nodes = (forecasts.data?.sprintForecastConnection?.edges ?? []).map((edge) => edge?.node);
  const node = pick(nodes, reviewNumber + 1);
  return node ? { href: `/forecast/${node._sys.filename}`, label: `Sprint ${reviewNumber + 1} forecast →` } : null;
}

export async function reviewBefore(forecastNumber?: number | null): Promise<SiblingLink> {
  if (forecastNumber == null) return null;
  const reviews = await client.queries.sprintReviewConnection();
  const nodes = (reviews.data?.sprintReviewConnection?.edges ?? []).map((edge) => edge?.node);
  const node = pick(nodes, forecastNumber - 1);
  return node ? { href: `/review/${node._sys.filename}`, label: `← Sprint ${forecastNumber - 1} review` } : null;
}
