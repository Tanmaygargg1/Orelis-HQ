import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getContents, writeFile } from "@/lib/github";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/cache";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = "files:root";
  const cached = cacheGet(key);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await getContents();
    cacheSet(key, result, 30_000);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path, content = "" } = await req.json();
  if (!path) return NextResponse.json({ error: "Path required" }, { status: 400 });

  try {
    await writeFile(path, content);
    cacheInvalidate("files:"); // bust all file listings
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
