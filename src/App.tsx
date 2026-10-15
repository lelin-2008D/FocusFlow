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
import { initializeDatabase } from './db/seed'
import { syncEngine } from './services/syncEngine'
import type { Task } from './types/task'

export function App() {
  const [activeView, setActiveView] = useState<ActiveView>('today')
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [isDbReady, setIsDbReady] = useState(false)

  useEffect(() => {
    initializeDatabase().then(() => {
      setIsDbReady(true)
      // Start background periodic sync engine
      syncEngine.startPeriodicSync(30000)
    })

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
    <div className="min-h-screen flex flex-col bg-navy-950 light:bg-slate-50 transition-colors">
      <Header
        onOpenNewTaskModal={handleOpenNewTask}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          className="hidden md:flex"
        />

        <main className="flex-1 px-4 sm:px-8 py-6 max-w-4xl w-full overflow-y-auto">
          {!isDbReady ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <div className="animate-spin h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full mr-3" />
              <span>Loading FocusFlow database...</span>
            </div>
          ) : (
            renderActiveView()
          )}
        </main>
      </div>

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
    </div>
  )
}

export default App
