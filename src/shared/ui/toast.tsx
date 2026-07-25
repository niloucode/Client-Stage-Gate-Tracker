"use client"

import { LucideCircleX,  
        LucideTriangleAlert ,
        LucideTrash2, 
        LucideCircleCheck,
        LucideX,
		LucideCircleQuestionMark 
	} from 'lucide-react'
import { createContext, useContext, useState, useEffect,ReactNode } from 'react'

interface ToastContextType{
	showToast:(title:string, description?:string,type?:string)=>void
}

const ToastContext = createContext<ToastContextType|undefined>(undefined)

export function ToastProvider({ children }:{children:ReactNode}) {
  	const [toastConfig, setToastConfig] = useState<{
		id:number,
		title: string,
		description?: string,
		type?: string
	} | null>(null)

	const showToast = (title:string, description?:string,type?:string) => 
	{setToastConfig({id:Date.now(),title,description,type})}

	return (
		<ToastContext.Provider value={{ showToast }}>
		{children}
		{toastConfig && (
			<Toast
				id={toastConfig.id}
				isOpen={true}
				title={toastConfig.title}
				description={toastConfig.description}
				type={toastConfig.type}
			/>)
		}
		</ToastContext.Provider>
	);
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function Toast({
	id,
	isOpen=false,
	type="",
	title,
	description,
	duration = 4000
}:{
	id: number,
	isOpen: boolean,
	title?: string,
	description?: string,
	type?: string,
	duration?: number
})
{
	const [visible, setVisible] = useState(true)

	useEffect(() => {
		setVisible(true)
		const timer = setTimeout(() => {
			setVisible(false)
		}, duration)

		return () => clearTimeout(timer)
	}, [id, title, description, type, duration])
	

	const onClose = (()=>{
		setVisible(false)
	})

  	const TOAST_COLORS: Record<string, string> = {
		error:"#B81C1C",
		check:"#016A43",
		delete:"#016A43",
		exclamation:"#8B5E00",
	}

	const colorComponent = TOAST_COLORS[type] || "#000000";

	const TOAST_ICONS: Record<string, ReactNode> = {
		error:<LucideCircleX color={colorComponent}/>,
		check:<LucideCircleCheck color={colorComponent}/>,
		delete:<LucideTrash2 color={colorComponent}/>,
		exclamation:<LucideTriangleAlert color={colorComponent}/>,
	}

	const iconComponent = TOAST_ICONS[type] || <LucideCircleQuestionMark color={colorComponent}/>
  
	return (
    <div
      className={`fixed top-20 h-20 w-75 transition-all duration-500 ease-out ${
        visible
          ? 'right-0 opacity-100 pointer-events-auto'
          : '-right-10 opacity-0 pointer-events-none'
      }`}
    >
        <div className={"overflow-hidden border-1 rounded-l-2xl border-[#C7C4D8] ml-auto flex items-center bg-white h-full w-72"}>
			<div className={"h-full w-[10px]"}
            	style={{backgroundColor:colorComponent}}>
			</div>
			<div className="m-3.5">
				{iconComponent}
			</div>
			<div>
				<div className="text-[#151C27] w-43 truncate h-[24px] font-bold">{title}</div>
				<div className="text-[#464555] w-43 truncate h-[24px]">{description}</div>
			</div>
			<button onClick={onClose}>
			<LucideX className="hover:text-gray-400 transition-all duration-300"/>
			</button>
		</div>
	</div>
	)
}