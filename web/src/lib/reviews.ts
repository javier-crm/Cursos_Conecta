import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  author_name: string;
  created_at: string;
  course?: { title: string } | { title: string }[] | null;
};

export type CourseRating = { average: number; count: number; reviews: Review[] };

/** Reseñas aprobadas de un curso + promedio. */
export async function getCourseRating(courseId: string): Promise<CourseRating> {
  if (!supabaseConfigured) return { average: 0, count: 0, reviews: [] };
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, comment, author_name, created_at")
    .eq("course_id", courseId)
    .eq("status", "approved")
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  const reviews = data ?? [];
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { average, count, reviews };
}

/** Mejores reseñas del sitio (para testimonios de la landing). */
export async function getTopReviews(limit = 3): Promise<Review[]> {
  if (!supabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, comment, author_name, created_at, course:courses(title)")
    .eq("status", "approved")
    .not("comment", "is", null)
    .gte("rating", 4)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
