import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTasks, setActiveTasks] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    if (!user) return;

    // 1. Get tasks from Local Storage
    const tasks = JSON.parse(localStorage.getItem('nexus_tasks_v2') || '[]');

    // 2. Filter: Must be assigned to ME and NOT 'DONE'
    const myActiveTasks = tasks.filter((t: any) => 
      t.assignedToId === user.id && t.status !== 'DONE'
    ).length;

    setActiveTasks(myActiveTasks);
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [user]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Client Overview</h1>
            <p className="text-slate-500">Welcome back, {user?.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Your Status</h3>
            <span className="text-xs text-slate-400">Last Updated: {lastUpdated}</span>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
                 <div className="text-sm text-slate-500 uppercase font-bold mb-1">Active Tasks</div>
                 <div className={`text-5xl font-bold mb-2 ${activeTasks > 0 ? 'text-brand-600' : 'text-slate-900'}`}>
                    {activeTasks}
                 </div>
                 <p className="text-slate-400 text-sm">
                    {activeTasks > 0 
                        ? "You have tasks requiring attention." 
                        : "You're all caught up!"}
                 </p>
            </div>
            <div className="flex justify-center md:justify-end">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 ${activeTasks > 0 ? 'bg-brand-50 border-brand-100' : 'bg-slate-50 border-slate-100'}`}>
                    {activeTasks > 0 ? (
                         <i className="fa-solid fa-clipboard-list text-4xl text-brand-500"></i>
                    ) : (
                         <i className="fa-solid fa-check text-4xl text-emerald-500"></i>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;