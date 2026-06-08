import { NextRequest, NextResponse } from "next/server";
import { authorizeMake } from "@/lib/api-auth";
import { getAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";


// GET    /api/entries/:id  -> one entry
// PATCH  /api/entries/:id  { data } -> update entry (Make: "Update Entry")
// DELETE /api/entries/:id  -> delete entry
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!authorizeMake(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await getAdmin().from("entries").select("*").eq("id", params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ entry: data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!authorizeMake(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.data) return NextResponse.json({ error: "data required" }, { status: 400 });

  const { data, error } = await getAdmin()
    .from("entries").update({ data: body.data }).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!authorizeMake(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await getAdmin().from("entries").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
