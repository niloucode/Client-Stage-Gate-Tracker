"use client"

import { useState, useEffect, ReactNode } from "react"

interface BackdropProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export function Backdrop({ isOpen, onClose, children }: BackdropProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
		setMounted(true)
		const mountTimer = setTimeout(() => setVisible(true), 10)
		return () => clearTimeout(mountTimer)
    } else {
		setVisible(false)
		const unmountTimer = setTimeout(() => setMounted(false), 100)
		return () => clearTimeout(unmountTimer)
    }
  }, [isOpen])

  if (!mounted) return null

  return (
    <div
      	onClick={(e) => {
			e.stopPropagation()
			onClose()
		}}
		className={`cursor-default fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-all duration-100 ease-out ${
			visible ? "opacity-100" : "opacity-0"}`}
    >
		<div
			onClick={(e) => e.stopPropagation()}
			className={`transition-all duration-100 ease-out transform ${
			visible ? "opacity-100" : "opacity-0"}`}
		>
			{children}
		</div>
    </div>
  )
}