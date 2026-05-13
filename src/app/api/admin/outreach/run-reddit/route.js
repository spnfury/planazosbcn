import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

const COOLDOWN_DAYS = 30;

const REDDIT_POSTS = {
  "r/WhatsAppGroups": {
    titles: [
      "🇪🇸 Barcelona Plans Group — Events, Food, Culture & Nightlife [Spain]",
      "🎉 Join PlanazosBCN WhatsApp group — Best plans in Barcelona",
      "Barcelona events & plans WhatsApp group 🇪🇸 — Free to join",
    ],
    bodies: [
      `Hey! Sharing our WhatsApp community for Barcelona plans.\n\nWe share the best events, gastronomy spots, cultural activities, nightlife and outdoor plans every week. All curated, no spam.\n\n📍 Barcelona, Spain\n🔗 Join here: https://chat.whatsapp.com/GDiYK6fC7OhHbAu2XipW9z\n🌐 Web: https://planazosbcn.com\n📸 IG: @planazosbcnreal\n\nFree to join, active community!`,
    ],
  },
  "r/Barcelona": {
    titles: [
      "🎉 PlanazosBCN — Free WhatsApp group for the best plans in Barcelona",
      "Best events in Barcelona? We have a free WhatsApp group for that",
      "Looking for things to do in Barcelona? Join our community",
    ],
    bodies: [
      `We built a platform + WhatsApp community specifically for Barcelona plans.\n\nEvery week we share:\n- 🍽️ Gastronomy & restaurants\n- 🎭 Culture & exhibitions\n- 🌿 Nature & outdoor activities\n- 🎶 Nightlife & parties\n\nAll plans are manually curated at planazosbcn.com\n\n👉 WhatsApp group: https://chat.whatsapp.com/GDiYK6fC7OhHbAu2XipW9z\n📸 Instagram: @planazosbcnreal\n\nFeel free to join, it's completely free!`,
    ],
  },
  "r/Spain": {
    titles: [
      "🇪🇸 Best things to do in Barcelona — Free WhatsApp community",
      "PlanazosBCN — Curated Barcelona events & plans (free WhatsApp group)",
    ],
    bodies: [
      `If you're in Barcelona (or planning to visit), we have a free WhatsApp group where we share the best plans every week.\n\nGastronomy, culture, outdoor activities, nightlife... everything curated at planazosbcn.com\n\n👉 Join: https://chat.whatsapp.com/GDiYK6fC7OhHbAu2XipW9z\n📸 @planazosbcnreal on Instagram\n\nCompletely free, no spam, active community!`,
    ],
  },
  "r/Erasmus": {
    titles: [
      "🎉 Erasmus Barcelona? Free WhatsApp group with the best plans & events",
      "Doing Erasmus in Barcelona? Join our plans community!",
    ],
    bodies: [
      `Heyy Erasmus people in Barcelona! 🇪🇸\n\nWe have a free WhatsApp group where we share the best plans every week — perfect if you want to discover the city:\n\n🍽️ Best restaurants & food spots\n🎭 Cultural events & exhibitions\n🌿 Outdoor activities & day trips\n🎶 Nightlife & parties\n\nAll curated at planazosbcn.com\n\n👉 Join the group: https://chat.whatsapp.com/GDiYK6fC7OhHbAu2XipW9z\n📸 Follow us: @planazosbcnreal\n\nFree to join!`,
    ],
  },
  "r/expats": {
    titles: [
      "🇪🇸 Barcelona expats — Free WhatsApp group for events & local plans",
      "Living in Barcelona? Join our plans community (free WhatsApp group)",
    ],
    bodies: [
      `For all the expats living in or moving to Barcelona!\n\nWe run PlanazosBCN — a platform + WhatsApp community dedicated to the best plans in the city. Weekly curated content:\n\n🍽️ Gastronomy & local food scenes\n🎭 Culture, art & exhibitions\n🌿 Nature & outdoor activities\n🎶 Nightlife & social events\n\nWebsite: https://planazosbcn.com\nWhatsApp: https://chat.whatsapp.com/GDiYK6fC7OhHbAu2XipW9z\nInstagram: @planazosbcnreal\n\nAll free, no spam. Good way to meet people and discover Barcelona!`,
    ],
  },
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

async function isOnCooldown(subreddit) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - COOLDOWN_DAYS);
  const { data } = await supabaseAdmin
    .from("outreach_posts")
    .select("posted_at")
    .eq("platform", "reddit")
    .eq("target", subreddit)
    .eq("status", "posted")
    .gte("posted_at", cutoff.toISOString())
    .limit(1);
  return !!data?.length;
}

async function getRedditToken() {
  const {
    REDDIT_CLIENT_ID,
    REDDIT_CLIENT_SECRET,
    REDDIT_USERNAME,
    REDDIT_PASSWORD,
  } = process.env;
  if (
    !REDDIT_CLIENT_ID ||
    !REDDIT_CLIENT_SECRET ||
    !REDDIT_USERNAME ||
    !REDDIT_PASSWORD
  ) {
    throw new Error(
      "Faltan variables de entorno Reddit (REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD)",
    );
  }
  const creds = Buffer.from(
    `${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`,
  ).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": `PlanazosBCN/1.0 by ${REDDIT_USERNAME}`,
    },
    body: new URLSearchParams({
      grant_type: "password",
      username: REDDIT_USERNAME,
      password: REDDIT_PASSWORD,
    }),
  });
  const data = await res.json();
  if (!data.access_token)
    throw new Error("Token fallido: " + JSON.stringify(data));
  return { token: data.access_token, username: REDDIT_USERNAME };
}

async function submitPost(token, username, subreddit, title, text) {
  const sub = subreddit.replace(/^r\//, "");
  const res = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": `PlanazosBCN/1.0 by ${username}`,
    },
    body: new URLSearchParams({
      sr: sub,
      kind: "self",
      title,
      text,
      nsfw: "false",
      spoiler: "false",
    }),
  });
  const data = await res.json();
  if (data.json?.errors?.length) {
    throw new Error(data.json.errors.map((e) => e[1]).join(", "));
  }
  return data.json?.data?.url;
}

// POST /api/admin/outreach/run-reddit
// Body: { subreddit: "r/Barcelona" }  — uno por llamada para no agotar el timeout
export async function POST(request) {
  const user = await verifyAdmin(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subreddit } = await request.json();
  if (!subreddit || !REDDIT_POSTS[subreddit]) {
    return NextResponse.json(
      { error: "Subreddit no reconocido" },
      { status: 400 },
    );
  }

  const onCooldown = await isOnCooldown(subreddit);
  if (onCooldown) {
    return NextResponse.json({
      status: "cooldown",
      message: `${subreddit} ya publicado en los últimos ${COOLDOWN_DAYS} días`,
    });
  }

  let token, username;
  try {
    ({ token, username } = await getRedditToken());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const post = REDDIT_POSTS[subreddit];
  const title = pick(post.titles);
  const body = pick(post.bodies);

  try {
    const url = await submitPost(token, username, subreddit, title, body);
    await supabaseAdmin.from("outreach_posts").insert({
      platform: "reddit",
      target: subreddit,
      status: "posted",
      url: url || null,
    });
    return NextResponse.json({ status: "posted", url, subreddit });
  } catch (err) {
    await supabaseAdmin.from("outreach_posts").insert({
      platform: "reddit",
      target: subreddit,
      status: "failed",
      notes: err.message,
    });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
