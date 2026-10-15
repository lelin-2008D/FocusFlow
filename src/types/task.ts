import { z } from 'zod'

export type Priority = 'urgent' | 'high' | 'medium' | 'low'
export type Category = 'coding' | 'work' | 'personal' | 'study' | 'health' | 'finance' | 'other'
export type RecurrenceRule = 'once' | 'daily' | 'weekdays' | 'weekly' | 'monthly'

export interface Subtask {
  id: string
  taskId: string
  title: string
  completed: boolean
  order: number
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  category: Category
  projectId?: string
  dueDate?: string // YYYY-MM-DD
  dueTime?: string // HH:mm
  completed: boolean
  completedAt?: string
  isTrash: boolean
  trashedAt?: string
  order: number
  createdAt: string
  updatedAt: string
  reminderEnabled?: boolean
  reminderTime?: string // ISO timestamp
  reminderRule?: RecurrenceRule
}

export interface Project {
  id: string
  name: string
  color: string
  icon?: string
  createdAt: string
}

export interface UserSettings {
  id: string
  theme: 'dark' | 'light' | 'system'
  soundEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string // HH:mm
  quietHoursEnd: string // HH:mm
  defaultPriority: Priority
  defaultCategory: Category
}

// Zod schemas for runtime validation
export const TaskInputSchema = z.object({
  title: z.string().trim().min(1, 'Task title cannot be empty').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  category: z.enum(['coding', 'work', 'personal', 'study', 'health', 'finance', 'other']),
  projectId: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional().or(z.literal('')),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)').optional().or(z.literal('')),
  reminderEnabled: z.boolean().optional(),
  reminderTime: z.string().optional(),
  reminderRule: z.enum(['once', 'daily', 'weekdays', 'weekly', 'monthly']).optional(),
})

export type TaskInput = z.infer<typeof TaskInputSchema>

export const SubtaskInputSchema = z.object({
  title: z.string().trim().min(1, 'Subtask title cannot be empty').max(150),
})
