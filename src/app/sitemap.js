import { CATEGORIES } from "@/data/plans";
import { ETIQUETAS } from "@/data/planConstants";
import { supabase } from "@/lib/supabase";
import { filterIncompletePlans } from "@/lib/filterIncompletePlans";
import { isPastEvent } from "@/lib/formatDate";

export default async function sitemap() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://planazosbcn.com";
  const now = new Date();

  const staticPages = [
    { url: baseUrl, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/planes`, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${baseUrl}/restaurantes`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    { url: `${baseUrl}/comercios`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contacto`, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${baseUrl}/colaboradores`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terminos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/cookies`, changeFrequency: "yearly", priority: 0.2 },
  ].map((p) => ({ ...p, lastModified: now }));

  const categoryPages = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/planes/categoria/${cat.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const tagPages = ETIQUETAS.map((tag) => ({
    url: `${baseUrl}/planes/tag/${tag.id}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  let planPages = [];
  try {
    const { data: plans } = await supabase
      .from("plans")
      .select("id, slug, date, updated_at, created_at")
      .eq("published", true);

    const upcoming = (plans || []).filter(
      (p) => p.slug && !isPastEvent(p.date),
    );
    const validPlans = await filterIncompletePlans(upcoming);

    planPages = validPlans.map((plan) => ({
      url: `${baseUrl}/planes/${plan.slug}`,
      lastModified: new Date(plan.updated_at || plan.created_at || Date.now()),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (err) {
    console.error("Error fetching plans for sitemap:", err);
  }

  let restaurantPages = [];
  try {
    const { data: restaurants } = await supabase
      .from("restaurants")
      .select("id, updated_at, created_at")
      .eq("is_active", true);

    restaurantPages = (restaurants || []).map((r) => ({
      url: `${baseUrl}/restaurantes/${r.id}`,
      lastModified: new Date(r.updated_at || r.created_at || Date.now()),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch (err) {
    console.error("Error fetching restaurants for sitemap:", err);
  }

  return [
    ...staticPages,
    ...categoryPages,
    ...tagPages,
    ...planPages,
    ...restaurantPages,
  ];
}
