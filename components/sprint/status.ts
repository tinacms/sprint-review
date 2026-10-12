import { GOAL_BADGES, STATUS_BADGES } from "../email/theme";

/** The badge for a backlog item status; an unknown or blank one reads as Backlog. */
export const statusBadge = (status?: string | null) => STATUS_BADGES[status ?? ""] ?? STATUS_BADGES.backlog;

// Goals saved before the four outcomes existed carry a backlog status. They still render.
const LEGACY_GOAL_STATUS: Record<string, keyof typeof GOAL_BADGES> = {
  wontDo: "missed",
  inReview: "partial",
  inProgress: "partial",
  blocked: "partial",
  backlog: "suggested",
};

/** The goal outcome to show: a current one as stored, an old one mapped, a blank one as suggested. */
export const goalKey = (status?: string | null): keyof typeof GOAL_BADGES => {
  if (status && status in GOAL_BADGES) return status as keyof typeof GOAL_BADGES;
  return LEGACY_GOAL_STATUS[status ?? ""] ?? "suggested";
};
