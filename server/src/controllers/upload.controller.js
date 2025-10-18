import { validateImage } from "../utils/image-validation.js";
import { uploadToCloudinary } from "../utils/cloudinary-upload.js";

export const uploadImages = async (req, res) => {
  const files = req.files ?? [];

  if (!files.length) {
    return res.status(400).json({ error: "No files provided" });
  }

  try {
    const uploads = await Promise.all(
      files.map(async (file) => {
        validateImage(file);
        const url = await uploadToCloudinary(file);
        return {
          url,
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
        };
      }),
    );

    return res.json({ data: uploads });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Unsupported")) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: error.message ?? "Upload failed" });
  }
};
