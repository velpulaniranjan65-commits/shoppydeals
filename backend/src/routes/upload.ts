import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

// multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
});

// IMAGE UPLOAD ROUTE
router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image uploaded",
        });
      }

      // upload to cloudinary using stream
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

        stream.on("error", reject);
        stream.end(req.file.buffer);
      });

      // ✅ IMPORTANT: send correct field names
      return res.status(200).json({
        success: true,
        imageUrl: result.secure_url,   // 👈 FIXED (frontend expects this)
        public_id: result.public_id,
      });

    } catch (error: any) {
      console.error("UPLOAD ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Upload failed",
        error: error?.message || "Unknown error",
      });
    }
  }
);

export default router;
