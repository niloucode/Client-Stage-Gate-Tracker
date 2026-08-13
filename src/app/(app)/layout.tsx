// src/app/layout.tsx
import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";
import Sidebar from "@/shared/ui/sidebar";
import TopNav from "@/features/navigation/ui/TopNav";

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
		<Sidebar>
			<TopNav />
			<>{children}</>
		</Sidebar>
	);
}
