"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get("token");
      
      if (!token) {
        router.push("/login?error=auth_failed");
        return;
      }

      try {
        // Temporarily set token in localStorage for the axios request to use it
        localStorage.setItem("melodia_token", token);
        
        // Fetch user data
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Use the auth context login method to properly store token and user
        login(token, res.data);

        // Redirect based on onboarding status
        if (res.data.onboardingCompleted) {
          router.push("/explore");
        } else {
          router.push("/onboarding");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        localStorage.removeItem("melodia_token");
        router.push("/login?error=auth_failed");
      }
    };

    handleAuth();
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-white mb-2">Authenticating...</h2>
        <p className="text-gray-400">Please wait while we log you in.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center text-white">Loading...</div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
