import { useEffect } from 'react'

export interface ToastMessage {
  id: number
  text: string
  /** Show a "View" link to the Saved tab. */
  view?: boolean
}

/** A short confirmation at the bottom of the screen that hides itself after ~3 seconds. */
export function Toast({ toast, onDone }: { toast: ToastMessage | null; onDone: () => void }) {
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(onDone, 3200)
    return () => window.clearTimeout(id)
  }, [toast, onDone])

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.id} data-cy="toast">
          <span>{toast.text}</span>
          {toast.view && (
            <a href="#saved" onClick={onDone} data-cy="toast-view">
              View
            </a>
          )}
        </div>
      )}
    </div>
  )
}
