import { ContractPage } from "@/features/contracts";

interface PageParams {
	projectId: string;
}

export default async function ContractPageRoute({
	params,
}: {
	params: Promise<PageParams>;
}) {
	const { projectId } = await params;
	return <ContractPage projectId={projectId} />;
}
