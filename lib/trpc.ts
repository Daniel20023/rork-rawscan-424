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

// Test if backend is accessible
const testBackendConnection = async (url: string): Promise<boolean> => {
  try {
    console.log('Testing backend connection to:', url);
    const response = await fetch(`${url}/api/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    console.log('Backend test response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    
    return response.ok;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
};



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
          console.log('tRPC Request:', {
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
              },
            });
            
            clearTimeout(timeoutId);
            
            console.log('tRPC Response:', {
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
              contentType: response.headers.get('content-type')
            });
            
            if (!response.ok) {
              const text = await response.text();
              console.error('tRPC Response error body:', text.substring(0, 500));
              
              // If we get HTML instead of JSON, it means the backend isn't properly set up
              if (text.includes('<html>') || text.includes('<!DOCTYPE')) {
                throw new Error(`Backend not properly configured. Got HTML response instead of JSON. Status: ${response.status}. Please ensure the backend is deployed and accessible at ${getBaseUrl()}`);
              }
              
              // Handle specific HTTP errors
              if (response.status === 404) {
                throw new Error(`Backend endpoint not found (404). Check if the backend is deployed correctly at ${getBaseUrl()}/api/trpc`);
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
            console.error('tRPC Fetch error:', error);
            
            // Handle timeout errors
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Request timeout: Backend is taking too long to respond. Please try again.');
            }
            
            // If it's a network error, provide a more helpful message
            if (error instanceof TypeError && error.message.includes('fetch')) {
              throw new Error(`Network error: Unable to connect to backend at ${getBaseUrl()}. Please check your internet connection and ensure the backend is running.`);
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