import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  // Create client inside handler to avoid build-time env var access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert({ ...body });

  if (error) return NextResponse.json({ error }, { status: 400 });

  return NextResponse.json({ data });
}