"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Processing sign-in, please wait…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const handleAuthCallback = async () => {
      try {
        console.log("🔐 Starting auth callback processing...");
        
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          console.error("❌ Not in browser environment");
          return;
        }

        // Log current URL for debugging
        console.log("📍 Current URL:", window.location.href);
        console.log("📍 URL search params:", window.location.search);
        console.log("📍 URL hash:", window.location.hash);

        // Check Supabase configuration
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.error("❌ Missing Supabase configuration");
          setError("Configuration error. Please contact support.");
          setMessage("Configuration error. Please contact support.");
          return;
        }

        console.log("✅ Supabase URL configured:", supabaseUrl);
        console.log("✅ Supabase key configured:", supabaseKey ? "Yes" : "No");

        // Test Supabase connection first
        try {
          const { data: testData, error: testError } = await supabase.auth.getSession();
          console.log("🔍 Supabase connection test:", { 
            hasData: !!testData, 
            hasError: !!testError,
            errorMessage: testError?.message 
          });
        } catch (testErr) {
          console.error("❌ Supabase connection failed:", testErr);
          setError("Connection error. Please check your internet connection and try again.");
          setMessage("Connection error. Please check your internet connection and try again.");
          return;
        }

        // Check for error parameters in URL first
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const errorParam = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        
        // Check if this is a database error (before handling other errors)
        const isDatabaseError = 
          errorParam === 'server_error' && 
          errorDescription?.includes('Database error saving new user');
        
        // If there's an error in the URL (and it's not a database error we can fix), handle it immediately
        if (errorParam && !isDatabaseError) {
          console.error("❌ OAuth error in URL:", errorParam, errorDescription);
          setError(`Authentication failed: ${errorDescription || errorParam}`);
          setMessage("Sign-in failed. Please try again or contact support.");
          
          timeoutId = setTimeout(() => {
            if (mounted) {
              router.replace("/");
            }
          }, 3000);
          return;
        }

        // For PKCE flow, Supabase needs to process the URL hash parameters
        // The createBrowserClient with detectSessionInUrl: true should handle this automatically
        // But we need to wait for the auth state change event to ensure URL params are processed
        
        // Check if URL has auth parameters (code, access_token, etc.)
        const hasAuthParams = 
          hashParams.has('access_token') || 
          hashParams.has('code') || 
          urlParams.has('code') ||
          window.location.hash.includes('access_token');
        
        // First, try to get session immediately (Supabase may have already processed it)
        let sessionData = await supabase.auth.getSession();
        
        // If no session yet and we have auth params, wait for auth state change (PKCE flow processes URL hash)
        if (!sessionData.data.session && hasAuthParams) {
          console.log("⏳ Waiting for auth state change to process URL parameters...");
          
          // Wait for auth state change with timeout
          const sessionPromise = new Promise<{ data: any; error: any }>((resolve) => {
            let resolved = false;
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
              if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && !resolved) {
                resolved = true;
                subscription.unsubscribe();
                resolve({ data: { session }, error: null });
              }
            });
            
            // Also try getting session again after a short delay (Supabase might process it asynchronously)
            setTimeout(async () => {
              if (!resolved) {
                const retrySession = await supabase.auth.getSession();
                if (retrySession.data.session && !resolved) {
                  resolved = true;
                  subscription.unsubscribe();
                  resolve({ data: { session: retrySession.data.session }, error: null });
                }
              }
            }, 500);
            
            // Timeout after 5 seconds
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                subscription.unsubscribe();
                resolve({ data: { session: null }, error: { message: 'Timeout waiting for authentication' } });
              }
            }, 5000);
          });
          
          sessionData = await sessionPromise;
        } else if (!sessionData.data.session && !hasAuthParams) {
          // No auth params and no session - user might have navigated here directly
          console.log("⚠️ No authentication parameters found in URL");
          setError("No authentication data found. Please try signing in again.");
          setMessage("No authentication data found. Redirecting…");
          
          timeoutId = setTimeout(() => {
            if (mounted) {
              router.replace("/");
            }
          }, 2000);
          return;
        }

        // Process the auth callback
        console.log("🔄 Processing auth callback...");
        const { data, error } = sessionData;
        
        if (error) {
          console.error("❌ Auth callback error:", error);
          setError(`Authentication failed: ${error.message}`);
          setMessage("Sign-in failed. Please try again or contact support.");
          
          // Redirect to home page after a delay
          timeoutId = setTimeout(() => {
            if (mounted) {
              router.replace("/");
            }
          }, 3000);
          return;
        }

        if (mounted) {
          if (data.session) {
            console.log("✅ Authentication successful:", data.session.user.email);
            

            // If there was a database error, try to fix it
            if (isDatabaseError) {
              console.log("🔧 Attempting to fix missing user record...");
              try {
                const response = await fetch('/api/users/fix-missing', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: data.session.user.id }),
                });
                
                if (response.ok) {
                  console.log("✅ User record fixed successfully");
                  setMessage("Account setup complete! Redirecting…");
                } else {
                  console.warn("⚠️ Failed to fix user record, but continuing...");
                  setMessage("Signed in successfully! Redirecting…");
                }
              } catch (fixError) {
                console.error("❌ Error fixing user record:", fixError);
                setMessage("Signed in successfully! Redirecting…");
              }
            } else {
              setMessage("Signed in successfully! Redirecting…");
            }
            
            setError(null);
            
            // Supabase automatically processes URL hash parameters and updates session
            // AuthContext already has an onAuthStateChange listener that will update the state
            // We just need to wait a bit for React to re-render with the updated state
            // No need to create another subscription - AuthContext handles it
            
            // Wait for AuthContext to update (it listens to onAuthStateChange)
            // Give React time to process the state update before redirecting
            await new Promise(resolve => setTimeout(resolve, 800));
            
            if (!mounted) return;
            
            // Double-check session is still valid before redirecting
            const { data: { session: finalSession } } = await supabase.auth.getSession();
            if (!finalSession) {
              console.log("⚠️ Session lost during wait, redirecting to home");
              router.replace("/");
              return;
            }
            
            // Redirect to saved path or default to text-to-video
            const savedPath = typeof window !== 'undefined' 
              ? sessionStorage.getItem('redirectAfterLogin')
              : null;
            const redirectPath = savedPath || '/veo4-text-to-video';
            
            // Clean up redirect path from storage
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('redirectAfterLogin');
            }
            
            console.log("🔄 Redirecting to:", redirectPath);
            router.replace(redirectPath);
          } else {
            console.log("⚠️ No session found");
            setMessage("No session found. Redirecting to home…");
            setError(null);
            
            // Redirect to home page
            timeoutId = setTimeout(() => {
              if (mounted) {
                router.replace("/");
              }
            }, 2000);
          }
        }
      } catch (e) {
        console.error("❌ Unexpected error in auth callback:", e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred";
        setError(`Error: ${errorMessage}`);
        setMessage("An unexpected error occurred. Please try again.");
        
        // Redirect to home page after error
        timeoutId = setTimeout(() => {
          if (mounted) {
            router.replace("/");
          }
        }, 3000);
      }
    };

    // Add a small delay to ensure the page is fully loaded
    timeoutId = setTimeout(handleAuthCallback, 100);

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {error ? "Authentication Error" : "Processing Sign-in"}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {message}
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <div className="text-xs text-gray-500">
            If this page doesn't redirect automatically, 
            <a href="/" className="text-blue-600 hover:text-blue-800 underline ml-1">
              click here to go home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

