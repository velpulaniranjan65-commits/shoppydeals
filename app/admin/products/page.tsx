"use client";
import { uploadImage } from "@/lib/uploadImage";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { api, formatPrice } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Product } from "@/lib/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api.getProducts({ limit: 100 });
      setProducts(res.products);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    const confirmDelete = confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    const token = getToken();
    if (!token) {
      alert("Not logged in");
      return;
    }

    try {
      setDeletingId(id);
      await api.deleteProduct(token, id);

      // remove from UI instantly
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminShell>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Products</h2>

        <Link
          href="/admin/products/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          + Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-muted">No products found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-muted">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Store</th>
                <th className="py-2 pr-4">Clicks</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-b border-slate-100">
                  <td className="max-w-[200px] truncate py-3 pr-4 font-medium">
                    {p.title}
                    {p.featured && (
                      <span className="ml-1 text-xs text-orange-600">★</span>
                    )}
                  </td>

                  <td className="py-3 pr-4">
                    {formatPrice(p.dealPrice)}
                  </td>

                  <td className="py-3 pr-4">{p.store}</td>

                  <td className="py-3 pr-4">{p.clicks}</td>

                  <td className="py-3">
                    <div className="flex gap-3 items-center">

                      {/* EDIT */}
                      <Link
                        href={`/admin/products/${p._id}/edit`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>

                      {/* DELETE */}
                      <button
                        type="button"
                        onClick={() => handleDelete(p._id)}
                        disabled={deletingId === p._id}
                        className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === p._id ? "Deleting..." : "Delete"}
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
