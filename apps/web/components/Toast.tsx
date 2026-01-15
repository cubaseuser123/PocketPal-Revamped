"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-24 right-4 z-[60] animate-in fade-in slide-in-from-top-5 duration-300">
      <div className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/10 shadow-2xl rounded-2xl p-4 flex items-center gap-3 pr-6 group backdrop-blur-xl">
        <div className="bg-primary/10 rounded-full p-2">
          <span className="material-icons-round text-primary text-xl">
            construction
          </span>
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            Coming Soon
          </h4>
          <p className="text-xs text-muted-light dark:text-muted-dark font-medium">
            {message}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <span className="material-icons-round text-sm">close</span>
        </button>
      </div>
    </div>
  );
}
