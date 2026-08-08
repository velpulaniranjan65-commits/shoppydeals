export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, siteConfig } from "@/lib/api";
import { ProductGrid } from "@/components/ProductGrid";
import { SectionTitle } from "@/components/SectionTitle";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;

  const name = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

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

  let categories: Awaited<
    ReturnType<typeof api.getCategories>
  >["categories"] = [];

  let initialProducts: Awaited<
    ReturnType<typeof api.getProducts>
  >["products"] = [];

  try {
    const [catRes, prodRes] = await Promise.all([
      api.getCategories(),
      api.getProducts({
        category: slug,
        limit: 12,
      }),
    ]);

    categories = catRes.categories;
    initialProducts = prodRes.products;

    // Check whether this category exists in the database
    const categoryExists = categories.some(
      (category) => category.slug === slug
    );

    if (!categoryExists) {
      notFound();
    }
  } catch {
    // handled by client
  }

  const categoryName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <>
      <SectionTitle
        title={`${categoryName} Deals`}
        subtitle="Affiliate offers — redirects to partner stores"
      />

      <ProductGrid
        initialProducts={initialProducts}
        query={{ category: slug }}
      />
    </>
  );
}
