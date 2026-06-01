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

  function updateField(key: string, value: any) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "originalPrice" || key === "dealPrice") {
        const orig = Number(
          key === "originalPrice" ? value : prev.originalPrice
        );
        const deal = Number(
          key === "dealPrice" ? value : prev.dealPrice
        );

        if (orig > 0 && deal >= 0) {
          next.discount = String(
            Math.round(((orig - deal) / orig) * 100)
          );
        }
      }

      return next;
    });
  }

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getToken();
    if (!token) {
      setError("No token found");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const localPreview = URL.createObjectURL(file);
      setImagePreview(localPreview);

      const res = await api.uploadImage(token, file);

      const url = res?.url;

      if (!url) throw new Error("Upload failed");

      setForm((prev) => ({
        ...prev,
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
    if (!token) {
      setError("No token found");
      return;
    }

    if (!form.image) {
      setError("Please upload image");
      return;
    }

    setLoading(true);
    setError("");

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
        <p className="rounded bg-red-100 p-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <input
        placeholder="Product Name"
        value={form.title}
        onChange={(e) => updateField("title", e.target.value)}
        className="w-full border p-2"
      />

      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => updateField("description", e.target.value)}
        className="w-full border p-2"
      />

      <input
        type="number"
        placeholder="Original Price"
        value={form.originalPrice}
        onChange={(e) => updateField("originalPrice", e.target.value)}
        className="w-full border p-2"
      />

      <input
        type="number"
        placeholder="Deal Price"
        value={form.dealPrice}
        onChange={(e) => updateField("dealPrice", e.target.value)}
        className="w-full border p-2"
      />

      <input
        type="number"
        placeholder="Discount"
        value={form.discount}
        onChange={(e) => updateField("discount", e.target.value)}
        className="w-full border p-2"
      />

      <select
        value={form.store}
        onChange={(e) => updateField("store", e.target.value)}
        className="w-full border p-2"
      >
        {STORES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>

      <select
        value={form.category}
        onChange={(e) => updateField("category", e.target.value)}
        className="w-full border p-2"
      >
        <option value="">Select Category</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      <input
        placeholder="Affiliate Link"
        value={form.affiliateLink}
        onChange={(e) => updateField("affiliateLink", e.target.value)}
        className="w-full border p-2"
      />

      <input type="file" accept="image/*" onChange={handleImageUpload} />

      {uploading && <p>Uploading...</p>}

      {/* 🔥 FIXED IMAGE PREVIEW */}
      {imagePreview && (
        <div className="relative w-[120px] h-[120px] overflow-hidden rounded-lg border bg-white">
          <Image
            src={imagePreview}
            alt="preview"
            fill
            className="object-cover"
          />
        </div>
      )}

      <label className="flex gap-2 items-center">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => updateField("featured", e.target.checked)}
        />
        Featured Product
      </label>

      <button
        disabled={loading}
        className="bg-black text-white px-4 py-2"
      >
        {loading ? "Saving..." : "Save Product"}
      </button>
    </form>
  );
}
