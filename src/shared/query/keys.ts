export const ticketKeys = {
	all: ["tickets"] as const,
	lists: () => [...ticketKeys.all, "list"] as const,
	list: (filters: { workflowId?: string }) =>
		[...ticketKeys.lists(), filters] as const,
	details: () => [...ticketKeys.all, "detail"] as const,
	detail: (id: string) => [...ticketKeys.details(), id] as const,
};

export const tagKeys = {
	all: ["tags"] as const,
};

export const profileKeys = {
	all: ["profiles"] as const,
	lists: () => [...profileKeys.all, "list"] as const,
	details: () => [...profileKeys.all, "detail"] as const,
	detail: (id: string | undefined) => [...profileKeys.details(), id] as const,
	currentUser: () => [...profileKeys.all, "currentUser"] as const,
};

export const commentKeys = {
	all: ["comments"] as const,
	lists: () => [...commentKeys.all, "list"] as const,
	list: (parentType: string, parentId: string) =>
		[...commentKeys.lists(), parentType, parentId] as const,
	images: (parentType: string, parentId: string) =>
		[...commentKeys.all, "images", parentType, parentId] as const,
};

export const clientKeys = {
	all: ["clients"] as const,
	lists: () => [...clientKeys.all, "list"] as const,
	details: () => [...clientKeys.all, "detail"] as const,
	detail: (id: string) => [...clientKeys.details(), id] as const,
	own: () => [...clientKeys.all, "own"] as const,
};

export const departmentKeys = {
	all: ["departments"] as const,
	lists: () => [...departmentKeys.all, "list"] as const,
	detail: (id: string) => [...departmentKeys.all, "detail", id] as const,
};

export const stageKeys = {
	all: ["stages"] as const,
	lists: () => [...stageKeys.all, "list"] as const,
	detail: (id: string) => [...stageKeys.all, "detail", id] as const,
	phases: (stageId: string) =>
		[...stageKeys.detail(stageId), "phases"] as const,
	tree: (stageId: string) => [...stageKeys.detail(stageId), "tree"] as const,
};

export const historyKeys = {
	all: ["ticketHistory"] as const,
	lists: () => [...historyKeys.all, "list"] as const,
	list: (ticketId: string) => [...historyKeys.lists(), ticketId] as const,
};

export const contractKeys = {
	all: ["contracts"] as const,
	detail: (projectId: string) =>
		[...contractKeys.all, "detail", projectId] as const,
};

export const projectKeys = {
	all: ["projects"] as const,
	lists: () => [...projectKeys.all, "list"] as const,
	details: () => [...projectKeys.all, "detail"] as const,
	detail: (id: string) => [...projectKeys.details(), id] as const,
	members: (projectId: string) =>
		[...projectKeys.detail(projectId), "members"] as const,
};

export const dashboardAnalyticsKeys = {
	all: ["dashboardAnalytics"] as const,
	phases: (projectId: string) =>
		[...dashboardAnalyticsKeys.all, "phases", projectId] as const,
	modules: (projectId: string) =>
		[...dashboardAnalyticsKeys.all, "modules", projectId] as const,
	workflows: (projectId: string) =>
		[...dashboardAnalyticsKeys.all, "workflows", projectId] as const,
};
