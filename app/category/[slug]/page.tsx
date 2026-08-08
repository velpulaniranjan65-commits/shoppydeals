export const dynamic = "force-dynamic";
export const revalidate = 0;
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, siteConfig } from "@/lib/api";
import { CategoryChips } from "@/components/CategoryChips";
import { ProductGrid } from "@/components/ProductGrid";
import { SectionTitle } from "@/components/SectionTitle";

const VALID_SLUGS = [
  "mobiles",
  "electronics",
  "fashion",
  "kitchen",
  "beauty",
  "gadgets",
  "mens-wear",
];

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);
  return {
    title: `${name} Deals`,
    description: `Best ${name.toLowerCase()} affiliate deals on ${siteConfig.name}. Amazon, Flipkart & more.`,
    openGraph: {
      title: `${name} Deals | ${siteConfig.name}`,
      description: `Shop ${name.toLowerCase()} offers with exclusive discounts.`,
    },
  };
}


export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  if (!VALID_SLUGS.includes(slug)) notFound();

  let categories: Awaited<ReturnType<typeof api.getCategories>>["categories"] =
    [];
  let initialProducts: Awaited<
    ReturnType<typeof api.getProducts>
  >["products"] = [];
  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1);

  try {
    const [catRes, prodRes] = await Promise.all([
      api.getCategories(),
      api.getProducts({ category: slug, limit: 12 }),
    ]);
    categories = catRes.categories;
    initialProducts = prodRes.products;
  } catch {
    /* handled by client */
  }

  return (
    <div className="space-y-6">
      <SectionTitle 
        title={`${categoryName} Deals`}
        subtitle="Affiliate offers — redirects to partner stores"
      />
      <CategoryChips categories={categories} />
      <ProductGrid
        initialProducts={initialProducts}
        query={{ category: slug }}
      />
    </div>
  );
}
