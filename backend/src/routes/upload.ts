import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import authMiddleware from "../middleware/authMiddleware";

const router = Router();

// multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No image uploaded",
        });
      }

      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "shoppydeals",
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          }
        );

        // important: stream error safety
        stream.on("error", reject);

        // send file buffer to cloudinary
        stream.end(req.file.buffer);
      });

      return res.json({
        url: result.secure_url,
        public_id: result.public_id,
      });

    } catch (error: any) {
      console.error("UPLOAD ERROR:", error);

      return res.status(500).json({
        message: "Upload failed",
        error: error?.message || String(error),
      });
    }
  }
);

export default router;
