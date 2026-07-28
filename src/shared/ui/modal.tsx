import { ReactNode } from "react"
import { Backdrop } from "@/shared/ui/backdrop"

export function Modal({ 
    isOpen, 
    onClose, 
    title, 
	subtitle,
    children, 
    footer, 
    width = "xl",
    containerClassName = "bg-neutral-surface"
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
	subtitle?: string;
    children: ReactNode;
    footer?: ReactNode;
    width?: string;
    containerClassName?: string;
}) {
	if (width==="xl")
		width="[36rem]"
    return (
        <Backdrop isOpen={isOpen} onClose={onClose}>
            <div className={`${"w-"+width} ${"min-w-"+width} ${"max-w-"+width} ${containerClassName} rounded-xl shadow-xl relative p-6`}>
                
                {/* Header */}
                <div className="flex items-center justify-between">
					<div className="gap-2">
						<h2 className="text-xl font-bold text-foreground">
							{title}
						</h2>
						<div className="">
							<p className="text-sm min-w-0 break-words text-neutral-border">
								{subtitle}
							</p>
						</div>
					</div>
                    <button
                        onClick={onClose}
                        className="text-[#94A3B8] hover:text-[#475569] transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path
                                d="M15 5L5 15M5 5L15 15"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>

                <div className="h-px bg-[#dde4ee] -mx-6 my-4" />

                {/* Body Content */}
                <div>
                    {children}
                </div>

                {/* Optional Footer */}
                {footer && (
                    <>
                        <div className="h-px bg-[#dde4ee] -mx-6 my-4" />
                        <div className="flex justify-end gap-3">
                            {footer}
                        </div>
                    </>
                )}
            </div>
        </Backdrop>
    );
}