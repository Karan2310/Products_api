import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z
  .object({
    PORT: z.string().default("4000"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    ADMIN_EMAIL: z.string().email(),
    ADMIN_PASSWORD: z.string().optional(),
    ADMIN_PASSWORD_HASH: z.string().optional(),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    CLOUDINARY_UPLOAD_FOLDER: z.string().default("products"),
    CLIENT_ORIGIN: z.string().optional(),
    CHATBOT_API_URL: z.string().url().optional(),
    CHATBOT_API_KEY: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (!values.ADMIN_PASSWORD && !values.ADMIN_PASSWORD_HASH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide ADMIN_PASSWORD or ADMIN_PASSWORD_HASH",
        path: ["ADMIN_PASSWORD"],
      });
    }

    const hasCloudinary =
      values.CLOUDINARY_CLOUD_NAME &&
      values.CLOUDINARY_API_KEY &&
      values.CLOUDINARY_API_SECRET;

    if (!hasCloudinary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cloudinary credentials are required",
        path: ["CLOUDINARY_CLOUD_NAME"],
      });
    }
  });

const env = envSchema.parse({
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  JWT_SECRET: process.env.JWT_SECRET,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_FOLDER: process.env.CLOUDINARY_UPLOAD_FOLDER,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  CHATBOT_API_URL: process.env.CHATBOT_API_URL,
  CHATBOT_API_KEY: process.env.CHATBOT_API_KEY,
});

export default env;
