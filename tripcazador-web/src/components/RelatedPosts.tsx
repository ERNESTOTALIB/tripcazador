import { getRelatedPosts } from "@/lib/blog";

/**
 * RelatedPosts — abr-2026x.
 *
 * Server component que muestra los 3 posts más relacionados (por solapamiento
 * de tags + recencia) al final de cada blog post. Mejora dwell time, internal
 * linking semántico (Google PageRank), y reduce bounce rate.
 *
 * Props:
 *   slug — slug del post actual (se excluye del listado).
 *   localePrefix — "" para ES, "/en" para EN.
 *   heading — texto del título de la sección.
 */
interface Props {
  slug: string;
  localePrefix?: "" | "/en";
  heading?: string;
}

export function RelatedPosts({
  slug,
  localePrefix = "",
  heading,
}: Props) {
  const related = getRelatedPosts(slug, 3);
  if (related.length === 0) return null;

  const isEn = localePrefix === "/en";
  const title =
    heading || (isEn ? "Continue reading" : "Sigue leyendo");

  return (
    <aside
      aria-labelledby="related-heading"
      className="border-t border-gray-800 pt-8 mt-12 space-y-4"
    >
      <h2
        id="related-heading"
        className="text-lg font-semibold text-white"
      >
        {title}
      </h2>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {related.map((p) => (
          <li
            key={p.slug}
            className="bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-xl overflow-hidden transition-colors"
          >
            <a
              href={`${localePrefix}/blog/${p.slug}`}
              className="block p-4 space-y-2"
            >
              <p className="text-xs text-gray-500">
                {p.readingTime} min
              </p>
              <h3 className="text-sm font-semibold text-white leading-snug line-clamp-3">
                {p.title}
              </h3>
              {p.tags.length > 0 && (
                <p className="text-xs text-amber-400/70 font-mono truncate">
                  #{p.tags.slice(0, 2).join(" #")}
                </p>
              )}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default RelatedPosts;
