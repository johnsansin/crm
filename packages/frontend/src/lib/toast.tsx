import { useState, useCallback, createContext, useContext } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (t: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...t, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`rounded-lg border px-4 py-3 shadow-lg text-sm animate-in slide-in-from-right ${
              toast.variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground border-destructive'
                : toast.variant === 'success'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-card text-card-foreground border'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{toast.title}</p>
                {toast.description && <p className="text-xs opacity-90">{toast.description}</p>}
              </div>
              <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100">&times;</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
