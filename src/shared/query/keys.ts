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
};

export const clientKeys = {
	all: ["clients"] as const,
	details: () => [...clientKeys.all, "detail"] as const,
	detail: (id: string) => [...clientKeys.details(), id] as const,
};

export const departmentKeys = {
	all: ["departments"] as const,
};

export const phaseKeys = {
	all: ["phases"] as const,
	detail: (id: string) => [...phaseKeys.all, "detail", id] as const,
	modules: (phaseId: string) =>
		[...phaseKeys.detail(phaseId), "modules"] as const,
};

export const moduleKeys = {
	all: ["modules"] as const,
	detail: (id: string) => [...moduleKeys.all, "detail", id] as const,
	workflows: (moduleId: string) =>
		[...moduleKeys.detail(moduleId), "workflows"] as const,
};

export const stageKeys = {
	all: ["stages"] as const,
	lists: () => [...stageKeys.all, "list"] as const,
	detail: (id: string) => [...stageKeys.all, "detail", id] as const,
	phases: (stageId: string) =>
		[...stageKeys.detail(stageId), "phases"] as const,
	tree: (stageId: string) => [...stageKeys.detail(stageId), "tree"] as const,
};

export const workflowKeys = {
	all: ["workflows"] as const,
	detail: (id: string) => [...workflowKeys.all, "detail", id] as const,
	tickets: (workflowId: string) =>
		[...workflowKeys.detail(workflowId), "tickets"] as const,
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
