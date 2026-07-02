"use client"

import { useState } from "react";
import {
  navItems,
  SidebarLogo,
  SidebarNavItem,
  SidebarFooter,
  ChevronRight,
} from "../ui/sidebar";

export default function SidebarLayout({ children }) {
  const [active, setActive] = useState("Projects");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-gray-100">
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

        {/*<SidebarFooter
          collapsed={collapsed}
          onCollapse={() => setCollapsed(true)}
        />*/}

        {/* Expand button when collapsed */}
        {/*collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 shadow-sm"
          >
            <ChevronRight />
          </button>
        )*/}
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-hidden">
        {children ?? (
          <>
            <h1 className="text-xl font-semibold text-gray-800">{active}</h1>
            <p className="text-sm text-gray-400 mt-1">Page content goes here.</p>
          </>
        )}
      </div>
    </div>
  );
}
