import { prisma } from "@/lib/prisma";

/**
 * Universally checks if a user has a specific permission within a specific project.
 * @param {string} userId - The ID of the currently logged-in user.
 * @param {string} projectId - The ID of the project they are currently working inside.
 * @param {string} resourceName - The database table/entity (e.g., "Phases", "Workflows").
 * @param {string} actionName - The CRUD action (e.g., "create", "read", "update", "delete").
 * @returns {Promise<boolean>} True if authorized, false if not.
 */
export async function hasPermission(
    userId: string,
    projectId: string,
    resourceName: string,
    actionName: string
) {
    try {
        // We ask Prisma: "Find a RoleAssignment for this user, on this project,
        // where the assigned Role contains the exact Permission we are looking for."
        const assignment = await prisma.roleAssignments.findFirst({
            where: {
                user_id: userId,
                project_id: projectId,
                Roles: {
                    RolePermissions: {
                        some: {
                            Permissions: {
                                resource: resourceName,
                                action: actionName,
                            },
                        },
                    },
                },
            },
        });

        // If the database found a match, 'assignment' exists. If not, it returns null.
        // The !! converts the result into a strict true/false boolean.
        return !!assignment;

    } catch (error) {
        console.error("Permission check failed:", error);
        return false; // Fail securely: if the database errors, deny access.
    }
}