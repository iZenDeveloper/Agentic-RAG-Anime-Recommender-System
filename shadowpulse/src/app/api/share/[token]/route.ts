import { NextResponse } from "next/server";
import { getJobByShareToken } from "@/lib/store";

export async function GET(
  _req: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const job = getJobByShareToken(token);
  if (!job) {
    return NextResponse.json({ error: "not_found_or_expired" }, { status: 404 });
  }
  return NextResponse.json({ job });
}
