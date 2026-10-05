export const STATUS_META: Record<string, { label: string; icon: string }> = {
  done: { label: "Done", icon: "✅" },
  inReview: { label: "In review", icon: "👀" },
  inProgress: { label: "In progress", icon: "🏗" },
  blocked: { label: "Blocked", icon: "🚧" },
  backlog: { label: "Backlog", icon: "📋" },
  wontDo: { label: "Won't do", icon: "❌" },
  missed: { label: "Missed", icon: "❌" },
};

export const statusMeta = (status?: string | null) =>
  STATUS_META[status ?? "backlog"] ?? STATUS_META.backlog;
