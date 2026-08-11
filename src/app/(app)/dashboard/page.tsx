import { redirect } from "next/navigation";

// The landing dashboard is not built yet — route to /projects until it is
// (see the previous planned-view description for this intent).
export default function DashboardPage() {
	redirect("/projects");
}
