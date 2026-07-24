import { LucideCircleX,  
        LucideTriangleAlert ,
        LucideTrash2, 
        LucideCircleCheck,
        LucideX } from 'lucide-react'
import { useState,useEffect } from 'react'

export function Toast({
  isOpen,
	type="delete",
	title,
	description,
  duration = 4000
}:{
  isOpen:boolean,
	type?: string,
	title?: string,
	description?: string,
  duration?: number
})
{
  const [visible, setVisible] = useState(true)

  const openModal = () => {setVisible(true)}

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])
  

  const onClose = (()=>{
    setVisible(false)
  })

	var colorComponent = type ? type == "error" ? "#B81C1C" :
								type == "check" ? "#016A43" :
								type == "delete" ? "#016A43" :
								type == "exclamation" ? "#8B5E00" : "" : ""

	var iconComponent = type ? type == "error" ? <LucideCircleX color={colorComponent}/> :
								type == "check" ? <LucideCircleCheck color={colorComponent}/> :
								type == "delete" ? <LucideTrash2 color={colorComponent}/> :
								type == "exclamation" ? <LucideTriangleAlert color={colorComponent}/> : <></> : <></>
  
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