import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { MEETING_FIELDS } from "../../../lib/meeting";

export const dynamic = "force-dynamic";

// Review N and forecast N+1 are the same meeting, so a save on either copies the meeting fields to the other.
export async function POST(request: Request) {
  const body = await request.json();
  const number = Number(body?.number);
  if (!Number.isInteger(number)) return NextResponse.json({ synced: null }, { status: 400 });

  const target =
    body.from === "review"
      ? path.join(process.cwd(), "content/sprint-forecast", `sprint-${number + 1}.json`)
      : path.join(process.cwd(), "content/sprint-review", `sprint-${number - 1}.json`);

  let doc: Record<string, unknown>;
  try {
    doc = JSON.parse(await fs.readFile(target, "utf8"));
  } catch {
    return NextResponse.json({ synced: null });
  }

  const changed = MEETING_FIELDS.filter((field) => JSON.stringify(doc[field]) !== JSON.stringify(body[field] ?? null));
  if (!changed.length) return NextResponse.json({ synced: path.basename(target), changed });

  for (const field of changed) doc[field] = body[field] ?? null;
  await fs.writeFile(target, JSON.stringify(doc, null, 2) + "\n");
  return NextResponse.json({ synced: path.basename(target), changed });
}
