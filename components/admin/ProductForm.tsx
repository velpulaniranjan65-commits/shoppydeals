"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api, getImageUrl } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { STORES } from "@/lib/constants";
import type { Category, Product } from "@/lib/types";

interface ProductFormProps {
  product?: Product;
  onSuccess: () => void;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  console.log("PRODUCT:", product);
  console.log("IMAGE:", product?.image);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); // ✅ NEW
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(
    product?.image ? getImageUrl(product.image) : ""
  );

  const [form, setForm] = useState({
    title: product?.title || "",
    description: product?.description || "",
    originalPrice: product?.originalPrice?.toString() || "",
    dealPrice: product?.dealPrice?.toString() || "",
    discount: product?.discount?.toString() || "",
    affiliateLink: product?.affiliateLink || "",
    category:
      typeof product?.category === "object"
        ? product.category._id
        : (product?.category as string) || "",
    store: product?.store || "Amazon",
    featured: product?.featured ?? false,
    image: product?.image || "",
  });

  useEffect(() => {
    api.getCategories().then((r) => setCategories(r.categories));
  }, []);

  useEffect(() => {
    setImagePreview(product?.image ? getImageUrl(product.image) : "");
  }, [product]);

  function updateField(key: string, value: string | boolean) {
    setForm((f) => {
      const next = { ...f, [key]: value };

      if (key === "originalPrice" || key === "dealPrice") {
        const orig = Number(
          key === "originalPrice" ? value : f.originalPrice
        );
        const deal = Number(key === "dealPrice" ? value : f.dealPrice);

        if (orig > 0 && deal >= 0) {
          next.discount = String(Math.round(((orig - deal) / orig) * 100));
        }
      }

      return next;
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getToken();
    if (!token) return;

    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    setUploading(true);
    setError("");

    try {
      const { url } = await api.uploadImage(token, file);
      console.log("UPLOAD URL:", url);
      setForm((f) => ({
        ...f,
        image: url,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const token = getToken();
    if (!token) return;

    setError("");
    setLoading(true);

    const body = {
      ...form,
      originalPrice: Number(form.originalPrice),
      dealPrice: Number(form.dealPrice),
      discount: Number(form.discount),
    };

    try {
      if (product) {
        await api.updateProduct(token, product._id, body);
      } else {
        await api.createProduct(token, body);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">

        {/* TITLE */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Product Name</label>
          <input
            required
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        {/* IMAGE */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Product Image</label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="text-sm"
          />

          {uploading && (
            <p className="text-xs text-blue-600 mt-1">Uploading...</p>
          )}

          {imagePreview && (
            <div className="relative mt-2 h-32 w-32 overflow-hidden rounded-lg border">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          {!form.image && (
            <p className="mt-1 text-xs text-red-600">Image required</p>
          )}
        </div>

      </div>

      <button
        type="submit"
        disabled={loading || uploading || !form.image}
        className="rounded-xl bg-primary px-6 py-2.5 text-white disabled:opacity-60"
      >
        {loading ? "Saving..." : product ? "Update Product" : "Add Product"}
      </button>
    </form>
  );
}
