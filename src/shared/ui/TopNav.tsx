"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronRight, User, Settings, Bell } from "lucide-react"
import { useAuth } from "@/features/auth"
import { getDepartmentById } from "@/entities/department/departmentActions"

interface ProfileMenuItem {
  label: string
  icon: "personal"
  onClick?: () => void
}

interface TopNavProps {
  breadcrumbs: string[]
  userName?: string
  userDepartment?: string
  userEmail?: string
  userInitials?: string
  menuItems?: ProfileMenuItem[]
  onLogout?: () => void
}

const ICONS = {
  personal: User,
}
//   security: Settings,
//   notifications: Bell,

const DEFAULT_MENU_ITEMS: ProfileMenuItem[] = [
  { label: "Personal Information", icon: "personal" },
]
//   { label: "Security", icon: "security" },
//   { label: "Notifications", icon: "notifications" },

export default function TopNav({
  breadcrumbs,
  menuItems = DEFAULT_MENU_ITEMS
}: TopNavProps) {
	const [open, setOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	const { user, logout} = useAuth();
	const [departmentName, setDepartmentName] = useState<string>("No Department");

	useEffect(() => {
		async function fetchDepartment() {
			if (user?.department_id) {
			const department = await getDepartmentById(user.department_id);

			if (department) {
				setDepartmentName(department.name ?? "No Department");
			}
			}
		}

		fetchDepartment();
	}, [user?.department_id]);

	const userName = user
		? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
		: "User";
	const userEmail = user?.email ?? "";
	const userInitials =
		user?.first_name && user?.last_name
		? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
		: "";

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
		if (
			containerRef.current &&
			!containerRef.current.contains(e.target as Node)
		) {
			setOpen(false)
		}
		}
		function handleEscape(e: KeyboardEvent) {
		if (e.key === "Escape") setOpen(false)
		}
		document.addEventListener("mousedown", handleClickOutside)
		document.addEventListener("keydown", handleEscape)
		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
			document.removeEventListener("keydown", handleEscape)
		}
  }, [])

  return (
    <header className="relative flex items-center justify-between px-8 py-3 border-b-1 border-brand-200 shrink-0">
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-gray-700">
                  <ChevronRight className="w-3 h-3" />
                </span>
              )}
              <span
                className={
                  isLast
                    ? "text-brand-500 hover:text-indigo-500 cursor-pointer transition-colors"
                    : "text-gray-700"
                }
              >
                {crumb}
              </span>
            </span>
          )
        })}
      </nav>

      <div className="flex items-center gap-3" ref={containerRef}>
        <div className="w-px h-5 bg-gray-200" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="true"
          className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden 
		  bg-indigo-600 text-xs font-bold text-white ring-2 ring-transparent hover:ring-indigo-200 transition-all"
        >
			{userInitials}
          {/* {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            
          )} */}
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] w-72 drop-shadow-2xl transition-all duration-200 ease-out animate-in fade-in rounded-2xl bg-brand-50 border 
			border-gray-100 shadow-2xl shadow-black/10 py-6 px-5 z-50"
          >
            <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-600 flex items-center 
			  justify-center text-lg font-bold text-white mb-3">
                {
				// userAvatarUrl ? (
                //   <img
                //     src={userAvatarUrl}
                //     alt={userName}
                //     className="w-full h-full object-cover"
                //   />
                // ) : 
                  userInitials
                // )
				}
              </div>
              <div className="text-gray-900 font-semibold text-base">
                {userName}
              </div>
              <span className="mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 
			  text-[11px] font-medium tracking-wide">
                {departmentName.toUpperCase()}
              </span>
              <div className="mt-1.5 text-xs text-gray-400">{userEmail}</div>
            </div>

            <div className="py-2">
              {menuItems.map((item) => {
                const Icon = ICONS[item.icon]
                return (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    onClick={item.onClick}
                    className="w-full flex items-center justify-between px-1 py-2.5 text-sm 
					text-gray-600 hover:text-gray-900 transition-colors group"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 stroke-[1.8]" />
                      {item.label}
                    </span>
                    <span className="text-gray-300 group-hover:text-gray-500 transition-colors">
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={logout}
              className="mt-3 w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 
			  text-white text-sm font-medium tracking-wide transition-colors"
            >
              LOG OUT
            </button>
          </div>
        )}
      </div>
    </header>
  )
}