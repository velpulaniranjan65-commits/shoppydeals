"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { api, formatPrice, getImageUrl } from "@/lib/api";
import { STORE_COLORS } from "@/lib/constants";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const storeClass =
    STORE_COLORS[product.store] || "bg-slate-100 text-slate-800";
async function handleViewDeal() {
  try {
    await api.trackClick(product._id);
  } catch (err) {
    console.log("Click tracking failed", err);
  }

  if (product.affiliateLink) {
    window.open(product.affiliateLink, "_blank", "noopener,noreferrer");
  }
}
  

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <span className="absolute left-2 top-2 z-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-2 py-1 text-xs font-bold text-white shadow">
          {product.discount}% OFF
        </span>
        <motion.div
          className="relative aspect-[4/5] w-full overflow-hidden"
          whileHover={{ scale: 1.04 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          <Image
            src={getImageUrl(product.image) ||"/placeholder-product.svg"}
            width={400}
            height={500}
            alt="product"
            unoptimized
            className="h-full w-full object-contain"
          />
        </motion.div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <span
          className={`inline-flex w-fit rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-xs ${storeClass}`}
        >
          {product.store}
        </span>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 sm:text-base">
          {product.title}
        </h3>
        <div className="mt-auto flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">
            {formatPrice(product.dealPrice)}
          </span>
          <span className="text-sm text-slate-400 line-through">
            {formatPrice(product.originalPrice)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleViewDeal}
          className="mt-1 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover active:scale-[0.98]"
        >
          View Deal
        </button>
      </div>
    </motion.article>
  );
}
