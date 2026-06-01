import { api } from "@/lib/api";

import { HeroSlider } from "@/components/HeroSlider";
import { CategoryChips } from "@/components/CategoryChips";
import { SectionTitle } from "@/components/SectionTitle";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  let categories: Awaited<ReturnType<typeof api.getCategories>>["categories"] =
    [];
  let featured: Awaited<ReturnType<typeof api.getProducts>>["products"] = [];
  let trending: Awaited<ReturnType<typeof api.getProducts>>["products"] = [];
  try {
    const [catRes, featuredRes, trendingRes] = await Promise.all([
      api.getCategories(),
      api.getProducts({ featured: true, limit: 8 }),
      api.getProducts({ trending: true, limit: 8 }),
    ]);
    categories = catRes.categories;
    featured = featuredRes.products;
    trending = trendingRes.products;
  } catch {
    /* API offline — client grid will retry */
  }

  return (
    <div className="space-y-10">
      <HeroSlider products={featured.length ? featured : trending} />

      <section>
        <CategoryChips categories={categories} />
      </section>

      {trending.length > 0 && (
        <section>
          <SectionTitle
            title="Trending Deals"
            
            subtitle="Most clicked offers right now"
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {trending.slice(0, 4).map((p, i) => (
              <ProductCard key={p._id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle
          title="Latest Deals"
          subtitle="Fresh offers updated by our team"
        />
        <ProductGrid showLoadMore />
      </section>
    </div>
  );
}
