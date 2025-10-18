const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const validateImage = (file) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new Error(`Unsupported image type: ${file.mimetype}`);
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image exceeds the ${MAX_IMAGE_SIZE / (1024 * 1024)}MB limit`);
  }
};

export { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE };
