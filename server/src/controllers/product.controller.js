import Product from "../models/product.model.js";
import { cloudinary } from "../config/cloudinary.js";

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "updatedAt", "price", "title", "stock"]);

const serializeProduct = (document) => {
  if (!document) {
    return null;
  }

  const obj = typeof document.toObject === "function" ? document.toObject() : document;

  return {
    id: obj._id?.toString?.() ?? obj.id,
    title: obj.title,
    description: obj.description,
    price: obj.price,
    category: obj.category,
    stock: obj.stock,
    images: (obj.images ?? []).map((image) => (typeof image === "string" ? image : image.url)),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const normalizeImages = (images) => {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image) => {
      if (typeof image === "string") {
        return { url: image };
      }

      if (image && typeof image === "object" && typeof image.url === "string") {
        const normalized = { url: image.url };
        if (image.publicId) {
          normalized.publicId = image.publicId;
        }
        return normalized;
      }

      return null;
    })
    .filter(Boolean);
};

const extractPublicIdFromUrl = (url) => {
  if (typeof url !== "string" || url.length === 0) {
    return null;
  }

  try {
    const withoutParams = url.split("?")[0];
    const match = withoutParams.match(/\/upload\/([^.]*)/);
    if (!match || !match[1]) {
      return null;
    }

    const path = match[1].replace(/^v\d+\//, "");
    const segments = path.split("/");
    const lastSegment = segments.pop();
    if (!lastSegment) {
      return null;
    }

    const [publicIdWithoutExt] = lastSegment.split(".");
    return [...segments, publicIdWithoutExt].join("/");
  } catch (error) {
    return null;
  }
};

const getPublicId = (image) => {
  if (!image) {
    return null;
  }

  if (typeof image === "string") {
    return extractPublicIdFromUrl(image);
  }

  if (image.publicId) {
    return image.publicId;
  }

  return extractPublicIdFromUrl(image.url);
};

const deleteCloudinaryAssets = async (publicIds = []) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    return;
  }

  await Promise.all(
    publicIds.map((publicId) =>
      cloudinary.uploader
        .destroy(publicId)
        .catch((error) =>
          console.warn("Failed to delete Cloudinary asset", publicId, error),
        ),
    ),
  );
};

export const listProducts = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 50);
  const search = req.query.search?.trim();
  const categoriesParam = req.query.categories ?? req.query.category;
  const categories = Array.isArray(categoriesParam)
    ? categoriesParam
        .flatMap((value) =>
          value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        )
    : typeof categoriesParam === "string"
      ? categoriesParam
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  const sortField = ALLOWED_SORT_FIELDS.has(req.query.sort) ? req.query.sort : "createdAt";
  const sortOrder = req.query.order === "asc" ? "asc" : "desc";

  const filter = {};

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ title: regex }, { description: regex }, { category: regex }];
  }

  if (categories.length > 0) {
    filter.category = { $in: categories };
  }

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ [sortField]: sortOrder === "asc" ? 1 : -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return res.json({
    data: products.map(serializeProduct),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
      sort: sortField,
      order: sortOrder,
      search: search ?? null,
      categories: categories,
    },
  });
};

export const createProduct = async (req, res) => {
  const { title, description, price, category, stock, images = [] } = req.body ?? {};

  if (!title || !description || price == null || !category || stock == null) {
    return res.status(400).json({ error: "Missing required product fields" });
  }

  const priceNumber = Number(price);
  const stockNumber = Number(stock);

  if (Number.isNaN(priceNumber) || priceNumber < 0) {
    return res.status(400).json({ error: "Price must be a non-negative number" });
  }

  if (!Number.isInteger(Number(stockNumber)) || stockNumber < 0) {
    return res.status(400).json({ error: "Stock must be a non-negative integer" });
  }

  const product = await Product.create({
    title,
    description,
    price: priceNumber,
    category,
    stock: stockNumber,
    images: normalizeImages(images),
  });

  return res.status(201).json(serializeProduct(product));
};

export const getProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id).lean();

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  return res.json(serializeProduct(product));
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const updates = req.body ?? {};

  if (updates.images && !Array.isArray(updates.images)) {
    return res.status(400).json({ error: "Images must be an array" });
  }

  const existingProduct = await Product.findById(id);

  if (!existingProduct) {
    return res.status(404).json({ error: "Product not found" });
  }

  let imagesToDelete = [];

  if (updates.images) {
    const normalizedImages = normalizeImages(updates.images);
    const nextPublicIds = new Set(
      normalizedImages.map((image) => getPublicId(image)).filter(Boolean),
    );
    const previousPublicIds = (existingProduct.images ?? [])
      .map((image) => getPublicId(image))
      .filter(Boolean);

    imagesToDelete = previousPublicIds.filter((publicId) => !nextPublicIds.has(publicId));
    updates.images = normalizedImages;
  }

  if (updates.price != null) {
    const priceNumber = Number(updates.price);
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      return res.status(400).json({ error: "Price must be a non-negative number" });
    }
    updates.price = priceNumber;
  }

  if (updates.stock != null) {
    const stockNumber = Number(updates.stock);
    if (!Number.isInteger(stockNumber) || stockNumber < 0) {
      return res.status(400).json({ error: "Stock must be a non-negative integer" });
    }
    updates.stock = stockNumber;
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true },
  ).lean();

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  if (imagesToDelete.length > 0) {
    await deleteCloudinaryAssets(imagesToDelete);
  }

  return res.json(serializeProduct(product));
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id).lean();

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  await deleteCloudinaryAssets(
    (product.images ?? []).map((image) => getPublicId(image)).filter(Boolean),
  );

  await Product.deleteOne({ _id: id });

  return res.json({ success: true });
};
