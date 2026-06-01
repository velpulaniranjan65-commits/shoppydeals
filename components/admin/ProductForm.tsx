
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

export function ProductForm({
  product,
  onSuccess,
}: ProductFormProps) {
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
    api.getCategories().then((r) =>
      setCategories(r.categories)
    );
  }, []);

  useEffect(() => {
    setImagePreview(
      product?.image ? getImageUrl(product.image) : ""
    );
  }, [product]);

  function updateField(
    key: string,
    value: string | boolean
  ) {
    setForm((f) => {
      const next = { ...f, [key]: value };

      if (
        key === "originalPrice" ||
        key === "dealPrice"
      ) {
        const orig = Number(
          key === "originalPrice"
            ? value
            : f.originalPrice
        );

        const deal = Number(
          key === "dealPrice"
            ? value
            : f.dealPrice
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
    console.log("IMAGE FUNCTION STARTED");

    const file = e.target.files?.[0];

    if (!file) {
      console.log("NO FILE SELECTED");
      return;
    }

    console.log("FILE:", file);

    const token = getToken();

    console.log("TOKEN:", token);

    if (!token) {
      setError("No token found");
      return;
    }

    const localPreview = URL.createObjectURL(file);

    setImagePreview(localPreview);

    setUploading(true);
    setError("");

    try {
      console.log("UPLOADING IMAGE...");

      const { url } = await api.uploadImage(
        token,
        file
      );

      console.log("UPLOAD SUCCESS:", url);

      setForm((f) => ({
        ...f,
        image: url,
      }));

    } catch (err) {
      console.error("UPLOAD ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    console.log("SUBMIT STARTED");

    const token = getToken();

    if (!token) {
      setError("No token found");
      return;
    }

    setError("");
    setLoading(true);

    const body = {
      ...form,
      originalPrice: Number(form.originalPrice),
      dealPrice: Number(form.dealPrice),
      discount: Number(form.discount),
    };

    console.log("BODY:", body);

    try {
      if (product) {
        await api.updateProduct(
          token,
          product._id,
          body
        );
      } else {
        await api.createProduct(token, body);
      }

      console.log("PRODUCT SAVED");

      onSuccess();

    } catch (err) {
      console.error("SAVE ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Save failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-4"
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">
            Product Name
          </label>

          <input
            required
            value={form.title}
            onChange={(e) =>
              updateField("title", e.target.value)
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">
            Description
          </label>

          <textarea
            rows={4}
            value={form.description}
            onChange={(e) =>
              updateField(
                "description",
                e.target.value
              )
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Original Price
          </label>

          <input
            type="number"
            required
            value={form.originalPrice}
            onChange={(e) =>
              updateField(
                "originalPrice",
                e.target.value
              )
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Deal Price
          </label>

          <input
            type="number"
            required
            value={form.dealPrice}
            onChange={(e) =>
              updateField(
                "dealPrice",
                e.target.value
              )
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Discount %
          </label>

          <input
            type="number"
            value={form.discount}
            onChange={(e) =>
              updateField(
                "discount",
                e.target.value
              )
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Store
          </label>

          <select
            value={form.store}
            onChange={(e) =>
              updateField("store", e.target.value)
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {STORES.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">
            Category
          </label>

          <select
            required
            value={form.category}
            onChange={(e) =>
              updateField(
                "category",
                e.target.value
              )
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">
              Select category
            </option>

            {categories.map((category) => (
              <option
                key={category._id}
                value={category._id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">
            Affiliate URL
          </label>

          <input
            type="url"
            required
            value={form.affiliateLink}
            onChange={(e) =>
              updateField(
                "affiliateLink",
                e.target.value
              )
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">
            Product Image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="text-sm"
          />

          {uploading && (
            <p className="mt-1 text-xs text-blue-600">
              Uploading...
            </p>
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
            <p className="mt-1 text-xs text-red-600">
              Image required
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                updateField(
                  "featured",
                  e.target.checked
                )
              }
            />

            Featured Product
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-primary px-6 py-2.5 text-white disabled:opacity-60"
      >
        {loading
          ? "Saving..."
          : product
          ? "Update Product"
          : "Add Product"}
      </button>
    </form>
  );
}


