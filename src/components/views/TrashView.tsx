import React from 'react'
import { Trash2 } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { TaskList } from '../tasks/TaskList'
import { Button } from '../common/Button'
import { taskService } from '../../services/taskService'

export const TrashView: React.FC = () => {
  const { tasks, isLoading } = useTasks('trash')

  const handleEmptyTrash = async () => {
    if (tasks.length === 0) return
    if (window.confirm('Are you sure you want to permanently delete all items in Trash? This cannot be undone.')) {
      try {
        await taskService.emptyTrash()
      } catch (err) {
        console.error('Failed to empty trash:', err)
      }
    }
  }

  return (
    <div className="space-y-5 animate-fade-in pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80 light:border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-slate-400" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white light:text-slate-900">
              Trash
            </h2>
          </div>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">
            Deleted tasks can be restored here or permanently removed
          </p>
        </div>

        {tasks.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleEmptyTrash}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Empty Trash
          </Button>
        )}
      </div>

      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        isTrashView={true}
        emptyMessage="Trash is empty"
        emptySubtext="Items you delete will show up here."
      />
    </div>
  )
}
