'use client'
import { useState } from 'react'

interface Goal {
  id: string
  title: string
  description: string
  target: number
  current: number
  unit: string
  deadline: number
  createdAt: string
}

export default function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [target, setTarget] = useState('')
  const [unit, setUnit] = useState('')
  const [deadline, setDeadline] = useState('')

  function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !target || !unit || !deadline) return

    const newGoal: Goal = {
      id: Date.now().toString(),
      title,
      description,
      target: Number(target),
      current: 0,
      unit,
      deadline: Number(deadline),
      createdAt: new Date().toISOString()
    }

    setGoals([...goals, newGoal])
    setTitle('')
    setDescription('')
    setTarget('')
    setUnit('')
    setDeadline('')
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">NorthStar 🌟</h1>
            <p className="text-slate-400 text-sm mt-1">Track goals, measure consistency, achieve results</p>
          </div>
          <button onClick={() => window.location.href = '/'} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-all">Logout</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Total Goals</p>
            <p className="text-3xl font-bold text-white mt-1">{goals.length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{goals.filter(g => g.current >= g.target).length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-sm">In Progress</p>
            <p className="text-3xl font-bold text-blue-400 mt-1">{goals.filter(g => g.current < g.target).length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-sm">Total Progress</p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">{goals.reduce((a, g) => a + g.current, 0)}</p>
          </div>
        </div>

        {/* Create Goal Form */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Create New Goal</h2>
          <form onSubmit={handleCreateGoal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Goal Title</label>
              <input type="text" placeholder="e.g. Learn Python" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500"/>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Description</label>
              <input type="text" placeholder="Additional details" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500"/>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Target Amount</label>
              <input type="number" placeholder="e.g. 100" value={target} onChange={e => setTarget(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500"/>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Unit</label>
              <input type="text" placeholder="e.g. hours, pages" value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500"/>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Deadline (Days)</label>
              <input type="number" placeholder="e.g. 30" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-blue-500"/>
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all">Create Goal</button>
            </div>
          </form>
        </div>

        {/* Goals List */}
        <div>
          <h2 className="text-xl font-bold mb-4">Your Goals</h2>
          {goals.length === 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center text-slate-400">
              No goals yet. Create one to get started!
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => {
              const progress = Math.min((goal.current / goal.target) * 100, 100)
              return (
                <div key={goal.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg">{goal.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}>
                      {progress >= 100 ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  {goal.description && <p className="text-slate-400 text-sm mb-3">{goal.description}</p>}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-400">{goal.current} / {goal.target} {goal.unit}</span>
                      <span className="text-blue-400">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <input type="number" placeholder="Log progress" className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500"/>
                    <button onClick={(e) => {
                      const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement
                      const amount = Number(input.value)
                      if (!amount) return
                      setGoals(goals.map(g => g.id === goal.id ? { ...g, current: Math.min(g.current + amount, g.target) } : g))
                      input.value = ''
                    }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-all">Log</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </main>
  )
}