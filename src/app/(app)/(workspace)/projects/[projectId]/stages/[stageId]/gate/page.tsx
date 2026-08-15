import { GateOverview } from "@/features/gate-overview";

interface PageParams {
	projectId: string;
	stageId: string;
}

export default async function GatePage({
	params,
}: {
	params: Promise<PageParams>;
}) {
	const { projectId, stageId } = await params;

	return <GateOverview projectId={projectId} stageId={stageId} />;
}
