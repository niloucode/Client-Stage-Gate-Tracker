"use client";

interface Screen {
  id: string;
  name: string;
}

interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  status: "active" | "pending" | "deprecated";
}

const screens: Screen[] = [
  { id: "1", name: "Login_Screen_v2" },
  { id: "2", name: "Dashboard_Main" },
];

const apis: ApiEndpoint[] = [
  { id: "1", method: "POST", path: "/api/v1/auth/login", status: "active" },
  { id: "2", method: "GET", path: "/api/v1/users/me", status: "pending" },
];

const getMethodColor = (method: string) => {
  switch (method) {
    case "GET":
      return "bg-[#EFF6FF] text-[#3B82F6]";
    case "POST":
      return "bg-[#FEF3C7] text-[#D97706]";
    case "PUT":
      return "bg-[#F0FDF4] text-[#10B981]";
    case "DELETE":
      return "bg-[#FEE2E2] text-[#EF4444]";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-[#10B981]";
    case "pending":
      return "bg-[#94A3B8]";
    case "deprecated":
      return "bg-[#F59E0B]";
    default:
      return "bg-gray-300";
  }
};

export function ScreenApiTracker() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="6" height="6" rx="1" stroke="#10B981" strokeWidth="1.5" />
            <rect x="12" y="2" width="6" height="6" rx="1" stroke="#10B981" strokeWidth="1.5" />
            <rect x="2" y="12" width="6" height="6" rx="1" stroke="#10B981" strokeWidth="1.5" />
            <rect x="12" y="12" width="6" height="6" rx="1" stroke="#10B981" strokeWidth="1.5" />
          </svg>
          <span className="text-sm font-semibold text-[#0F172A]">Screen & API Tracker</span>
        </div>
        <button className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA]">
          + Link New
        </button>
      </div>

      {/* Content - Screens and APIs side by side */}
      <div className="flex gap-8 p-5">
        {/* Screens Section */}
        <div className="flex-1">
          <div className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-3">
            LINKED SCREENS ({screens.length})
          </div>
          <div className="space-y-2">
            {screens.map((screen) => (
              <div
                key={screen.id}
                className="flex items-center gap-2 px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg"
              >
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                  <rect x="1" y="1" width="12" height="10" rx="1" stroke="#94A3B8" strokeWidth="1.5" />
                  <line x1="4" y1="1" x2="4" y2="11" stroke="#94A3B8" strokeWidth="1.5" />
                </svg>
                <span className="text-sm text-[#0F172A]">
                  {screen.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* APIs Section */}
        <div className="flex-1">
          <div className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-3">
            REQUIRED APIS ({apis.length})
          </div>
          <div className="space-y-2">
            {apis.map((api) => (
              <div
                key={api.id}
                className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${getMethodColor(api.method)}`}>
                    {api.method}
                  </div>
                  <code className="text-xs font-mono text-[#0F172A]">{api.path}</code>
                </div>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(api.status)}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}