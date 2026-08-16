import type { ProjectStatus } from "./projectActions";

/**
 * Pure project-domain helpers. Deliberately NOT a server-action module:
 * Next.js forbids non-async exports from server-action files, so pure
 * functions live here and are imported by the actions.
 * @returns The result.
 */

/**
 * Pure status computation: PENDING until the contract is fully signed,
 * ACTIVE once signed but stages remain, COMPLETED once signed and all
 * stages are finished.
 * @returns The result.
 */
export function computeProjectStatus(input: {
	contractSigned: boolean;
	totalStages: number;
	finishedStages: number;
}): ProjectStatus {
	const { contractSigned, totalStages, finishedStages } = input;
	if (contractSigned && totalStages > 0 && finishedStages === totalStages) {
		return "COMPLETED";
	}
	if (contractSigned) return "ACTIVE";
	return "PENDING";
}

/**
 * True when the given role name is the Project Owner role.
 * @param roleName
 * @returns The result.
 */
export function isProjectOwnerRole(
	roleName: string | null | undefined,
): boolean {
	return roleName === "Project Owner";
}
