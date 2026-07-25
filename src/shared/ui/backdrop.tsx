import React from 'react';

interface BackdropProps {
  children: React.ReactNode;
  onClose?: () => void;
}

export const Backdrop = ({ children, onClose }: BackdropProps) => {
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};