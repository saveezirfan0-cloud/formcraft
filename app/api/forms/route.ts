import { NextRequest, NextResponse } from "next/server";
import { authorizeMake } from "@/lib/api-auth";
import { getAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";


// GET /api/forms            -> list all forms  (Make: "Get Forms")
// GET /api/forms?owner=<id> -> filter by owner
export async function GET(req: NextRequest) {
  if (!authorizeMake(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owner = req.nextUrl.searchParams.get("owner");
  let q = getAdmin().from("forms").select("id,name,description,schema,published,created_at,updated_at");
  if (owner) q = q.eq("owner_id", owner);

  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ forms: data });
}
