import { redirect } from "next/navigation";

export default function NewProjectPage() {
	redirect("/projects?action=create");
}
