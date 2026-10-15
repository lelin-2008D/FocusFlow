import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskCard } from '../components/tasks/TaskCard'
import type { Task } from '../types/task'

describe('TaskCard Component', () => {
  const mockTask: Task = {
    id: 'test-card-1',
    title: 'Test Component Task',
    description: 'Detailed description for testing',
    priority: 'high',
    category: 'coding',
    completed: false,
    isTrash: false,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it('renders task title, description, priority badge, and category', () => {
    render(<TaskCard task={mockTask} />)

    expect(screen.getByText('Test Component Task')).toBeInTheDocument()
    expect(screen.getByText('Detailed description for testing')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('coding')).toBeInTheDocument()
  })

  it('triggers onEdit callback when title or edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<TaskCard task={mockTask} onEdit={onEdit} />)

    fireEvent.click(screen.getByText('Test Component Task'))
    expect(onEdit).toHaveBeenCalledWith(mockTask)
  })
})
