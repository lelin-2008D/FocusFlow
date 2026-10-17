import { db } from './index'
import type { Project, UserSettings, Task } from '../types/task'

export const DEFAULT_PROJECTS: Project[] = [
  { id: 'proj-coding', name: 'Coding & Dev', color: '#8EB69B', icon: 'Code', createdAt: new Date().toISOString() },
  { id: 'proj-work', name: 'Work / Clients', color: '#235347', icon: 'Briefcase', createdAt: new Date().toISOString() },
  { id: 'proj-personal', name: 'Personal Life', color: '#2D6A5B', icon: 'User', createdAt: new Date().toISOString() },
]

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'current_user_settings',
  theme: 'dark',
  soundEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  defaultPriority: 'medium',
  defaultCategory: 'coding',
}

export async function initializeDatabase(): Promise<void> {
  try {
    const [settingsCount, projectsCount, tasksCount] = await Promise.all([
      db.settings.count(),
      db.projects.count(),
      db.tasks.count(),
    ])

    // Fast-path: already seeded, avoid unnecessary transactions
    if (settingsCount > 0 && projectsCount > 0 && tasksCount > 0) {
      return
    }

    await db.transaction('rw', [db.settings, db.projects, db.tasks, db.subtasks], async () => {
      if (settingsCount === 0) {
        await db.settings.add(DEFAULT_SETTINGS)
      }

      if (projectsCount === 0) {
        await db.projects.bulkAdd(DEFAULT_PROJECTS)
      }

      if (tasksCount === 0) {
        const today = new Date().toISOString().split('T')[0]
        
        // Seed initial welcome tasks to give user an immediate rich interactive experience
        const welcomeTasks: Task[] = [
          {
            id: 'task-welcome-1',
            title: 'Welcome to FocusFlow! Explore your offline-first tasks 🚀',
            description: 'FocusFlow stores all your tasks in local IndexedDB. It works completely offline, with glassmorphism design and subtask tracking.',
            priority: 'high',
            category: 'coding',
            projectId: 'proj-coding',
            dueDate: today,
            dueTime: '18:00',
            completed: false,
            isTrash: false,
            order: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reminderEnabled: true,
            reminderTime: `${today}T18:00:00`,
            reminderRule: 'once',
          },
          {
            id: 'task-welcome-2',
            title: 'Review keyboard navigation and shortcuts ⌨️',
            description: 'Press Escape to close modals, Tab to navigate, and try adding subtasks to this task.',
            priority: 'medium',
            category: 'work',
            projectId: 'proj-work',
            dueDate: today,
            completed: false,
            isTrash: false,
            order: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'task-welcome-3',
            title: 'Test offline mode: disconnect Wi-Fi and create a task 🌐',
            description: 'Refresh the page while offline. Your tasks persist securely in your browser.',
            priority: 'urgent',
            category: 'personal',
            projectId: 'proj-personal',
            dueDate: today,
            completed: true,
            completedAt: new Date().toISOString(),
            isTrash: false,
            order: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]

        await db.tasks.bulkAdd(welcomeTasks)

        await db.subtasks.bulkAdd([
          {
            id: 'subtask-1',
            taskId: 'task-welcome-1',
            title: 'Click the checkbox to complete this subtask',
            completed: true,
            order: 1,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'subtask-2',
            taskId: 'task-welcome-1',
            title: 'Add a new subtask using the inline input below',
            completed: false,
            order: 2,
            createdAt: new Date().toISOString(),
          },
        ])
      }
    })
  } catch (err) {
    console.warn('Database initialization completed with warning:', err)
  }
}
