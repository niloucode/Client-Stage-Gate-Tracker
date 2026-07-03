"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Hanken_Grotesk } from "next/font/google";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { PasswordInput } from "@/features/auth/ui/PasswordInput";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "../../../features/auth/context/auth_provider";
import { AuthError } from "@supabase/supabase-js";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { user } = useAuth();

  const handleSignIn = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    let error_message = handleError(error);

    if (error_message) {
      setError(error_message);
      return;
    }

    //reload after authprovider gets user data
    router.refresh();
  };

  function handleError(error: AuthError | null) {
    if (email == "" && password == "") return "Email and Password are missing";
    else if (email == "") return "Email is missing";
    else if (password == "") return "Password is missing";
    else if (error) return error.message;
    else return null;
  }

  return (
    <div className={`${hanken.className} flex min-h-screen w-full`}>
      {/* ── Left Panel ── */}
      <div className="flex flex-col w-full lg:w-[58%] bg-[#F8F9FB] px-10 py-10">
        {/* Brand mark */}
        <div>
          <Image
            src="/assets/logo/asceoft-logo-black.svg"
            alt="Asceoft"
            width={91}
            height={18}
            unoptimized
          />
          <p className="text-[9px] font-semibold tracking-[0.18em] text-gray-400 uppercase mt-1.5">
            Studio Portal
          </p>
        </div>

        {/* Form — vertically centred */}
        <div className="flex flex-col justify-center flex-1">
          <div className="w-full max-w-[340px] mx-auto">
            <div className="mb-7">
              <h1 className="text-[22px] font-semibold text-gray-900 leading-snug">
                Welcome back
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Sign in to your workspace
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Email */}
              <div>
                <Label htmlFor="email" className="mb-1.5">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="#"
                    className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p
                  className="text-sm text-red-600 bg-red-50 border border-red-200
                  rounded-md px-3 py-2"
                >
                  {error}
                </p>
              )}

              <Button type="submit">Sign In</Button>
            </form>

            <p className="mt-4 text-xs text-gray-400 text-center leading-relaxed">
              You&apos;ll be directed to your role-specific dashboard after
              signing in
            </p>

            {/* OR divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-[#F8F9FB] px-3 text-gray-400">OR</span>
              </div>
            </div>

            <p className="text-center">
              <Link
                href="/signup"
                className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Sign up for an account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            By signing in you agree to Asceoft&apos;s{" "}
            <Link
              href="#"
              className="underline hover:text-gray-500 transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="underline hover:text-gray-500 transition-colors"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="hidden lg:flex flex-col items-center justify-center flex-1 relative overflow-hidden bg-[#060D1C]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0f2044_0%,_#060D1C_70%)]" />
        <div className="relative z-10 flex flex-col items-center">
          <Image
            src="/assets/logo/asceoft-logo-white.svg"
            alt="Asceoft"
            width={162}
            height={32}
            unoptimized
          />
          <p className="text-gray-500 text-xs mt-3">
            [transclucent graphic placeholder]
          </p>
          <div className="mt-3 w-8 h-[2px] bg-indigo-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}
