"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { api, formatPrice, getImageUrl } from "@/lib/api";

interface HeroSliderProps {
  products: Product[];
}

export function HeroSlider({ products }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const slides = products.slice(0, 5);

  useEffect(() => {
    if (slides.length <= 1) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4500);

    return () => clearInterval(id);
  }, [slides.length]);

  if (!slides.length) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-blue-700 p-8 text-white sm:p-12">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Best Online Deals
        </h1>

        <p className="mt-2 max-w-md text-blue-100">
          Amazon, Flipkart, Myntra & more — updated daily for Telugu shoppers.
        </p>
      </div>
    );
  }

  const current = slides[index];

  async function handleCta() {
    try {
      const { url } = await api.trackClick(current._id);

      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(
        current.affiliateLink,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg">
      <AnimatePresence mode="wait">
        <motion.div
          key={current._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="grid min-h-[200px] grid-cols-1 items-center gap-4 p-6 sm:min-h-[240px] sm:grid-cols-2 sm:p-8"
        >
          {/* LEFT CONTENT */}
          <div className="relative z-10 space-y-3">
            <span className="inline-block rounded-lg bg-orange-500 px-2 py-1 text-xs font-bold">
              {current.discount}% OFF — Featured Deal
            </span>

            <h1 className="line-clamp-2 text-xl font-bold sm:text-2xl">
              {current.title}
            </h1>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {formatPrice(current.dealPrice)}
              </span>

              <span className="text-sm text-slate-400 line-through">
                {formatPrice(current.originalPrice)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCta}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold transition hover:bg-primary-hover"
            >
              View Deal →
            </button>
          </div>

          {/* RIGHT IMAGE */}
          <div className="relative mx-auto aspect-square w-full max-w-[180px] overflow-hidden rounded-xl bg-white sm:max-w-[220px]">
            <Image
              src={getImageUrl(current.image)}
              alt={current.title}
              fill
              className="object-cover"
              priority
              sizes="220px"
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* DOTS */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
