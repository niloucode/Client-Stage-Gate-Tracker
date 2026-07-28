import { ReactNode } from "react"
import { Backdrop } from "@/shared/ui/backdrop"

export function Modal({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    footer, 
    width = "max-w-md",
    containerClassName = "bg-neutral-surface"
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    width?: string;
    containerClassName?: string;
}) {
    return (
        <Backdrop isOpen={isOpen} onClose={onClose}>
            <div className={`${containerClassName} rounded-xl shadow-xl w-full ${width} relative p-6`}>
                
                {/* Header */}
                <div className="flex items-center">
                    <h2 className="text-xl font-bold text-[#0F172A]">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="ml-auto text-[#94A3B8] hover:text-[#475569] transition-colors"
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