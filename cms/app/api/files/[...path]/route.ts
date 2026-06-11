import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getContents, writeFile, deleteFile, moveItem } from "@/lib/github";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/cache";

type Params = { params: { path: string[] } };

function toSubPath(parts: string[]) {
  return parts.map(decodeURIComponent).join("/");
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subPath = toSubPath(params.path);
  const key = `files:${subPath}`;
  const cached = cacheGet(key);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await getContents(subPath);
    // Cache dirs for 30s, files for 60s (files change less often)
    cacheSet(key, result, result.type === "dir" ? 30_000 : 60_000);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subPath = toSubPath(params.path);
  const { content, sha } = await req.json();

  try {
    await writeFile(subPath, content, sha);
    cacheInvalidate(`files:${subPath}`);   // bust this file
    cacheInvalidate("files:root");          // bust root listing
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fromSubPath = toSubPath(params.path);
  const { newPath } = await req.json();
  if (!newPath) return NextResponse.json({ error: "newPath required" }, { status: 400 });

  try {
    await moveItem(fromSubPath, newPath);
    cacheInvalidate("files:"); // bust all listings
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subPath = toSubPath(params.path);
  const { sha } = await req.json();
  if (!sha) return NextResponse.json({ error: "SHA required" }, { status: 400 });

  try {
    await deleteFile(subPath, sha);
    cacheInvalidate("files:"); // bust everything
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
