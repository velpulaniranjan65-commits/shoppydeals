import type {
  Category,
  DashboardStats,
  Product,
  ProductsResponse,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://shoppydeals.onrender.com";

/* =========================
   IMAGE URL HELPER
========================= */
export function getImageUrl(image: string): string {
  if (!image) return "/placeholder-product.svg";

  if (image.startsWith("http")) return image;

  return "/placeholder-product.svg";
}

/* =========================
   BASE FETCH WRAPPER
========================= */
async function fetchApi<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...init } = options || {};

  const headers: HeadersInit = {
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (init.body && !(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
}

/* =========================
   API METHODS
========================= */
export const api = {
  /* ---------- AUTH (🔥 IMPORTANT FIX WAS MISSING) ---------- */
  login: (email: string, password: string) =>
    fetchApi<{ token: string; admin: { id: string; email: string; name: string } }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    ),

  getMe: (token: string) =>
    fetchApi<{ admin: { id: string; email: string; name: string } }>(
      "/api/auth/me",
      { token }
    ),

  /* ---------- CATEGORY ---------- */
  getCategories: () =>
    fetchApi<{ categories: Category[] }>("/api/categories"),

  createCategory: (token: string, body: Record<string, unknown>) =>
    fetchApi<{ category: Category }>("/api/categories", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),

  updateCategory: (token: string, id: string, body: Record<string, unknown>) =>
    fetchApi<{ category: Category }>(`/api/categories/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(body),
    }),

  deleteCategory: (token: string, id: string) =>
    fetchApi<{ message: string }>(`/api/categories/${id}`, {
      method: "DELETE",
      token,
    }),

  /* ---------- PRODUCTS ---------- */
  getProducts: (params?: Record<string, string | number | boolean>) => {
    const q = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") {
          q.set(k, String(v));
        }
      });
    }

    const query = q.toString();

    return fetchApi<ProductsResponse>(
      `/api/products${query ? `?${query}` : ""}`
    );
  },

  getProductBySlug: (slug: string) =>
    fetchApi<{ product: Product }>(`/api/products/slug/${slug}`),

  getProduct: (id: string) =>
    fetchApi<{ product: Product }>(`/api/products/${id}`),

  createProduct: (token: string, body: Record<string, unknown>) =>
    fetchApi<{ product: Product }>("/api/products", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),

  updateProduct: (token: string, id: string, body: Record<string, unknown>) =>
    fetchApi<{ product: Product }>(`/api/products/${id}`, {
      method: "PUT",
      token,
      body: JSON.stringify(body),
    }),

  deleteProduct: (token: string, id: string) =>
    fetchApi<{ message: string }>(`/api/products/${id}`, {
      method: "DELETE",
      token,
    }),

  /* =========================
     🔥 IMAGE UPLOAD FIXED (FINAL)
  ========================= */
  uploadImage: async (token: string, file: File) => {
    const form = new FormData();
    form.append("image", file);

    const res = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Upload failed");
    }

    // 🔥 SAFE RESPONSE HANDLING (IMPORTANT)
    const url = data?.url || data?.imageUrl;

    if (!url) {
      throw new Error("Upload failed: no image URL returned");
    }

    return { url };
  },

  /* ---------- ANALYTICS ---------- */
  trackClick: (productId: string) =>
    fetchApi<{ url: string; clicks: number }>(
      `/api/clicks/${productId}`,
      { method: "POST" }
    ),

  getDashboard: (token: string) =>
    fetchApi<{
      stats: DashboardStats;
      topProducts: Product[];
      recentClicks: unknown[];
      clicksByStore: { store: string; count: number }[];
    }>("/api/analytics/dashboard", { token }),
};

/* =========================
   SITE CONFIG
========================= */
export const siteConfig = {
  name: "Shoppy Deals",
  tagline: "బెస్ట్ ఆన్‌లైన్ డీల్స్ — Amazon, Flipkart & More",
  description:
    "Telugu-focused affiliate deals platform. Find trending offers on mobiles, electronics, fashion & more.",
  telegramUrl:
    process.env.NEXT_PUBLIC_TELEGRAM_URL ||
    "https://t.me/shoppydeals",
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
    "contact@shoppydeals.com",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000",
};

/* =========================
   FORMAT PRICE
========================= */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
