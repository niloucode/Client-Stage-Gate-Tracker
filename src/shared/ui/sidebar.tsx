"use client";

import { useState } from "react";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import {
  LayoutDashboard,
  Folder,
  FileText,
  Key,
  Settings,
  ChevronLeft,
  ChevronRight,
  Boxes,
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

// Nav items array using Lucide components directly
export const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Projects", icon: Folder },
  { label: "Contracts", icon: FileText },
  { label: "Credentials Repo", icon: Key },
];

export const SidebarLogo = ({ collapsed }: { collapsed?: boolean }) => (
  <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
    <div className="w-8 h-8 flex-shrink-0 bg-gray-900 rounded-lg flex items-center justify-center text-white">
      <Boxes className="w-5 h-5" />
    </div>
    {!collapsed && (
      <div>
        <p className="font-sans text-sm font-semibold text-gray-900 leading-tight">
          Asceoft
        </p>
        <p className="font-mono text-[10px] text-gray-400 tracking-widest uppercase">
          Studio Portal
        </p>
      </div>
    )}
  </div>
);

export const SidebarNavItem = ({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: { label: string; icon: React.ComponentType<{ className?: string }> };
  active: string;
  collapsed?: boolean;
  onClick: (label: string) => void;
}) => {
  const Icon = item.icon;
  const isActive = active === item.label;

  return (
    <button
      onClick={() => onClick(item.label)}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
        transition-colors duration-150 group font-sans
        ${
          isActive
            ? "bg-gray-100 text-gray-900 font-medium"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        }
      `}
    >
      <Icon
        className={`w-4 h-4 flex-shrink-0 transition-colors ${
          isActive
            ? "text-gray-900"
            : "text-gray-400 group-hover:text-gray-600"
        }`}
      />
      {!collapsed && (
        <span className="text-sm font-medium truncate">{item.label}</span>
      )}
    </button>
  );
};

export const SidebarFooter = ({
  collapsed,
  onCollapse,
}: {
  collapsed?: boolean;
  onCollapse: () => void;
}) => (
  <div className="px-2 py-4 border-t border-gray-100 flex items-center justify-between">
    <button
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-150 font-sans ${
        collapsed ? "w-full justify-center" : ""
      }`}
    >
      <Settings className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span className="text-sm font-medium">Settings</span>}
    </button>
    {!collapsed && (
      <button
        onClick={onCollapse}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Collapse sidebar"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    )}
  </div>
);

export default function SidebarLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [active, setActive] = useState("Projects");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`${hanken.variable} ${jetbrains.variable} flex min-h-screen w-full bg-[#FAF8FF]`}
    >
      {/* Sidebar */}
      <div
        className={`
          relative flex flex-col bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-52"}
        `}
      >
        <SidebarLogo collapsed={collapsed} />

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {navItems.map((item) => (
            <SidebarNavItem
              key={item.label}
              item={item}
              active={active}
              collapsed={collapsed}
              onClick={setActive}
            />
          ))}
        </nav>

        <SidebarFooter
          collapsed={collapsed}
          onCollapse={() => setCollapsed(true)}
        />

        {/* Expand toggle when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 shadow-sm"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Page content */}
      <div className="flex-1 overflow-hidden">
        {children ?? (
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{active}</h1>
            <p className="text-sm text-gray-400 mt-1">
              Page content goes here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}