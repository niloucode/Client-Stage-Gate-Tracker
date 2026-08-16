import { ContractPage } from "@/features/contracts";

interface PageParams {
	projectId: string;
}

/** Contract route: renders the contract feature page. */
export default async function ContractPageRoute({
	params,
}: {
	params: Promise<PageParams>;
}) {
	const { projectId } = await params;
	return <ContractPage projectId={projectId} />;
}
