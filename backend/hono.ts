import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { ProductService } from "./services/ProductService";

// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Add debugging middleware
app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  console.log('Headers:', Object.fromEntries(c.req.raw.headers.entries()));
  await next();
});

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    onError: ({ error, path, type, input }) => {
      console.error('tRPC Error:', { 
        path, 
        type,
        input,
        error: error.message,
        stack: error.stack 
      });
    },
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running", timestamp: new Date().toISOString() });
});

// Test tRPC endpoint
app.get("/test-trpc", (c) => {
  return c.json({ 
    status: "ok", 
    message: "tRPC backend is configured",
    trpcUrl: "/api/trpc",
    timestamp: new Date().toISOString()
  });
});

// Test OpenFoodFacts connectivity
app.get("/test-off/:barcode", async (c) => {
  const barcode = c.req.param("barcode");
  
  try {
    console.log(`Testing OFF connectivity for barcode: ${barcode}`);
    const result = await ProductService.getProduct(barcode);
    return c.json({
      status: "ok",
      barcode,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('OFF test error:', error);
    return c.json({
      status: "error",
      barcode,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Product lookup endpoint
app.get("/product/:barcode", async (c) => {
  const barcode = c.req.param("barcode");
  
  // Validate barcode is digits only
  if (!/^\d+$/.test(barcode)) {
    return c.json({ ok: false, error: "Invalid barcode" }, 400);
  }
  
  console.log(`REST API: Fetching product for barcode: ${barcode}`);
  
  try {
    const result = await ProductService.getProduct(barcode);
    
    if (result.fromCache) {
      console.log(`REST API: Product found in cache for barcode: ${barcode}`);
    } else if (result.product) {
      console.log(`REST API: Product fetched from ${result.product.source} for barcode: ${barcode}`);
    } else if (result.notFound) {
      console.log(`REST API: Product not found for barcode: ${barcode}`);
    } else if (result.error) {
      console.error(`REST API: Error fetching product for barcode ${barcode}:`, result.error);
    }
    
    // Set cache headers on success
    if (result.ok && (result.product || result.notFound)) {
      c.header("Cache-Control", "public, max-age=3600");
    }
    
    return c.json(result);
  } catch (error) {
    console.error(`REST API: Unexpected error for barcode ${barcode}:`, error);
    return c.json({ 
      ok: false, 
      error: "Internal server error" 
    }, 500);
  }
});

export default app;