import Dexie, { type EntityTable } from 'dexie'
import type { Task, Subtask, Project, UserSettings } from '../types/task'

export interface MutationRecord {
  id: string
  entity: 'task' | 'subtask' | 'project' | 'settings'
  entityId: string
  operation: 'create' | 'update' | 'delete'
  payload: any
  createdAt: string
  retryCount: number
  status: 'pending' | 'syncing' | 'failed'
}

export class FocusFlowDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  subtasks!: EntityTable<Subtask, 'id'>
  projects!: EntityTable<Project, 'id'>
  settings!: EntityTable<UserSettings, 'id'>
  outbox!: EntityTable<MutationRecord, 'id'>

  constructor() {
    super('FocusFlowDB')
    
    this.version(1).stores({
      tasks: 'id, category, priority, dueDate, completed, isTrash, projectId, updatedAt, order, [isTrash+completed]',
      subtasks: 'id, taskId, order',
      projects: 'id, name',
      settings: 'id',
      outbox: 'id, entity, entityId, status, createdAt',
    })
  }
}

export const db = new FocusFlowDatabase()
