import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function Back({ link }: { link: string }) {
	return (
		<Link
			href={link}
			className="group mt-1 flex items-center gap-2 text-lg font-bold leading-none text-brand-500 transition-colors hover:text-brand-600 sm:text-xl"
		>
			<ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
			<h3 className="text-brand-500!">Back</h3>
		</Link>
	);
}
