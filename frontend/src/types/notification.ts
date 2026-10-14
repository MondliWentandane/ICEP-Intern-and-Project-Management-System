import type { ID } from './common'
export interface Notification { id: ID; title: string; body?: string; read: boolean; createdAt: string }
export interface EmailTemplate { id: ID; name: string; subject: string }