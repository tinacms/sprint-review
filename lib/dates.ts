const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// SSW writes September as Sept.
const MONTHS_SSW = MONTHS.map((month) => (month === "Sep" ? "Sept" : month));
const DAY_MS = 24 * 60 * 60 * 1000;

// Dates are stored as UTC midnight, so read UTC parts or a timezone shifts the Sprint by a day.
export const formatDay = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return `${DAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

/** 15 Sept 2026 */
export const formatDate = (value?: string | Date | null) => {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getUTCDate()} ${MONTHS_SSW[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

/** 15 Sept 2026 - 21 Sept 2026 */
export const formatRange = (start?: string | null, end?: string | null) =>
  [formatDate(start), formatDate(end)].filter(Boolean).join(" - ");

/** Days in the Sprint, counting both the first and the last. */
export const calendarDays = (start?: string | null, end?: string | null) =>
  start && end ? Math.round((new Date(end).getTime() - new Date(start).getTime()) / DAY_MS) + 1 : null;

/** Today in the reader's own timezone, as a date the formatters above can take. */
export const today = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};
