import { CATEGORIES } from '@/data/plans';
import { ETIQUETAS } from '@/data/planConstants';
import { supabase } from '@/lib/supabase';

export default async function sitemap() {
  const baseUrl = 'https://planazosbcn.com';

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/planes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/colaboradores`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Category pages
  const categoryPages = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/planes/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // Hashtag / Tag pages
  const tagPages = ETIQUETAS.map((tag) => ({
    url: `${baseUrl}/planes/tag/${tag.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // Individual plan pages
  let planPages = [];
  try {
    const { data: plans } = await supabase
      .from('plans')
      .select('slug, updated_at, created_at');

    planPages = (plans || []).map((plan) => ({
      url: `${baseUrl}/planes/${plan.slug}`,
      lastModified: new Date(plan.updated_at || plan.created_at || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch (err) {
    console.error('Error fetching plans for sitemap:', err);
  }

  return [...staticPages, ...categoryPages, ...tagPages, ...planPages];
}
