import type { Metadata } from "next";
import { AuthProvider } from "@/features/auth";
import { QueryProvider } from "@/shared/query/client";
import { Toaster } from "@/components/ui/toast";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

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

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={cn(hankenGrotesk.variable, jetbrainsMono.variable)}
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
