import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

async function verifyAdmin(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const {
    data: { user },
    error,
  } = await supabaseUser.auth.getUser();
  if (error || !user) return null;
  const { data: adminUser } = await supabaseAdmin
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .single();
  return adminUser ? user : null;
}

// GET /api/admin/outreach — fetch logs
export async function GET(request) {
  const user = await verifyAdmin(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "100");
  const platform = searchParams.get("platform");

  let query = supabaseAdmin
    .from("outreach_posts")
    .select("*")
    .order("posted_at", { ascending: false })
    .limit(limit);

  if (platform) query = query.eq("platform", platform);

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// POST /api/admin/outreach — log a post (used by scripts + manual from admin)
export async function POST(request) {
  const user = await verifyAdmin(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { platform, target, status = "posted", url, notes } = body;

  if (!platform || !target) {
    return NextResponse.json(
      { error: "platform and target required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("outreach_posts")
    .insert({ platform, target, status, url, notes })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/admin/outreach?id=xxx — delete a log entry
export async function DELETE(request) {
  const user = await verifyAdmin(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("outreach_posts")
    .delete()
    .eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
