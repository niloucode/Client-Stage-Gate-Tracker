"use client";

import Image from "next/image";
import Link from "next/link";
import { Hanken_Grotesk } from "next/font/google";
import { LoginForm } from "@/features/auth";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function LoginPage() {
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
            <LoginForm />
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
