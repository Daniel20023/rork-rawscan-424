# 🥗 InIt AI - Nutrition & Ingredient Analysis App

A React Native app built with Expo that helps users analyze food and skincare products using AI-powered ingredient scoring and personalized recommendations.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Expo CLI
- Mobile device with Expo Go app (or iOS Simulator/Android Emulator)

### 1. Install Dependencies
```bash
bun install
```

### 2. **IMPORTANT: Fix Database Issues**

**If you're getting "Database error saving new user" errors:**

1. **Go to your Supabase project dashboard**
2. **Open the SQL Editor**
3. **Copy and paste the entire content from `supabase-setup.sql`**
4. **Run the SQL script**

This will:
- Create all necessary tables (profiles, user_preferences, etc.)
- Set up Row Level Security (RLS) policies
- Create database triggers for automatic profile creation
- **Fix the "Database error saving new user" issue**

### 3. API Keys (Already Configured)

The following APIs are already set up and working:
- ✅ **USDA FoodData Central**: `SCVHb87sNUjla7FhpjRgAj61PDg6Ca4dv1MKnTWm`
- ✅ **Supabase**: Configured and ready
- ✅ **OpenFoodFacts**: No API key needed (free)

### 4. Start Development (Easy Way)

**Linux/Mac:**
```bash
chmod +x dev.sh
./dev.sh
```

**Windows:**
```cmd
dev.bat
```

**Manual Start:**
```bash
# Terminal 1: Backend
bun run backend/server.ts

# Terminal 2: Frontend  
bun start
```

The development scripts will:
- Start backend server on `http://localhost:3000`
- Start Expo development server
- Show QR code for mobile testing
- Open web preview automatically
- Handle cleanup when you stop the servers

### 5. Open on Your Device
- **Mobile**: Scan QR code with Expo Go app
- **Web**: Opens automatically in browser
- **iOS Simulator**: Press `i` in terminal
- **Android Emulator**: Press `a` in terminal

## 📱 Features

### Core Functionality
- **Barcode Scanning**: Real-time barcode detection using device camera
- **OCR Text Recognition**: Extract text from nutrition labels and ingredient lists
- **Comprehensive Nutrition Database**: USDA FoodData Central + OpenFoodFacts + 15+ local products
- **Detailed Micronutrients**: Vitamins (A, C, D, E, K, B-complex) and Minerals (Ca, Fe, K, Mg, P, Zn)
- **Daily Value Tracking**: See percentage of recommended daily intake for each nutrient
- **Nutrition Analysis**: Detailed nutritional information and personalized health scoring
- **Personal Preferences**: Dietary restrictions, allergies, and health goals
- **History & Favorites**: Track scanned products and save favorites
- **Smart Recommendations**: AI-powered alternative product suggestions

### Comprehensive Nutrition Data Stack
1. **USDA FoodData Central** - Primary nutrition database with comprehensive micronutrients (FREE)
2. **OpenFoodFacts** - Fallback product database with international coverage (FREE)
3. **Google ML Kit** - On-device barcode scanning (FREE)
4. **Google Cloud Vision** - OCR for nutrition labels (Pay-as-you-go)
5. **Local Database** - 15+ popular products for offline functionality

## 🏗️ Architecture

### Frontend
- **React Native** with Expo 53
- **TypeScript** for type safety
- **Expo Router** for navigation
- **React Query** for server state management
- **tRPC** for type-safe API calls

### Backend
- **Hono** web framework
- **tRPC** for API routes
- **Supabase** for authentication and data storage
- **Local Product Database** with 15+ real products

### Database Schema
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  dietary_restrictions TEXT[],
  allergens TEXT[],
  health_goals TEXT[],
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Product history
CREATE TABLE product_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  barcode TEXT NOT NULL,
  product_data JSONB,
  scanned_at TIMESTAMP DEFAULT NOW()
);

-- Favorites
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  barcode TEXT NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, barcode)
);
```

## 🛠️ Development

### Project Structure
```
app/                    # Expo Router pages
├── (tabs)/            # Tab navigation
│   ├── (scanner)/     # Barcode scanning
│   ├── search/        # Product search
│   ├── history/       # Scan history
│   ├── favorites/     # Favorite products
│   ├── learn/         # Educational content
│   └── profile/       # User settings
├── product/           # Product detail pages
├── auth.tsx          # Authentication
└── onboarding.tsx    # User onboarding

backend/               # Backend API
├── hono.ts           # Main server
├── trpc/             # tRPC routes
├── services/         # Business logic
└── types/            # TypeScript types

components/           # Reusable UI components
contexts/            # React contexts
hooks/               # Custom hooks
utils/               # Utility functions
mocks/               # Mock data
constants/           # App constants
```

### Adding New Products
Products are stored in `backend/services/ProductService.ts`. To add new products:

1. Add product data to the `products` array in `initializeLocalDatabase()`
2. Use real barcodes when possible
3. Include complete nutrition information
4. Add high-quality product images from Unsplash

### API Endpoints

#### tRPC Routes
- `product.get` - Get product by barcode
- `product.search` - Search products by name
- `product.score` - Get nutrition score
- `ai.ocr` - Extract text from images
- `ai.analyzeIngredients` - Analyze ingredient lists
- `ai.recommendations` - Get product alternatives
- `user.profile` - User profile management
- `user.preferences` - Dietary preferences
- `user.history` - Scan history
- `user.favorites` - Favorite products

#### REST Endpoints
- `GET /api/` - Health check
- `GET /api/product/:barcode` - Get product (REST alternative)
- `GET /api/test-off/:barcode` - Test OpenFoodFacts connectivity

### Environment Variables
```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-project.rork.com

# Nutrition Database APIs
USDA_API_KEY=DEMO_KEY
OFF_BASE=https://world.openfoodfacts.org/api/v0
GOOGLE_CLOUD_VISION_API_KEY=your_google_vision_api_key

# Site URL for auth redirects
EXPO_PUBLIC_SITE_URL=exp://192.168.1.100:8081
```

## 🚀 Deployment

### Backend Deployment
For development, run the backend locally:
```bash
bun run backend/server.ts
```

For production, deploy the backend to your preferred hosting service (Vercel, Railway, etc.).

### Mobile App Deployment
For production deployment:
1. Build the app: `expo build`
2. Submit to app stores: `expo submit`
3. Update environment variables for production

### Web Deployment
The app is React Native Web compatible and can be deployed to any static hosting service.

## 🧪 Testing

### Test Barcodes
Use these barcodes to test the local product database:
- `049000028391` - Coca-Cola Classic
- `028400064316` - Lay's Classic Potato Chips
- `044000032319` - Oreo Original Cookies
- `3017620422003` - Nutella Hazelnut Spread
- `016000275447` - Cheerios Original
- `033383000001` - Bananas
- `033383000002` - Apples - Gala

### API Testing
```bash
# Test backend health
curl http://localhost:3000/api/

# Test product lookup
curl http://localhost:3000/api/product/049000028391

# Test OpenFoodFacts connectivity
curl http://localhost:3000/api/test-off/3017620422003
```

## 🔧 Troubleshooting

### App Appears "Idle" or Stuck on Loading Screen

If your app is stuck on the loading screen and appears idle:

**Quick Fix:**
1. **Wait 8 seconds** - The app has a built-in timeout to prevent infinite loading
2. **Check Backend** - Ensure backend server is running: `bun run backend/server.ts`
3. **Use Backend Test** - Tap the "Backend Test" button on the welcome screen
4. **Restart App** - Shake device → Reload, or restart Expo server

### Common Issues

1. **"Database error saving new user" / Auth Errors**
   - **Solution**: Run the `supabase-setup.sql` script in your Supabase SQL Editor
   - This updates the database triggers to handle user creation properly
   - The script fixes RLS policies and creates missing tables

2. **App won't load on phone**
   - Make sure your phone and computer are on the same WiFi network
   - Try restarting the Expo development server with `bun start`
   - Clear Expo Go app cache

3. **Backend Connection Errors**
   - Ensure backend server is running: `bun run backend/server.ts`
   - Check `EXPO_PUBLIC_RORK_API_BASE_URL` in `.env` (should be `http://localhost:3000`)
   - Verify backend is accessible at the configured URL
   - Use the "Backend Test" page in the app to diagnose issues

4. **Authentication Timeout Issues**
   - Check Supabase URL and keys in `.env`
   - Verify internet connection
   - Try clearing app data and restarting
   - The app will automatically timeout after 8 seconds and show the welcome screen

4. **Camera Not Working**
   - Grant camera permissions
   - Test on physical device (camera doesn't work in simulators)
   - Check if `expo-camera` is properly installed

5. **Products Not Found**
   - Try different barcode formats (with/without leading zeros)
   - Check if product exists in OpenFoodFacts
   - Add product to local database if needed

### Debug Mode
Enable debug logging:
```bash
DEBUG=expo* bun start
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation