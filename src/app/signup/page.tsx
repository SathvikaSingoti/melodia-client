"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { EyeIcon, EyeOffIcon } from "lucide-react";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-transparent' };
    let score = 0;
    if (pass.length > 5) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' };
    if (score === 2 || score === 3) return { score, label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500', textColor: 'text-green-500' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (strength.score <= 1) {
      setError("Password is too weak. Use at least 8 characters and a special character.");
      return;
    }

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        username,
        email,
        password,
      });
      login(res.data.token, res.data.user);
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-[420px] p-8 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/20 blur-[60px] rounded-full pointer-events-none"></div>
        
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Melodia
          </h1>
          <p className="text-gray-400 text-sm">Create a new account</p>
        </div>

        {error && !error.includes("already exists") && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {error && error.includes("already exists") && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center flex flex-col gap-1">
            <span>Account already exists.</span>
            <Link href="/login" className="text-white underline hover:text-primary transition-colors">
              Login instead?
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-bg-primary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white placeholder-gray-500"
              placeholder="johndoe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-bg-primary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white placeholder-gray-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-bg-primary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white placeholder-gray-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {password && (
              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-1 flex-1 mr-4">
                  {[1, 2, 3, 4].map(level => (
                    <div 
                      key={level} 
                      className={`h-1.5 flex-1 rounded-full ${strength.score >= level ? strength.color : 'bg-gray-700'}`}
                    ></div>
                  ))}
                </div>
                <span className={`text-xs font-medium ${strength.textColor}`}>{strength.label}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-bg-primary/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-white placeholder-gray-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium hover:opacity-90 transition-opacity mt-2"
          >
            Create Account
          </button>
        </form>

        <div className="my-6 flex items-center relative z-10">
          <div className="flex-1 border-t border-border"></div>
          <span className="px-3 text-xs text-gray-500 font-medium">OR</span>
          <div className="flex-1 border-t border-border"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full relative z-10 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-gray-400 relative z-10">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
