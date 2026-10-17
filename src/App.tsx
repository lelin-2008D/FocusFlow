import { useState, useEffect } from 'react'
import { Header } from './components/layout/Header'
import { Sidebar, type ActiveView } from './components/layout/Sidebar'
import { MobileNav } from './components/layout/MobileNav'
import { TodayView } from './components/views/TodayView'
import { UpcomingView } from './components/views/UpcomingView'
import { OverdueView } from './components/views/OverdueView'
import { CompletedView } from './components/views/CompletedView'
import { AllTasksView } from './components/views/AllTasksView'
import { TrashView } from './components/views/TrashView'
import { TaskFormModal } from './components/tasks/TaskFormModal'
import { AuthModal } from './components/auth/AuthModal'
import { NotificationSettingsModal } from './components/reminders/NotificationSettingsModal'
import { InstallPromptBanner } from './components/pwa/InstallPromptBanner'
import { initializeDatabase } from './db/seed'
import { syncEngine } from './services/syncEngine'
import { taskService } from './services/taskService'
import { computeSnooze } from './utils/recurrenceUtils'
import type { Task } from './types/task'

export function App() {
  const [activeView, setActiveView] = useState<ActiveView>('today')
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)

  useEffect(() => {
    initializeDatabase()
      .then(() => {
        // Start background periodic sync engine
        syncEngine.startPeriodicSync(30000)
      })
      .catch((err) => {
        console.warn('Database initialization warning:', err)
      })

    // Listen for Service Worker messages (e.g. user clicked notification action buttons)
    if ('serviceWorker' in navigator) {
      const handleMessage = async (event: MessageEvent) => {
        const { type, action, taskId } = event.data || {}
        if (type === 'NOTIFICATION_ACTION' && taskId) {
          if (action === 'complete') {
            await taskService.toggleComplete(taskId)
          } else if (action === 'snooze_15') {
            const targetDate = computeSnooze('15m')
            const datePart = targetDate.toISOString().split('T')[0]
            const hours = String(targetDate.getHours()).padStart(2, '0')
            const mins = String(targetDate.getMinutes()).padStart(2, '0')
            await taskService.updateTask(taskId, {
              dueDate: datePart,
              dueTime: `${hours}:${mins}`,
              reminderTime: targetDate.toISOString(),
            })
          }
        }
      }

      navigator.serviceWorker.addEventListener('message', handleMessage)
      return () => {
        syncEngine.stopPeriodicSync()
        navigator.serviceWorker.removeEventListener('message', handleMessage)
      }
    }

    return () => {
      syncEngine.stopPeriodicSync()
    }
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return

      if (e.key === 'c' || (e.ctrlKey && e.key === 'n')) {
        e.preventDefault()
        setTaskToEdit(null)
        setIsModalOpen(true)
      } else if (e.key === '1') {
        setActiveView('today')
      } else if (e.key === '2') {
        setActiveView('upcoming')
      } else if (e.key === '3') {
        setActiveView('overdue')
      } else if (e.key === '4') {
        setActiveView('all')
      } else if (e.key === '5') {
        setActiveView('completed')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task)
    setIsModalOpen(true)
  }

  const handleOpenNewTask = () => {
    setTaskToEdit(null)
    setIsModalOpen(true)
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'today':
        return <TodayView onEditTask={handleEditTask} projectId={selectedProjectId} />
      case 'upcoming':
        return <UpcomingView onEditTask={handleEditTask} projectId={selectedProjectId} />
      case 'overdue':
        return <OverdueView onEditTask={handleEditTask} projectId={selectedProjectId} />
      case 'completed':
        return <CompletedView onEditTask={handleEditTask} projectId={selectedProjectId} />
      case 'all':
        return <AllTasksView onEditTask={handleEditTask} projectId={selectedProjectId} />
      case 'trash':
        return <TrashView />
      default:
        return <TodayView onEditTask={handleEditTask} projectId={selectedProjectId} />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-forest-950 light:bg-mint-50 transition-colors text-mint-100 light:text-forest-950">
      <Header
        onOpenNewTaskModal={handleOpenNewTask}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenNotificationSettingsModal={() => setIsNotificationModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          className="hidden md:flex"
        />

        <main className="flex-1 px-4 sm:px-8 pt-4 sm:pt-6 pb-28 md:pb-8 max-w-4xl w-full overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      <footer className="w-full border-t border-mint-400/10 light:border-forest-700/10 px-4 py-3 pb-24 md:pb-4 text-center text-[11px] text-forest-400 light:text-forest-600">
        © {new Date().getFullYear()} FocusFlow · Built for focused work
      </footer>

      <MobileNav
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenNewTaskModal={handleOpenNewTask}
      />

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setTaskToEdit(null)
        }}
        taskToEdit={taskToEdit}
        defaultDueDate={activeView === 'today' ? new Date().toISOString().split('T')[0] : undefined}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      <InstallPromptBanner />
    </div>
  )
}

export default App
