"use client";

import { useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Folder,
	LayoutDashboard,
	ChevronLeft,
	ChevronRight,
	ContactRound,
} from "lucide-react";

// Font configurations
const hanken = Hanken_Grotesk({
	variable: "--font-hanken",
	subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
	variable: "--font-jetbrains",
	subsets: ["latin"],
});

interface NavItem {
	label: string;
	icon: ComponentType<{ className?: string }>;
	href: string;
}

// Nav items array with Next.js route paths
export const navItems: NavItem[] = [
	{ label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
	{ label: "Projects", icon: Folder, href: "/projects" },
	// { label: "Contracts", icon: FileText, href: "/contracts" }, // TODO(contracts): route not built yet
	{ label: "Clients", icon: ContactRound, href: "/clients" },
	// { label: "Credentials Repo", icon: Key, href: "/credentials" },
];

export const SidebarLogo = ({ collapsed }: { collapsed?: boolean }) => (
	<div className="flex items-center border-b border-gray-100 px-3.5 py-4 min-h-16.25 overflow-hidden">
		<div
			className={`flex flex-col min-w-0 transition-all duration-300 ease-in-out`}
		>
			{" "}
			{/* ${collapsed ? "mx-auto" : ""} */}
			{/* Logo container: switches between icon and full logo based on collapsed state */}
			<div className="relative overflow-hidden h-5 transition-all duration-300 ease-in-out">
				{collapsed ? (
					<Image
						src="/assets/logo/asceoft-icon-black.svg"
						alt="Asceoft"
						width={18}
						height={18}
						unoptimized
					/>
				) : (
					<Image
						src="/assets/logo/asceoft-logo-black.svg"
						alt="Asceoft"
						width={91}
						height={18}
						className="max-w-none"
						unoptimized
					/>
				)}
			</div>
			<p
				className={`font-mono text-[9px] font-semibold tracking-[0.18em] text-gray-400 uppercase mt-1 whitespace-nowrap transition-all duration-300 ease-in-out ${
					collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"
				}`}
			>
				Studio Portal
			</p>
		</div>
	</div>
);

export const SidebarNavItem = ({
	item,
	active,
	collapsed,
	onClick,
}: {
	item: NavItem;
	active?: boolean;
	collapsed?: boolean;
	onClick?: (label: string) => void;
}) => {
	const Icon = item.icon;
	const isActive = active;

	const content = (
		<div
			className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-md text-left
        transition-colors duration-150 group font-sans
        ${
					isActive
						? "bg-gray-100 text-gray-900 font-medium"
						: "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
				}
      `}
		>
			<span className="w-4 h-4 flex items-center justify-center shrink-0">
				<Icon
					className={`w-4 h-4 transition-colors ${
						isActive
							? "text-gray-900"
							: "text-gray-400 group-hover:text-gray-600"
					}`}
				/>
			</span>
			<h4
				className={`text-sm font-medium truncate leading-4 overflow-hidden transition-all duration-300 ease-in-out ${
					collapsed ? "max-w-0 opacity-0" : "max-w-35 opacity-100"
				}`}
			>
				{item.label}
			</h4>
		</div>
	);

	if (item.href) {
		return (
			<Link
				href={item.href}
				title={collapsed ? item.label : undefined}
				onClick={() => onClick?.(item.label)}
				className="block w-full"
			>
				{content}
			</Link>
		);
	}

	return (
		<button
			type="button"
			onClick={() => onClick?.(item.label)}
			title={collapsed ? item.label : undefined}
			className="w-full text-left"
		>
			{content}
		</button>
	);
};

export const SidebarFooter = ({
	collapsed,
	onToggle,
}: {
	collapsed?: boolean;
	onToggle: () => void;
}) => (
	<div className="px-2 py-3 border-t border-gray-100 space-y-0.5 shrink-0">
		{/* <button
			type="button"
			title={collapsed ? "Settings" : undefined}
			className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-150 font-sans"
		>
			<span className="w-4 h-4 flex items-center justify-center shrink-0">
				<Settings className="w-4 h-4" />
			</span>
			<h4
				className={`text-sm font-medium truncate overflow-hidden transition-all duration-300 ease-in-out ${
					collapsed ? "max-w-0 opacity-0" : "max-w-35 opacity-100"
				}`}
			>
				Settings
			</h4>
		</button> */}

		<button
			type="button"
			onClick={onToggle}
			title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
			className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-150 font-sans"
		>
			<span className="w-4 h-4 flex items-center justify-center shrink-0">
				{collapsed ? (
					<ChevronRight className="w-4 h-4" />
				) : (
					<ChevronLeft className="w-4 h-4" />
				)}
			</span>
			<h4
				className={`text-sm font-medium truncate overflow-hidden transition-all duration-300 ease-in-out ${
					collapsed ? "max-w-0 opacity-0" : "max-w-35 opacity-100"
				}`}
			>
				Collapse
			</h4>
		</button>
	</div>
);

export default function SidebarLayout({
	children,
	showClientsLink = true,
}: {
	children?: ReactNode;
	/** Client profiles must not see the Clients registry entry. The (app)
	 * server layout resolves the role and passes this flag — a boolean is
	 * serializable across the RSC boundary, while navItems (with icon
	 * components) stay client-side. */
	showClientsLink?: boolean;
}) {
	const pathname = usePathname();
	const [collapsed, setCollapsed] = useState(false);

	// Role-filtered nav items (client-side — icons must not cross RSC).
	const items = showClientsLink
		? navItems
		: navItems.filter((item) => item.href !== "/clients");

	return (
		<div
			className={`${hanken.variable} ${jetbrains.variable} flex h-screen w-full overflow-hidden`}
		>
			{/* Sidebar */}
			<div
				className={`
          flex flex-col h-full bg-neutral-surface border-r border-gray-200
          transition-all duration-300 ease-in-out overflow-hidden
          ${collapsed ? "w-16" : "w-52"}
        `}
			>
				<SidebarLogo collapsed={collapsed} />

				<nav className="flex-1 px-2 py-4 space-y-0.5 overflow-hidden">
					{items.map((item) => {
						const isActive = pathname.startsWith(item.href);
						return (
							<SidebarNavItem
								key={item.label}
								item={item}
								active={isActive}
								collapsed={collapsed}
							/>
						);
					})}
				</nav>

				<SidebarFooter
					collapsed={collapsed}
					onToggle={() => setCollapsed(!collapsed)}
				/>
			</div>

			{/* Main Page content */}
			<div className="flex-1 h-full overflow-y-auto">
				{children ?? (
					<div className="p-6">
						<p className="text-sm text-gray-400 mt-1">
							Page content goes here.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
