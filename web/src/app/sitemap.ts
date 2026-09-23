import type { MetadataRoute } from "next";
import { getPublishedCourses } from "@/lib/catalog";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await getPublishedCourses();
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/cursos`, changeFrequency: "daily", priority: 0.9 },
    ...courses.map((c) => ({
      url: `${BASE}/cursos/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
