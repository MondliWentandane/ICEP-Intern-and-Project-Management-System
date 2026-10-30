import { useEffect, type ReactNode } from 'react'

export const FIELD =
  'w-full rounded-2xl border border-transparent bg-[#f1f4fa] px-4 py-3 text-sm text-[#0f1b33] focus:border-[#0b2a5b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/20'

export const errorText = (error: unknown, fallback: string) => {
  const requestError = error as {
    message?: string
    code?: string
    response?: { status?: number; data?: unknown }
  }
  const data = requestError?.response?.data
  if (data && typeof data === 'object') {
    const body = data as { error?: unknown; message?: unknown }
    if (typeof body.error === 'string' && body.error.trim()) return body.error
    if (typeof body.message === 'string' && body.message.trim()) return body.message
  }
  if (typeof data === 'string' && data.trim()) return data

  // Axios has no response when the backend cannot be reached or the request times out.
  if (!requestError?.response && (requestError?.code === 'ECONNABORTED' || requestError?.code === 'ERR_NETWORK')) {
    return 'Could not reach the backend. Check that it is running on port 5000 and can connect to the database, then try again.'
  }
  if (requestError?.response?.status) {
    return `The server returned an error (${requestError.response.status}). Check the backend terminal for details.`
  }
  return requestError?.message || fallback
}

export function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-[#0f1b33]">{title}</h2>
        {children}
      </div>
    </div>
  )
}
