// src/app/layout.tsx
import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";
import Sidebar from "@/shared/ui/sidebar";
import TopNav from "@/shared/ui/topnav";

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
		<TopNav breadcrumbs={["Acesoft", "Project Alpha", "Project Structure"]} />
			<div className="min-h-[80vh] max-w-[90vw] mx-auto p-8">
				<>{children}</>
			</div>
	</Sidebar>
  );
}