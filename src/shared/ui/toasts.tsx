export function ErrorIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="45" fill="#B81C1C" />
      <path 
        d="M 32 32 L 68 68 M 68 32 L 32 68" 
        stroke="white" 
        strokeWidth="10" 
        strokeLinecap="square" 
      />
    </svg>
  );
}

export function SuccessIcon({ className = "w-6 h-6" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="45" fill="#016A43" />
      <path 
        d="M 28 50 L 43 65 L 72 35" 
        stroke="white" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

export function TrashIcon({ className = "w-6 h-6" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="45" fill="#016A43" />
      <rect x="42" y="27" width="16" height="5" rx="2" fill="white" />
      <rect x="30" y="32" width="40" height="5" rx="2.5" fill="white" />
      <path d="M 34 39 L 37 68 C 37.5 71 40 73 43 73 H 57 C 60 73 62.5 71 63 68 L 66 39 Z" fill="white" />
      <line x1="43" y1="44" x2="43" y2="67" stroke="#016A43" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="44" x2="50" y2="67" stroke="#016A43" strokeWidth="3" strokeLinecap="round" />
      <line x1="57" y1="44" x2="57" y2="67" stroke="#016A43" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function WarningIcon({ className = "w-6 h-6" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="44" y="20" width="12" height="42" rx="6" fill="#8B5E00" />
      <circle cx="50" cy="76" r="6" fill="#8B5E00" />
    </svg>
  );
}

export function Toasts({
	type,
	title,
	description,
}:{
	type?: string,
	title?: string,
	description?: string,
})
{
	const iconComponent = type ? type == "error" ? <ErrorIcon/> :
								type == "check" ? <SuccessIcon/> :
								type == "delete" ? <TrashIcon/> :
								type == "exclamation" ? <WarningIcon/> : <></> : <></>

	const colorComponent = type ? type == "error" ? "[#B81C1C]" :
								type == "check" ? "[#016A43]" :
								type == "delete" ? "[#016A43]" :
								type == "exclamation" ? "[#8B5E00]" : <></> : <></>

	return (
		<div className="fixed top-20 right-0 w-75 h-20">
			<div className={"bg-"+colorComponent+" border-[#C7C4D8] border-1 rounded-l-2xl h-full w-full"}>
				<div className="ml-auto flex items-center bg-white h-full w-72">
					<div className="m-4">
						{iconComponent}
					</div>
					<div>
						<div className="text-[#151C27] w-56 truncate h-[24px] font-bold">{title}</div>
						<div className="text-[#464555] w-56 truncate h-[24px]">{description}</div>
					</div>
				</div>
			</div>
		</div>
	)
}