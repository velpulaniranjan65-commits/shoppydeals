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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  function updateField(key: string, value: string | boolean) {
    setForm((f) => {
      const next = { ...f, [key]: value };

      if (key === "originalPrice" || key === "dealPrice") {
        const orig = Number(key === "originalPrice" ? value : f.originalPrice);
        const deal = Number(key === "dealPrice" ? value : f.dealPrice);

        if (orig > 0 && deal >= 0) {
          next.discount = String(Math.round(((orig - deal) / orig) * 100));
        }
      }

      return next;
    });
  }

  // 🔥 FIXED IMAGE UPLOAD
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getToken();
    if (!token) {
      setError("No token found");
      return;
    }

    setUploading(true);
    setError("");

    const preview = URL.createObjectURL(file);
    setImagePreview(preview);

    try {
      const res = await api.uploadImage(token, file);

      console.log("UPLOAD RESPONSE:", res);

      // 🔥 SAFE FIX (works for both backend formats)
      const imageUrl = res?.imageUrl || res?.url;

      if (!imageUrl) {
        throw new Error("Upload failed - no image URL returned");
      }

      setForm((prev) => ({
        ...prev,
        image: imageUrl,
      }));

    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // 🔥 FIXED SUBMIT
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const token = getToken();

    if (!token) {
      setError("No token found");
      return;
    }

    if (!form.image) {
      setError("Please upload image first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const body = {
        ...form,
        originalPrice: Number(form.originalPrice),
        dealPrice: Number(form.dealPrice),
        discount: Number(form.discount),
        image: form.image,
      };

      console.log("BODY:", body);

      if (product) {
        await api.updateProduct(token, product._id, body);
      } else {
        await api.createProduct(token, body);
      }

      onSuccess();

    } catch (err) {
      console.error("SAVE ERROR:", err);
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

      {/* IMAGE */}
      <div className="sm:col-span-2">
        <label>Product Image</label>

        <input type="file" accept="image/*" onChange={handleImageUpload} />

        {uploading && <p className="text-blue-600">Uploading...</p>}

        {imagePreview && (
          <div className="mt-2 h-32 w-32">
            <Image
              src={imagePreview}
              alt="preview"
              width={120}
              height={120}
              unoptimized
            />
          </div>
        )}

        {!form.image && (
          <p className="text-xs text-red-500">Image required</p>
        )}
      </div>

      {/* BUTTON */}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-primary px-6 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Saving..." : product ? "Update Product" : "Add Product"}
      </button>

    </form>
  );
}
