import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidthStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[maxWidth]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full rounded-2xl border border-slate-700/60 light:border-slate-300 bg-navy-900/95 light:bg-white/95 p-5 sm:p-6 shadow-2xl backdrop-blur-glass z-10 animate-slide-up text-slate-100 light:text-slate-900 max-h-[90vh] overflow-y-auto',
          maxWidthStyles
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold tracking-tight text-white light:text-slate-900">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-slate-400 light:text-slate-600 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-slate-800 light:hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-2">{children}</div>
      </div>
    </div>
  )
}
