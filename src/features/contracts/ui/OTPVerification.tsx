"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";

type OTPState = "default" | "sent" | "verified" | "error";

const RESEND_COOLDOWN_SEC = 30;
// Supabase Auth email OTP codes are 6 digits by default (the `{{ .Token }}`
// placeholder in the email template). Keep in sync with the Supabase
// project's OTP length setting.
const CODE_LENGTH = 6;

interface OTPVerificationProps {
	/** Masked email of the signer, shown for confirmation. Derived from the
	 *  session user's email when omitted. */
	maskedEmail?: string;
	onVerified?: () => void;
}

function maskEmail(email: string): string {
	const [local, domain] = email.split("@");
	if (!domain) return email;
	const head = local.slice(0, 2);
	return `${head}${"*".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

export function OTPVerification({
	maskedEmail,
	onVerified,
}: OTPVerificationProps) {
	const [otpState, setOtpState] = useState<OTPState>("default");
	const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
	const [countdown, setCountdown] = useState(0);
	const [isVerifying, setIsVerifying] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const supabase = createClient();
	const { user } = useAuth();

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

	const triggerOTP = async () => {
		if (!user) return;
		setErrorMessage(null);
		const { error } = await supabase.auth.signInWithOtp({ email: user.email });
		if (error) {
			console.error(error.message);
			setOtpState("error");
			setErrorMessage(error.message);
		} else {
			setDigits(Array(CODE_LENGTH).fill(""));
			setOtpState("sent");
			startCountdown();
			setTimeout(() => inputRefs.current[0]?.focus(), 50);
		}
	};

	const handleDigitChange = (index: number, value: string) => {
		if (!/^[0-9]?$/.test(value)) return;
		const next = [...digits];
		next[index] = value;
		setDigits(next);
		if (value && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
	};

	const handleKeyDown = (
		index: number,
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (e.key === "Backspace" && !digits[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		const pasted = e.clipboardData
			.getData("text")
			.replace(/\D/g, "")
			.slice(0, CODE_LENGTH);
		if (!pasted) return;
		const next = Array(CODE_LENGTH).fill("");
		pasted.split("").forEach((ch, i) => {
			next[i] = ch;
		});
		setDigits(next);
		inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
	};

	const allFilled = digits.every((d) => d !== "");

	const handleVerify = async () => {
		if (!user) return;
		if (!allFilled || isVerifying) return;
		setIsVerifying(true);
		setErrorMessage(null);
		const { error } = await supabase.auth.verifyOtp({
			email: user.email,
			token: digits.join(""),
			type: "email",
		});

		if (error) {
			console.error(error.message);
			setIsVerifying(false);
			setOtpState("error");
			setErrorMessage(error.message);
		} else {
			setIsVerifying(false);
			setOtpState("verified");
			onVerified?.();
		}
	};

	// ── Verified state ──────────────────────────────────────────────────────────
	if (otpState === "verified") {
		return (
			<div className="flex flex-col items-center gap-2 rounded-xl bg-[#ECFDF3] py-6 text-center">
				<CheckCircle2 className="h-8 w-8 text-green-700" />
				<p className="text-sm font-semibold text-green-700">
					Identity Verified
				</p>
				<p className="text-xs text-plum-400">
					Your signature has been authenticated.
				</p>
			</div>
		);
	}

	// ── Default state ───────────────────────────────────────────────────────────
	if (otpState === "default") {
		return (
			<div className="flex flex-col gap-2">
				<p className="text-xs text-plum-400">
					Verify your identity to sign this document.
				</p>
				<button
					type="button"
					onClick={triggerOTP}
					className="w-full rounded-lg bg-indigo-700 py-2.5 text-sm font-semibold text-neutral-surface transition-colors hover:bg-[#3730A3]"
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
				<p className="text-xs font-medium text-ink">
					Security Verification
				</p>
				<Button
					type="button"
					onClick={triggerOTP}
					disabled={countdown > 0}
					variant="default"
					className="w-full"
				>
					{countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
				</Button>
			</div>

			<p className="text-[11px] text-[#9C9AB0]">
				Enter the {CODE_LENGTH}-digit code sent to{" "}
				{maskedEmail ?? (user ? maskEmail(user.email) : "your email")}
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
						className={`h-10 w-full rounded-lg border text-center text-sm font-semibold outline-none transition-colors focus:ring-2 focus:ring-indigo-700 ${
							otpState === "error"
								? "border-red-400 bg-red-50 text-destructive focus:ring-red-400"
								: "border-[#C4BFE6] bg-neutral-surface text-ink"
						}`}
					/>
				))}
			</div>

			{otpState === "error" && (
				<div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2">
					<XCircle className="h-4 w-4 shrink-0 text-red-500" />
					<p className="text-xs text-destructive">
						{errorMessage ?? "Incorrect code. Please try again."}
					</p>
				</div>
			)}

			<button
				type="button"
				onClick={handleVerify}
				disabled={!allFilled || isVerifying}
				className={`w-full rounded-lg py-2.5 text-sm font-semibold text-neutral-surface transition-colors ${
					allFilled && !isVerifying
						? "bg-indigo-700 hover:bg-[#3730A3]"
						: "cursor-not-allowed bg-[#A8A3D0]"
				}`}
			>
				{isVerifying ? "Verifying…" : "Sign Document"}
			</button>

			<p className="text-center text-[10px] leading-relaxed text-[#9C9AB0]">
				By clicking &ldquo;Sign Document&rdquo;, you agree to the{" "}
				<span className="cursor-pointer text-indigo-700 hover:underline">
					Terms of Service
				</span>{" "}
				and legally bind yourself to this agreement.
			</p>
		</div>
	);
}

export default OTPVerification;
