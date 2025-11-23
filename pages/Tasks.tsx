import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockDb } from '../services/mockDb';
import { Task, User, UserRole, TaskStatus } from '../types';

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  
  // Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Data
  const refreshData = async () => {
    if (!user) return;
    
    // 1. Get Tasks
    const fetchedTasks = await mockDb.getTasks(user.id, user.role);
    // Sort: Newest updated first
    fetchedTasks.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    setTasks(fetchedTasks);

    // 2. Get Clients (Only for Admin)
    if (user.role === UserRole.ADMIN) {
      const fetchedClients = await mockDb.getClients();
      setClients(fetchedClients);
      // Default select first client if available and none selected
      if (fetchedClients.length > 0 && !selectedClientId) {
        setSelectedClientId(fetchedClients[0].id);
      }
    }
    setIsLoading(false);
  };

  // Initial Load
  useEffect(() => {
    refreshData();
  }, [user]);

  // Handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedClientId) return;

    await mockDb.createTask({
      title: newTaskTitle,
      assignedToId: selectedClientId,
      status: TaskStatus.TODO
    });
    
    setNewTaskTitle('');
    await refreshData(); // Update UI immediately
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    await mockDb.updateTaskStatus(task.id, newStatus);
    await refreshData(); // Update UI immediately
  };

  // Helpers
  const getClientEmail = (id?: string) => {
    const client = clients.find(c => c.id === id);
    return client ? client.email : 'Unknown Client';
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString([], { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading tasks...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {user?.role === UserRole.ADMIN ? 'Project Assignments' : 'My Tasks'}
          </h1>
          <p className="text-slate-500 mt-1">
            {user?.role === UserRole.ADMIN 
              ? 'Manage deliverables and assign work to clients.' 
              : 'Keep track of your project to-dos and progress.'}
          </p>
        </div>
      </div>

      {/* Admin: Create Task Form */}
      {user?.role === UserRole.ADMIN && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <i className="fa-solid fa-plus-circle text-brand-600 mr-2"></i>
            Create New Task
          </h3>
          <form onSubmit={handleCreateTask} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Task Name</label>
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="e.g. Review Homepage Design"
                required
              />
            </div>
            <div className="w-full md:w-72">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assign To Client</label>
              <select 
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              >
                {clients.length === 0 && <option value="">No Clients Found</option>}
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.email} ({c.name})</option>
                ))}
              </select>
            </div>
            <button 
              type="submit"
              className="w-full md:w-auto px-6 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-md"
            >
              Add Task
            </button>
          </form>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
            <i className="fa-regular fa-clipboard text-4xl mb-3 block"></i>
            <span className="font-medium">No active tasks found.</span>
          </div>
        )}

        {tasks.map(task => (
          <div 
            key={task.id} 
            className={`group flex flex-col md:flex-row md:items-center justify-between p-5 bg-white rounded-xl border transition-all duration-200
              ${task.status === TaskStatus.DONE 
                ? 'border-slate-100 opacity-60 bg-slate-50' 
                : 'border-slate-200 hover:border-brand-300 hover:shadow-md'
              }`}
          >
            {/* Left: Status & Info */}
            <div className="flex items-start space-x-4">
              <button 
                onClick={() => toggleStatus(task)}
                className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                  ${task.status === TaskStatus.DONE
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-slate-300 text-transparent hover:border-brand-500 hover:bg-brand-50'
                  }`}
              >
                <i className="fa-solid fa-check text-xs"></i>
              </button>
              
              <div>
                <h4 className={`text-lg font-medium ${task.status === TaskStatus.DONE ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                  {task.title}
                </h4>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                  {/* Status Badge */}
                  <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wide
                    ${task.status === TaskStatus.DONE 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-amber-100 text-amber-700'}
                  `}>
                    {task.status === TaskStatus.DONE ? 'Completed' : 'Pending'}
                  </span>

                  {/* Admin: Show Assigned User */}
                  {user?.role === UserRole.ADMIN && (
                    <span className="flex items-center text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      <i className="fa-solid fa-user-tag mr-1.5 text-slate-400"></i>
                      {getClientEmail(task.assignedToId)}
                    </span>
                  )}

                  {/* Timestamps */}
                  <span className="flex items-center" title={`Created: ${formatDate(task.createdAt)}`}>
                    <i className="fa-regular fa-clock mr-1.5"></i>
                    Updated: {formatDate(task.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Action Button */}
            <div className="mt-4 md:mt-0 md:pl-4 flex justify-end">
              <button 
                onClick={() => toggleStatus(task)}
                className={`text-sm font-medium px-3 py-1 rounded transition-colors
                  ${task.status === TaskStatus.DONE 
                    ? 'text-slate-400 hover:bg-slate-100' 
                    : 'text-brand-600 hover:bg-brand-50'}
                `}
              >
                {task.status === TaskStatus.DONE ? 'Mark Undone' : 'Mark Done'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;