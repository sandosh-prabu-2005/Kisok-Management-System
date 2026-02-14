# Backend - Kiosk Management System

## Project Structure

```
backend/
├── models/
│   ├── Product.js      # Product model schema
│   ├── User.js         # User model schema
│   ├── Sale.js         # Sale/Transaction model schema
│   └── Feedback.js     # Feedback model schema
├── routes/
│   ├── products.js     # Product endpoints
│   ├── users.js        # User endpoints
│   ├── sales.js        # Sales/Checkout endpoints
│   ├── recommendations.js  # AI recommendations endpoint
│   └── feedback.js     # Feedback submission endpoint
├── server.js           # Main Express server
├── seed.js             # Database seeding script
└── .env                # Environment variables
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Edit `backend/.env` to set your MongoDB URI:
```env
MONGO_URI=mongodb://localhost:27017/kiosk-db
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/?authMechanism=SCRAM-SHA-1&authSource=admin
```

### 3. Seed the Database (First Time Setup)
To populate the database with initial products and users:
```bash
npm run seed
```

This will:
- Connect to MongoDB
- Create collections automatically
- Clear existing data
- Insert sample products (8 items)
- Insert sample users (4 students + 1 admin)

### 4. Start the Server
```bash
npm run server
```

Or from the project root (runs React + Backend):
```bash
npm start
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products/update-quantity` - Update product quantity

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user

### Sales
- `GET /api/sales` - Get all sales records
- `POST /api/sales` - Record a sale/checkout

### Recommendations
- `GET /api/recommendations?userId=STU001` - Get AI-powered recommendations

### Feedback
- `POST /api/feedback` - Submit feedback

### Health
- `GET /api/health` - Server health check

## Environment Variables

```env
MONGO_URI=mongodb://localhost:27017/kiosk-db
PORT=5000
```

## Models

### Product
```javascript
{
  name: String,
  price: Number,
  quantity: Number,
  description: String,
  image: String,
  createdAt: Date
}
```

### User
```javascript
{
  admissionNumber: String (unique),
  name: String,
  department: String,
  wallet_balance: Number,
  role: String,
  email: String,
  password: String,
  createdAt: Date
}
```

### Sale
```javascript
{
  userId: String,
  userEmail: String,
  items: Array,
  total: Number,
  timestamp: Number,
  order_id: String (unique),
  createdAt: Date
}
```

### Feedback
```javascript
{
  name: String,
  admissionNumber: String,
  message: String,
  timestamp: Date
}
```

## Sample Data (from seed.js)

### Users:
- STU001 - John Doe (CSE) - ₹500
- STU002 - Jane Smith (ECE) - ₹750
- STU003 - Raj Kumar (MECH) - ₹600
- STU004 - Priya Sharma (CSE) - ₹800
- ADMIN001 - Admin User - ₹10000

### Products:
- Coffee (₹50)
- Tea (₹40)
- Sandwich (₹100)
- Chips (₹30)
- Juice (₹60)
- Cookie (₹20)
- Mineral Water (₹25)
- Donut (₹35)
