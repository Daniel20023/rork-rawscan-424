import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from "./supabase";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  
  if (!baseUrl) {
    console.warn('EXPO_PUBLIC_RORK_API_BASE_URL not found, using fallback');
    // For development, try to use the tunnel URL from Expo
    const expoUrl = process.env.EXPO_PUBLIC_URL;
    if (expoUrl) {
      return expoUrl;
    }
    return 'http://localhost:3000'; // Local fallback
  }
  
  console.log('tRPC Base URL:', baseUrl);
  return baseUrl;
};

// Test backend connectivity and provide helpful error messages
const testBackendHealth = async (url: string): Promise<{ ok: boolean; error?: string }> => {
  try {
    console.log('🔍 Testing backend health at:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(`${url}/api/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NutritionApp/1.0',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('🔍 Backend health response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });
    
    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        error: `Backend returned ${response.status}: ${response.statusText}. Response: ${text.substring(0, 200)}`
      };
    }
    
    const data = await response.json();
    console.log('✅ Backend health check successful:', data);
    
    return { ok: true };
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { ok: false, error: 'Backend health check timed out. The server may be down or slow to respond.' };
      }
      
      if (error.message.includes('fetch')) {
        return { ok: false, error: `Cannot connect to backend at ${url}. Please check if the backend is deployed and accessible.` };
      }
      
      return { ok: false, error: error.message };
    }
    
    return { ok: false, error: 'Unknown error during backend health check' };
  }
};

// Export the health check function for use in components
export const testBackendConnection = testBackendHealth;



export const createTRPCClient = () => {
  return trpc.createClient({
    links: [
      httpLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        headers: async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {
              'content-type': 'application/json',
              'accept': 'application/json',
            };
            
            if (session?.access_token) {
              headers.authorization = `Bearer ${session.access_token}`;
            }
            
            return headers;
          } catch (error) {
            console.warn('Failed to get session for tRPC headers:', error);
            return {
              'content-type': 'application/json',
              'accept': 'application/json',
            };
          }
        },
        fetch: async (url, options) => {
          console.log('🚀 tRPC Request:', {
            url,
            method: options?.method || 'GET',
            hasBody: !!options?.body
          });
          
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
              headers: {
                ...options?.headers,
                'User-Agent': 'NutritionApp/1.0',
              },
            });
            
            clearTimeout(timeoutId);
            
            console.log('📡 tRPC Response:', {
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
              contentType: response.headers.get('content-type')
            });
            
            if (!response.ok) {
              const text = await response.text();
              console.error('❌ tRPC Response error body:', text.substring(0, 500));
              
              // If we get HTML instead of JSON, it means the backend isn't properly set up
              if (text.includes('<html>') || text.includes('<!DOCTYPE')) {
                const baseUrl = getBaseUrl();
                throw new Error(`Backend not properly configured. Got HTML response instead of JSON. Status: ${response.status}. Please ensure the backend is deployed and accessible at ${baseUrl}`);
              }
              
              // Handle specific HTTP errors
              if (response.status === 404) {
                const baseUrl = getBaseUrl();
                throw new Error(`Backend endpoint not found (404). Check if the backend is deployed correctly at ${baseUrl}/api/trpc`);
              }
              
              if (response.status >= 500) {
                throw new Error(`Backend server error (${response.status}). The backend may be down or experiencing issues.`);
              }
              
              // Create a new response with the text for tRPC to handle
              return new Response(text, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
            }
            
            return response;
          } catch (error) {
            console.error('💥 tRPC Fetch error:', error);
            
            // Handle timeout errors
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Request timeout: Backend is taking too long to respond. Please try again.');
            }
            
            // If it's a network error, provide a more helpful message
            if (error instanceof TypeError && error.message.includes('fetch')) {
              const baseUrl = getBaseUrl();
              throw new Error(`Network error: Unable to connect to backend at ${baseUrl}. Please check your internet connection and backend URL.`);
            }
            
            throw error;
          }
        },
      }),
    ],
  });
};

// Create a default client for non-React usage
export const trpcClient = createTRPCClient();