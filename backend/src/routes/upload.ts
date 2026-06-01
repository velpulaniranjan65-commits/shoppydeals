import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "shoppydeals" },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    return res.json({
      imageUrl: result.secure_url,   // 🔥 IMPORTANT
      public_id: result.public_id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed" });
  }
});

export default router;
