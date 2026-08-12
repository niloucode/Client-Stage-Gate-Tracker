import Image from "next/image";
import Link from "next/link";
import { Hanken_Grotesk } from "next/font/google";
import { ClientSignupForm } from "@/features/auth";

const hanken = Hanken_Grotesk({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

export default function ClientSignupPage() {
	return (
		<div className={`${hanken.className} flex w-full`}>
			{/* ── Left Panel — scrollable ── */}
			<div className="flex flex-col w-full lg:w-[58%] bg-background min-h-screen px-10 py-10">
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
						Client Portal
					</p>
				</div>

				{/* Form */}
				<div className="w-full bg-neutral-surface rounded-xl p-6 border border-brand-100 max-w-[380px] mx-auto mt-10 mb-10">
					<div className="mb-7">
						<h1 className="text-[22px] font-semibold text-gray-900 leading-snug">
							Register your company
						</h1>
					</div>

					<ClientSignupForm />
				</div>

				{/* Footer */}
				<div className="text-center mt-auto">
					<p className="text-[11px] text-gray-400 leading-relaxed">
						By signing up, you agree to our{" "}
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

			{/* ── Right Panel — sticky ── */}
			<div className="hidden lg:block flex-1 relative">
				<div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden bg-navy-900">
					<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0f2044_0%,_#060D1C_70%)]" />
					<div className="relative z-10 flex flex-col items-center">
						<Image
							src="/assets/logo/asceoft-logo-white.svg"
							alt="Asceoft"
							width={162}
							height={32}
							unoptimized
						/>
						<div className="mt-3 w-8 h-[2px] bg-brand-500 rounded-full" />
					</div>
				</div>
			</div>
		</div>
	);
}
