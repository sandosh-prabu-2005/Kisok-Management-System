require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");
const Product = require("./models/Product");
const User = require("./models/User");

// Sample data
const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop";
const sampleProducts = [
  {
    name: "Coffee",
    price: 50,
    quantity: 20,
    description: "Freshly brewed hot coffee. Rich and aromatic espresso-based beverage perfect for your morning or afternoon boost. Made from premium quality beans.",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop",
    category: "Beverages",
    ingredients: "Coffee beans, Water",
    allergens: "None",
  },
  {
    name: "Tea",
    price: 40,
    quantity: 25,
    description: "Soothing hot tea with a delicate flavor. Choose between various blends including black tea, green tea, and herbal infusions. A perfect refreshment anytime.",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop",
    category: "Beverages",
    ingredients: "Tea leaves, Water",
    allergens: "None",
  },
  {
    name: "Sandwich",
    price: 100,
    quantity: 15,
    description: "Delicious multi-layered sandwich loaded with fresh vegetables, premium meats, and our special sauce. Made fresh daily with quality ingredients.",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=300&fit=crop",
    category: "Food",
    ingredients: "Bread, lettuce, tomato, cheese, ham",
    allergens: "Gluten, Dairy",
  },
  {
    name: "Chips",
    price: 30,
    quantity: 40,
    description: "Crispy and crunchy snack with perfect seasoning. Light and airy potato chips with salt and vinegar flavor. Great for snacking anytime.",
    image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=300&h=300&fit=crop",
    category: "Snacks",
    ingredients: "Potatoes, vegetable oil, salt",
    allergens: "None",
  },
  {
    name: "Juice",
    price: 60,
    quantity: 30,
    description: "Fresh and refreshing fruit juice. Packed with natural vitamins and minerals from freshly squeezed fruits. Perfect for a healthy refreshment.",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&h=300&fit=crop",
    category: "Beverages",
    ingredients: "Mixed fruits, water",
    allergens: "None",
  },
  {
    name: "Cookie",
    price: 20,
    quantity: 50,
    description: "Sweet and delicious cookie with a perfect balance of texture. Soft on the inside with a crispy edge. Contains chocolate chips throughout.",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&h=300&fit=crop",
    category: "Snacks",
    ingredients: "Flour, sugar, butter, chocolate chips, eggs",
    allergens: "Gluten, Eggs, Dairy",
  },
  {
    name: "Mineral Water",
    price: 25,
    quantity: 60,
    description: "Pure and refreshing mineral water. Naturally filtered and packed with essential minerals. Perfect for staying hydrated throughout the day.",
    image: "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=300&h=300&fit=crop",
    category: "Beverages",
    ingredients: "Filtered mineral water",
    allergens: "None",
  },
  {
    name: "Donut",
    price: 35,
    quantity: 35,
    description: "Glazed donut with a soft and fluffy interior. Perfectly balanced sweetness with a light sugar coating. A delightful treat that melts in your mouth.",
    image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=300&h=300&fit=crop",
    category: "Snacks",
    ingredients: "Flour, sugar, eggs, milk, yeast",
    allergens: "Gluten, Eggs, Dairy",
  },
];

const sampleUsers = [
  {
    admissionNumber: "19332",
    name: "John Doe",
    department: "CSE",
    wallet_balance: 500,
    role: "user",
    email: "john@example.com",
    password: "hashed_password_1",
  },
  {
    admissionNumber: "STU002",
    name: "Jane Smith",
    department: "ECE",
    wallet_balance: 750,
    role: "user",
    email: "jane@example.com",
    password: "hashed_password_2",
  },
  {
    admissionNumber: "STU003",
    name: "Raj Kumar",
    department: "MECH",
    wallet_balance: 600,
    role: "user",
    email: "raj@example.com",
    password: "hashed_password_3",
  },
  {
    admissionNumber: "STU004",
    name: "Priya Sharma",
    department: "CSE",
    wallet_balance: 800,
    role: "user",
    email: "priya@example.com",
    password: "hashed_password_4",
  },
  {
    admissionNumber: "ADMIN001",
    name: "Admin User",
    department: "Admin",
    wallet_balance: 10000,
    role: "admin",
    email: "admin@example.com",
    password: "hashed_admin_password",
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
    });

    console.log("✓ Connected to MongoDB");

    // Clear existing users; keep products to preserve stock quantities
    await User.deleteMany({});
    console.log("✓ Cleared existing users");

    // Upsert sample products, preserving existing quantities (stock)
    const existingProducts = await Product.find(
      { name: { $in: sampleProducts.map((p) => p.name) } },
      { name: 1, quantity: 1 }
    ).lean();
    const quantityByName = new Map(
      existingProducts.map((p) => [p.name, p.quantity])
    );

    const productsWithImages = sampleProducts.map((product) => ({
      ...product,
      image: product.image || DEFAULT_PRODUCT_IMAGE,
      quantity: quantityByName.has(product.name)
        ? quantityByName.get(product.name)
        : product.quantity,
    }));

    const productOps = productsWithImages.map((product) => ({
      updateOne: {
        filter: { name: product.name },
        update: { $set: product },
        upsert: true,
      },
    }));
    await Product.bulkWrite(productOps);
    console.log(`✓ Upserted ${productsWithImages.length} products`);

    // Insert sample users
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`✓ Added ${createdUsers.length} users`);

    console.log("\n✓ Database seeded successfully!");
    console.log("\nProducts upserted:");
    productsWithImages.forEach((p) =>
      console.log(`  - ${p.name} (₹${p.price})`)
    );
    console.log("\nUsers added:");
    createdUsers.forEach((u) =>
      console.log(`  - ${u.name} (${u.admissionNumber})`)
    );

    await mongoose.connection.close();
    console.log("\n✓ Database connection closed");
    process.exit(0);
  } catch (err) {
    console.error("✗ Error seeding database:", err);
    process.exit(1);
  }
};

seedDatabase();
