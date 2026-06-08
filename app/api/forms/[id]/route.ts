import { NextRequest, NextResponse } from "next/server";
import { authorizeMake } from "@/lib/api-auth";
import { getAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";


// GET /api/forms/:id  -> single form + schema  (Make: "Get a Form")
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!authorizeMake(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getAdmin().from("forms").select("*").eq("id", params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ form: data });
}
