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
            const response = await fetch(url, {
              ...options,
              headers: {
                ...options?.headers,
              },
            });
            
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
                throw new Error(`Backend not properly configured. Got HTML response instead of JSON. Status: ${response.status}. Please ensure the backend is deployed and accessible.`);
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
            
            // If it's a network error, provide a more helpful message
            if (error instanceof TypeError && error.message.includes('fetch')) {
              throw new Error('Network error: Unable to connect to backend. Please check your internet connection and backend URL.');
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