"use client";

import { useEffect, useRef, useState } from "react";

function ChevronRightIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

interface ProfileMenuItem {
  label: string;
  icon: "personal" | "security" | "notifications";
  onClick?: () => void;
}

interface TopNavProps {
  breadcrumbs: string[];
  userName?: string;
  userRole?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  userInitials?: string;
  menuItems?: ProfileMenuItem[];
  onLogout?: () => void;
}

const ICONS = {
  personal: UserIcon,
  security: GearIcon,
  notifications: BellIcon,
};

const DEFAULT_MENU_ITEMS: ProfileMenuItem[] = [
  { label: "Personal Information", icon: "personal" },
  { label: "Security", icon: "security" },
  { label: "Notifications", icon: "notifications" },
];

export default function TopNav({
  breadcrumbs,
  userName = "Alex Mercer",
  userRole = "Product Owner",
  userEmail = "alex.mercer@asceoft.com",
  userAvatarUrl,
  userInitials = "AM",
  menuItems = DEFAULT_MENU_ITEMS,
  onLogout,
}: TopNavProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="relative flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shrink-0">
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-300"><ChevronRightIcon /></span>}
              <span
                className={
                  isLast
                    ? "text-indigo-600 hover:text-indigo-500 cursor-pointer transition-colors"
                    : "text-gray-700"
                }
              >
                {crumb}
              </span>
            </span>
          );
        })}
      </nav>

      <div className="flex items-center gap-3" ref={containerRef}>
        <div className="w-px h-5 bg-gray-200" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="true"
          className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-indigo-600 text-xs font-bold text-white ring-2 ring-transparent hover:ring-indigo-200 transition-all"
        >
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            userInitials
          )}
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] w-72 rounded-2xl bg-white border border-gray-100 shadow-2xl shadow-black/10 py-6 px-5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center text-lg font-bold text-white mb-3">
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userInitials
                )}
              </div>
              <div className="text-gray-900 font-semibold text-base">
                {userName}
              </div>
              <span className="mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-medium tracking-wide">
                {userRole.toUpperCase()}
              </span>
              <div className="mt-1.5 text-xs text-gray-400">{userEmail}</div>
            </div>

            <div className="py-2">
              {menuItems.map((item) => {
                const Icon = ICONS[item.icon];
                return (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    onClick={item.onClick}
                    className="w-full flex items-center justify-between px-1 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors group"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon />
                      {item.label}
                    </span>
                    <span className="text-gray-300 group-hover:text-gray-500 transition-colors">
                      <ChevronRightIcon />
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="mt-3 w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium tracking-wide transition-colors"
            >
              LOG OUT
            </button>
          </div>
        )}
      </div>
    </header>
  );
}