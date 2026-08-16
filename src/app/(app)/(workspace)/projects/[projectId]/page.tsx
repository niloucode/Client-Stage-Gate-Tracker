"use client";
import { useParams, useRouter } from "next/navigation";
import { ProjectStructure } from "@/features/project-structure";

/** Project detail route (overview + access cards). */
export default function PS() {
	const router = useRouter();
	const params = useParams<{ projectId: string }>();
	const projectId = params?.projectId;

	return (
		<>
			<ProjectStructure
				key={projectId}
				projectId={projectId}
				onViewContract={() => router.push(`/projects/${projectId}/contract`)}
				onCredentialsRepo={() =>
					router.push(`/projects/${projectId}/variables`)
				}
				onIssueReport={() => router.push(`/projects/${projectId}/issues`)}
				onGanttChart={() =>
					router.push(`/projects/${projectId}/dashboard-analytics`)
				}
			/>
		</>
	);
}
