import type { ReactNode } from "react";

/**
 * Workspace shell layout (passthrough).
 * @returns The rendered component.
 */
export default function ProjectLayout({ children }: { children: ReactNode }) {
	return <>{children}</>;
}
