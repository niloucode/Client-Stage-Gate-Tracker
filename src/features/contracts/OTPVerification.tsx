"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type OTPState = "default" | "sent" | "verified" | "error";

const RESEND_COOLDOWN_SEC = 30;
const CODE_LENGTH = 6;

interface OTPVerificationProps {
  maskedEmail?: string;
  onVerified?: () => void;
}

export function OTPVerification({
  maskedEmail = "a***@client.com",
  onVerified,
}: OTPVerificationProps) {
  const [otpState, setOtpState] = useState<OTPState>("default");
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(RESEND_COOLDOWN_SEC);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const triggerOTP = () => {
    // TODO: connect to backend — call OTP send/resend API
    setDigits(Array(CODE_LENGTH).fill(""));
    setOtpState("sent");
    startCountdown();
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const allFilled = digits.every((d) => d !== "");

  const handleVerify = () => {
    if (!allFilled || isVerifying) return;
    setIsVerifying(true);
    // TODO: connect to backend — POST /api/otp/verify with { code: digits.join("") }
    // Backend should resolve with { success: boolean }; on failure set otpState to "error"
    setTimeout(() => {
      setIsVerifying(false);
      setOtpState("verified");
      onVerified?.();
    }, 800);
  };

  // ── Verified state ──────────────────────────────────────────────────────────
  if (otpState === "verified") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl bg-[#ECFDF3] py-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-[#15803D]" />
        <p className="text-sm font-semibold text-[#15803D]">Identity Verified</p>
        <p className="text-xs text-[#6E6B82]">
          Your signature has been authenticated.
        </p>
      </div>
    );
  }

  // ── Default state ───────────────────────────────────────────────────────────
  if (otpState === "default") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-[#6E6B82]">
          Verify your identity to sign this document.
        </p>
        <button
          type="button"
          onClick={triggerOTP}
          className="w-full rounded-lg bg-[#4338CA] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3730A3]"
        >
          Request OTP
        </button>
      </div>
    );
  }

  // ── Sent / Error state ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#181724]">Security Verification</p>
        <button
          type="button"
          onClick={triggerOTP}
          disabled={countdown > 0}
          className={`text-xs font-medium transition-colors ${
            countdown > 0
              ? "cursor-default text-[#9C9AB0]"
              : "text-[#4338CA] hover:underline"
          }`}
        >
          {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
        </button>
      </div>

      <p className="text-[11px] text-[#9C9AB0]">
        Enter the 6-digit code sent to {maskedEmail}
      </p>

      <div className="flex gap-2" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`h-10 w-full rounded-lg border text-center text-sm font-semibold outline-none transition-colors focus:ring-2 focus:ring-[#4338CA] ${
              otpState === "error"
                ? "border-red-400 bg-red-50 text-red-600 focus:ring-red-400"
                : "border-[#C4BFE6] bg-white text-[#181724]"
            }`}
          />
        ))}
      </div>

      {otpState === "error" && (
        <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2">
          <XCircle className="h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs text-red-600">Incorrect code. Please try again.</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleVerify}
        disabled={!allFilled || isVerifying}
        className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors ${
          allFilled && !isVerifying
            ? "bg-[#4338CA] hover:bg-[#3730A3]"
            : "cursor-not-allowed bg-[#A8A3D0]"
        }`}
      >
        {isVerifying ? "Verifying…" : "Sign Document"}
      </button>

      <p className="text-center text-[10px] leading-relaxed text-[#9C9AB0]">
        By clicking &ldquo;Sign Document&rdquo;, you agree to the{" "}
        <span className="cursor-pointer text-[#4338CA] hover:underline">
          Terms of Service
        </span>{" "}
        and legally bind yourself to this agreement.
      </p>
    </div>
  );
}

export default OTPVerification;
