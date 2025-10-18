const createVariants = (category, baseItems, variants) =>
  baseItems.flatMap((item) =>
    variants.map((variant, index) => ({
      title: `${item.title} - ${variant}`,
      description: `${item.description} Available in ${variant.toLowerCase()} variant for seasonal styling.`,
      category,
      price: item.price + index * item.priceIncrement,
      stock: Math.max(25, item.stock - index * 5),
    })),
  );

// ---------------------- BASES ----------------------

const menswearBase = [
  {
    title: "Heritage Oxford Shirt",
    description:
      "Classic slim-fit oxford shirt woven from premium cotton with button-down collar and barrel cuffs.",
    price: 2699,
    priceIncrement: 120,
    stock: 140,
  },
  {
    title: "Atlas Stretch Chinos",
    description:
      "Tailored chinos featuring 360° stretch fabric, reinforced seams, and subtle coin pocket detail.",
    price: 3199,
    priceIncrement: 150,
    stock: 160,
  },
  {
    title: "Summit Lightweight Jacket",
    description:
      "Lightweight water-resistant jacket with mesh lining, concealed hood, and wind flap closure.",
    price: 4499,
    priceIncrement: 180,
    stock: 120,
  },
  {
    title: "Coastal Linen Shorts",
    description:
      "Breathable linen blend shorts with tailored waistband, coconut shell buttons, and rolled cuffs.",
    price: 1999,
    priceIncrement: 90,
    stock: 170,
  },
  {
    title: "Metro Knit Polo",
    description:
      "Mercerised cotton knit polo with ribbed collar, concealed placket, and side vents for ease of movement.",
    price: 2499,
    priceIncrement: 110,
    stock: 150,
  },
];

const womenswearBase = [
  {
    title: "Aurora Wrap Dress",
    description:
      "Knee-length wrap dress in soft viscose crepe with flutter sleeves and tie waist detailing.",
    price: 3499,
    priceIncrement: 160,
    stock: 130,
  },
  {
    title: "Velvet Bloom Saree",
    description:
      "Half-and-half georgette saree with velvet pallu, scallop edging, and hand-embroidered motifs.",
    price: 8299,
    priceIncrement: 220,
    stock: 60,
  },
  {
    title: "Serenade Pleated Skirt",
    description:
      "Accordion pleated midi skirt with satin waistband and concealed zipper fastening.",
    price: 2799,
    priceIncrement: 130,
    stock: 150,
  },
  {
    title: "Luna Satin Blouse",
    description:
      "Relaxed-fit satin blouse with bishop sleeves, covered buttons, and high-low hem.",
    price: 2299,
    priceIncrement: 100,
    stock: 160,
  },
  {
    title: "Willow Cotton Kurti",
    description:
      "A-line kurti in breathable cotton dobby featuring lace inserts and side pockets.",
    price: 1899,
    priceIncrement: 90,
    stock: 180,
  },
];

const accessoriesBase = [
  {
    title: "Opal Statement Necklace",
    description:
      "Gold-plated necklace with iridescent opal stones, adjustable lobster clasp, and anti-tarnish coating.",
    price: 1899,
    priceIncrement: 95,
    stock: 200,
  },
  {
    title: "Voyage Leather Tote",
    description:
      "Full grain leather tote with magnetic closure, zip pocket, and detachable shoulder strap.",
    price: 4299,
    priceIncrement: 180,
    stock: 120,
  },
  {
    title: "Solstice Silk Scarf",
    description:
      "Hand-hemmed mulberry silk scarf printed with geometric artwork and finished with rolled edges.",
    price: 1499,
    priceIncrement: 70,
    stock: 220,
  },
  {
    title: "Nova Shield Sunglasses",
    description:
      "UV400 protective sunglasses with acetate frame, spring hinges, and gradient lenses.",
    price: 2599,
    priceIncrement: 110,
    stock: 140,
  },
  {
    title: "Echo Leather Belt",
    description:
      "Vegetable-tanned leather belt with brushed metal buckle and five-hole adjustability.",
    price: 1599,
    priceIncrement: 60,
    stock: 180,
  },
];

const footwearBase = [
  {
    title: "Stride Runner Sneakers",
    description:
      "Lightweight running sneakers with knit upper, responsive EVA midsole, and heel counter support.",
    price: 3499,
    priceIncrement: 150,
    stock: 170,
  },
  {
    title: "Nimbus Trail Boots",
    description:
      "Waterproof trail boots with rugged outsole, memory foam insole, and padded ankle support.",
    price: 5799,
    priceIncrement: 200,
    stock: 110,
  },
  {
    title: "Velvet Luxe Loafers",
    description:
      "Premium suede loafers with cushioned footbed, metal bit detail, and flexible rubber sole.",
    price: 3999,
    priceIncrement: 130,
    stock: 140,
  },
  {
    title: "Aurora Ballet Flats",
    description:
      "Rounded toe ballet flats with soft leather upper, elastic trim, and memory foam padding.",
    price: 2799,
    priceIncrement: 120,
    stock: 160,
  },
  {
    title: "Summit Trek Sandals",
    description:
      "Outdoor trek sandals with adjustable straps, contoured footbed, and non-slip outsole.",
    price: 2499,
    priceIncrement: 110,
    stock: 150,
  },
];

// ---------------------- VARIANTS ----------------------

const menswearVariants = [
  "Charcoal Grey",
  "Navy Blue",
  "Olive Green",
  "Sandstone",
  "Maroon Wine",
];

const womenswearVariants = [
  "Blush Pink",
  "Teal Lagoon",
  "Jet Black",
  "Sunset Orange",
  "Ivory Pearl",
];

const accessoriesVariants = [
  "Polished Gold",
  "Brushed Silver",
  "Rose Gold",
  "Matte Black",
  "Champagne",
];

const footwearVariants = [
  "Classic Black",
  "Arctic White",
  "Desert Tan",
  "Midnight Blue",
  "Burgundy",
];

// ---------------------- PRODUCTS ----------------------

const products = [
  ...createVariants("Menswear", menswearBase, menswearVariants),
  ...createVariants("Womenswear", womenswearBase, womenswearVariants),
  ...createVariants("Accessories", accessoriesBase, accessoriesVariants),
  ...createVariants("Footwear", footwearBase, footwearVariants),
];

export default products;