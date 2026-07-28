import { LoaderCircle } from "lucide-react"

export function Searching(){
return (
<div className="flex w-full h-full justify-center items-center text-foreground text-md py-2">
	<LoaderCircle className="animate-spin mr-2"></LoaderCircle>
	Searching...
	</div>
);
}

export function Lacking(){
return (
<div className="flex w-full h-full justify-center items-center text-foreground text-md py-2">
	No results found.
	</div>
);
}