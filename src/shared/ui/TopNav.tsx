"use client";

function ChevronRightIcon() {
  return (
    <svg
      width="12"
      height="12"
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

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
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

interface TopNavProps {
  breadcrumbs: string[];
  userInitials?: string;
  hasNotification?: boolean;
}

export default function TopNav({
  breadcrumbs,
  userInitials = "AM",
  hasNotification = true,
}: TopNavProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shrink-0">
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRightIcon />}
              <span
                className={
                  isLast
                    ? "text-gray-800 font-medium"
                    : "hover:text-gray-700 cursor-pointer transition-colors"
                }
              >
                {crumb}
              </span>
            </span>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <SunIcon />
        </button>
        <div className="relative">
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <BellIcon />
          </button>
          {hasNotification && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
          {userInitials}
        </div>
      </div>
    </header>
  );
}
