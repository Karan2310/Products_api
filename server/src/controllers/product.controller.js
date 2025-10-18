import Product from "../models/product.model.js";

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
    images: (obj.images ?? []).map((image) => image.url ?? image),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
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

  const parsedImages = Array.isArray(images) ? images : [];

  const product = await Product.create({
    title,
    description,
    price: priceNumber,
    category,
    stock: stockNumber,
    images: parsedImages.map((url) => ({ url })),
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

  if (updates.images) {
    updates.images = updates.images.map((url) => ({ url }));
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

  return res.json(serializeProduct(product));
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findByIdAndDelete(id).lean();

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  return res.json({ success: true });
};
