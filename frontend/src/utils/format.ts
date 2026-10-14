export function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') }
export function formatDate(value?: string) { return value ? new Intl.DateTimeFormat('en-ZA').format(new Date(value)) : '—' }
export function formatFileSize(bytes: number) { return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB` }
export function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url) }
export function cn(...values: Array<string | false | null | undefined>) { return values.filter(Boolean).join(' ') }
