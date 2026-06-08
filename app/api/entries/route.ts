import { NextRequest, NextResponse } from "next/server";
import { authorizeMake } from "@/lib/api-auth";
import { getAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";


// GET  /api/entries?form_id=&limit=&since=  -> list entries (Make: "List Entries")
// POST /api/entries  { form_id, data }       -> create entry  (Make: "Create Entry")
export async function GET(req: NextRequest) {
  if (!authorizeMake(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const formId = sp.get("form_id");
  const limit = Math.min(Number(sp.get("limit") || 100), 500);
  const since = sp.get("since"); // ISO date, for Make polling triggers

  let q = getAdmin().from("entries").select("*").order("created_at", { ascending: false }).limit(limit);
  if (formId) q = q.eq("form_id", formId);
  if (since) q = q.gt("created_at", since);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data });
}

export async function POST(req: NextRequest) {
  if (!authorizeMake(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.form_id) return NextResponse.json({ error: "form_id required" }, { status: 400 });

  const { data, error } = await getAdmin()
    .from("entries")
    .insert({ form_id: body.form_id, data: body.data ?? {} })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data }, { status: 201 });
}
