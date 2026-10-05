export const MEETING_FIELDS = ["attendees", "recordingUrl", "recordingMinutes", "productOwner"] as const;

// Review N and forecast N+1 share one meeting. Posting the saved values here copies them to the other page.
export const meetingSync =
  (from: "review" | "forecast") =>
  async ({ values, form }: { values: Record<string, unknown>; form?: { crudType?: string } }) => {
    // A new document has no meeting fields yet, and syncing them would blank the sibling's.
    if (form?.crudType === "create") return values;
    const body: Record<string, unknown> = { from, number: values.number };
    for (const field of MEETING_FIELDS) body[field] = values[field] ?? null;
    try {
      await fetch("/api/meeting-sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch {
      // A failed sync must never block the save itself.
    }
    return values;
  };
