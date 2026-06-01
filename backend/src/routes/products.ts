import { Router } from "express";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { authMiddleware } from "../middleware/auth.js";
import { uniqueProductSlug } from "../utils/slugify.js";

const router = Router();

// 🔥 discount calculator
function calcDiscount(original: number, deal: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - deal) / original) * 100);
}

// 🔥 category resolver
async function resolveCategoryId(
  categoryInput: string
): Promise<string | null> {
  if (!categoryInput) return null;

  const byId = await Category.findById(categoryInput).select("_id").lean();
  if (byId) return byId._id.toString();

  const bySlug = await Category.findOne({ slug: categoryInput })
    .select("_id")
    .lean();

  return bySlug ? bySlug._id.toString() : null;
}

/* =========================
   GET ALL PRODUCTS
========================= */
router.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
  const skip = (page - 1) * limit;

  const search = (req.query.search as string)?.trim();
  const category = (req.query.category as string)?.trim();
  const featured = req.query.featured === "true";
  const trending = req.query.trending === "true";

  const filter: Record<string, unknown> = {};

  if (category) {
    const cat = await Category.findOne({ slug: category })
      .select("_id")
      .lean();
    if (cat) filter.category = cat._id;
  }

  if (featured) filter.featured = true;

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  let sort: Record<string, 1 | -1> = { createdAt: -1 };

  if (trending) {
    sort = { clicks: -1, createdAt: -1 };
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug icon")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    Product.countDocuments(filter),
  ]);

  res.json({
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: skip + products.length < total,
    },
  });
});

/* =========================
   GET BY SLUG
========================= */
router.get("/slug/:slug", async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate("category", "name slug")
    .lean();

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({ product });
});

/* =========================
   GET BY ID
========================= */
router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name slug")
    .lean();

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({ product });
});

/* =========================
   CREATE PRODUCT (🔥 FIXED)
========================= */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const body = req.body;

    // 🔥 IMAGE REQUIRED FIX
    if (!body.image) {
      return res.status(400).json({
        message: "Image is required",
      });
    }

    // category check
    const categoryId = await resolveCategoryId(body.category);
    if (!categoryId) {
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    const originalPrice = Number(body.originalPrice);
    const dealPrice = Number(body.dealPrice);

    if (isNaN(originalPrice) || isNaN(dealPrice)) {
      return res.status(400).json({
        message: "Invalid price values",
      });
    }

    const discount =
      Number(body.discount) || calcDiscount(originalPrice, dealPrice);

    const slug = await uniqueProductSlug(body.title);

    const product = await Product.create({
      title: body.title,
      slug,
      description: body.description || "",
      image: String(body.image), // 🔥 safe
      originalPrice,
      dealPrice,
      discount,
      affiliateLink: body.affiliateLink,
      category: categoryId,
      store: body.store,
      featured: Boolean(body.featured),
    });

    const populated = await Product.findById(product._id).populate(
      "category",
      "name slug icon"
    );

    res.status(201).json({ product: populated });
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   UPDATE PRODUCT (🔥 FIXED IMAGE SUPPORT)
========================= */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    const body = req.body;
    const updates: Record<string, unknown> = { ...body };

    // category update
    if (body.category) {
      const categoryId = await resolveCategoryId(body.category);
      if (!categoryId) {
        return res.status(400).json({ message: "Invalid category" });
      }
      updates.category = categoryId;
    }

    // title slug update
    if (body.title && body.title !== existing.title) {
      updates.slug = await uniqueProductSlug(
        body.title,
        existing._id.toString()
      );
    }

    // price update
    if (body.originalPrice !== undefined || body.dealPrice !== undefined) {
      const originalPrice = Number(
        body.originalPrice ?? existing.originalPrice
      );
      const dealPrice = Number(body.dealPrice ?? existing.dealPrice);

      updates.originalPrice = originalPrice;
      updates.dealPrice = dealPrice;
      updates.discount =
        Number(body.discount) || calcDiscount(originalPrice, dealPrice);
    }

    // 🔥 IMAGE UPDATE FIX (IMPORTANT)
    if (body.image !== undefined) {
      updates.image = String(body.image);
    }

    delete updates._id;
    delete updates.clicks;
    delete updates.createdAt;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate("category", "name slug icon");

    res.json({ product });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   DELETE PRODUCT
========================= */
router.delete("/:id", authMiddleware, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json({ message: "Product deleted" });
});

export default router;
