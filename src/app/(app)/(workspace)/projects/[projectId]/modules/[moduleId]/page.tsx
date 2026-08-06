import { notFound } from "next/navigation";
import { getModuleById } from "@/entities/module/moduleActions";

export default async function ModulePage({ params }: {
  params: Promise<{ projectId: string; moduleId: string }>;
}) {
  const { projectId, moduleId } = await params;

  const result = await getModuleById(moduleId, "active");
  if (!result.success || !result.data) notFound();

  return <div>Module {moduleId}</div>;
}
