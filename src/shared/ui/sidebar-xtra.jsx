import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({ 
  variable: "--font-jetbrains", 
  subsets: ["latin"] 
});


export const LayoutDashboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);

export const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

export const FileTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);

export const KeyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

export const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
  </svg>
);

export const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

export const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);


export const navItems = [
  //{ label: "Dashboard",        icon: <LayoutDashboard /> },
  { label: "Projects",         icon: <FolderIcon /> },
  //{ label: "Contracts",        icon: <FileTextIcon /> },
  { label: "Credentials Repo", icon: <KeyIcon /> },
];

export const SidebarLogo = ({ collapsed }) => (
  <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
    <svg viewBox="0 0 89 89" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 flex-shrink-0">
      <path fillRule="evenodd" clipRule="evenodd" d="M44.8389 22.041L22.7968 44.0831V22.041H0.755859L22.7968 0H44.8389V22.0389L66.8779 0H88.92V22.041L66.8779 44.0831V22.041H44.8389ZM66.8779 44.0831H88.92V66.124L66.8779 88.1662V66.124H44.8389L22.7968 88.1662V66.124H0.755859L22.7968 44.0831H44.8389V66.122L66.8779 44.0831Z" fill="#151B29"/>
    </svg>
    {!collapsed && (
      <div>
        <p className="font-[Hanken_Grotesk] text-sm font-semibold text-gray-900 leading-tight">Asceoft</p>
        <p className="font-[JetBrains_Mono] text-[10px] text-gray-400 tracking-widest uppercase">Studio Portal</p>
      </div>
    )}
  </div>
);
export const SidebarNavItem = ({ item, active, collapsed, onClick }) => (
  <button
    onClick={() => onClick(item.label)}
    className={`
      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
      transition-colors duration-150 group
      ${active === item.label
        ? "bg-gray-100 text-gray-900 font-[Hanken_Grotesk]"
        : "font-[Hanken_Grotesk] text-gray-500 hover:bg-gray-50 hover:text-gray-700"}
    `}
  >
    <span className={`font-[Hanken_Grotesk] flex-shrink-0 ${active === item.label ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600"}`}>
      {item.icon}
    </span>
    {!collapsed && (
      <span className="font-[Hanken_Grotesk] text-sm font-medium truncate">{item.label}</span>
    )}
  </button>
);

export const SidebarFooter = ({ collapsed, onCollapse }) => (
  <div className="px-2 py-4 border-t border-gray-100 flex items-center justify-between">
    <button className={`flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-150 ${collapsed ? "w-full justify-center" : ""}`}>
      <SettingsIcon />
      {!collapsed && <span className="font-[Hanken_Grotesk] text-sm font-medium">Settings</span>}
    </button>
    {!collapsed && (
      <button
        onClick={onCollapse}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <ChevronLeft />
      </button>
    )}
  </div>
);
