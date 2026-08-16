import { VariablesPage } from "@/features/variable-manager";

interface PageParams {
	projectId: string;
}

/** Variables route. */
export default async function VariablesRoute({
	params,
}: {
	params: Promise<PageParams>;
}) {
	const { projectId } = await params;
	return <VariablesPage projectId={projectId} />;
}
