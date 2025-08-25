import { Hono } from "hono";
import { cors } from "hono/cors";
import apiApp from "./hono";

const port = process.env.PORT || 3000;

console.log(`🚀 Starting backend server on port ${port}`);
console.log(`📡 API will be available at http://localhost:${port}/api`);
console.log(`🔧 tRPC endpoint: http://localhost:${port}/api/trpc`);

// Create main app and mount API at /api
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Mount the API app at /api
app.route('/api', apiApp);

// Root health check
app.get('/', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'InIt AI Backend Server', 
    api: '/api',
    trpc: '/api/trpc',
    timestamp: new Date().toISOString() 
  });
});

// Use Bun's built-in server
Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`✅ Backend server is running on http://localhost:${port}`);
console.log(`🔍 Health check: http://localhost:${port}/`);
console.log(`🔍 API health check: http://localhost:${port}/api/`);
console.log(`📋 Test tRPC: http://localhost:${port}/api/test-trpc`);