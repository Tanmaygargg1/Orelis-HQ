import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getContents, writeFile, deleteFile } from "@/lib/github";

type Params = { params: { path: string[] } };

function toSubPath(parts: string[]) {
  return parts.map(decodeURIComponent).join("/");
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await getContents(toSubPath(params.path));
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { content, sha } = await req.json();
  try {
    await writeFile(toSubPath(params.path), content, sha);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sha } = await req.json();
  if (!sha) return NextResponse.json({ error: "SHA required" }, { status: 400 });
  try {
    await deleteFile(toSubPath(params.path), sha);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
