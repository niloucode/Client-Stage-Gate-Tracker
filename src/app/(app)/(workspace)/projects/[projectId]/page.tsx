"use client";
import { useParams, useRouter } from "next/navigation";
import { ProjectStructure } from "../../../../../features/project-structure";

export default function PS() {
	const router = useRouter();
	const params = useParams<{ projectId: string }>();
	const projectId = params?.projectId;

	return (
		<>
			<ProjectStructure
				projectId={projectId}
				// Task 5.6: only "View Contract" is linked for now; the
				// Credentials Repository and Issue Reporting buttons stay
				// unlinked until those features land.
				onViewContract={() =>
					router.push(`/projects/${projectId}/contract?projectId=${projectId}`)
				}
			/>
		</>
	);
}
