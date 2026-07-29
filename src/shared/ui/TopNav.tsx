"use client"

import { useEffect, useState } from "react"
import { ChevronRight, User } from "lucide-react"
import { useAuth } from "@/features/auth"
import { getDepartmentById } from "@/entities/department/departmentActions"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

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

  return (
    <header className="bg-neutral-surface relative flex items-center justify-between px-8 py-3 border-b-1 border-brand-100 shrink-0">
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
                    ? "text-brand-500 hover:text-brand-500 cursor-pointer transition-colors"
                    : "text-gray-700"
                }
              >
                {crumb}
              </span>
            </span>
          )
        })}
      </nav>

      <div className="flex items-center gap-3">
        <div className="w-px h-5 bg-gray-200" />
		<DropdownMenu>
			<DropdownMenuTrigger className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-brand-600 text-xs font-bold text-neutral-surface ring-2 ring-transparent hover:ring-indigo-200 transition-all data-[popup-open]:ring-indigo-200">
				{userInitials}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-72">
				<div className="flex flex-col items-center text-center pb-4 border-b border-gray-100 px-4 pt-4">
					<Avatar className="w-16 h-16 text-lg mb-3">
						<AvatarFallback className="bg-brand-600 text-neutral-surface text-lg font-bold">
							{userInitials}
						</AvatarFallback>
					</Avatar>
					<div className="text-foreground font-semibold text-base">
						{userName}
					</div>
					<Badge variant="secondary" className="mt-1.5 text-[11px] font-medium tracking-wide uppercase">
						{departmentName}
					</Badge>
					<div className="mt-1.5 text-xs text-muted-foreground">{userEmail}</div>
				</div>

				<div className="py-2">
					{menuItems.map((item) => {
						const Icon = ICONS[item.icon]
						return (
							<button
								key={item.label}
								type="button"
								onClick={item.onClick}
								className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								<span className="flex items-center gap-2.5">
									<Icon className="w-4 h-4 stroke-[1.8]" />
									{item.label}
								</span>
								<ChevronRight className="w-3 h-3 text-muted-foreground" />
							</button>
						)
					})}
				</div>

				<DropdownMenuSeparator />
				<div className="px-4 py-2">
					<button
						type="button"
						onClick={logout}
						className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-neutral-surface text-sm font-medium tracking-wide transition-colors"
					>
						LOG OUT
					</button>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
      </div>
    </header>
  )
}