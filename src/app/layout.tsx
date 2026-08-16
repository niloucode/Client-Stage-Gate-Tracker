import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth";
import { QueryProvider } from "@/shared/query/client";
import { Toaster } from "@/components/ui/toast";
import { Inter, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	weight: ["400"],
	display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
	variable: "--font-hanken",
	subsets: ["latin"],
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Client Stage Gate Tracker",
	description: "Acesoft project tracker",
};

/** Root layout: fonts, providers, toaster. */
export default function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={cn(
				inter.variable,
				hankenGrotesk.variable,
				jetbrainsMono.variable,
			)}
		>
			<body className="min-h-full flex flex-col">
				<QueryProvider>
					<AuthProvider>
						<Toaster />
						{children}
					</AuthProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
