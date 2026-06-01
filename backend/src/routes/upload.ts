import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { authMiddleware } from "../middleware/auth.js"; // ✅ FIXED IMPORT

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

// Cloudinary config (make sure env is set)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      // ✅ FIX 1: file check
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const result: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "shoppydeals",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        stream.end(req.file!.buffer);
      });

      // ✅ FIX 2: safe URL handling
      const url = result?.secure_url || result?.url;

      if (!url) {
        return res.status(500).json({ message: "Upload failed" });
      }

      return res.json({
        url, // ✅ frontend expects this
      });
    } catch (err: any) {
      console.error("UPLOAD ERROR:", err);
      return res.status(500).json({
        message: err.message || "Upload failed",
      });
    }
  }
);

export default router;
