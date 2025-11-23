import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockDb, mockAuth } from '../../services/mockDb';
import { UserRole } from '../../types';

const StatCard = ({ title, value, color, icon }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800 mt-1">{value}</h3>
    </div>
    <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center text-white text-xl shadow-md`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ clients: 0, activeTasks: 0, reports: 0 });
  const [recentChats, setRecentChats] = useState<{name: string, message: string, time: string}[]>([]);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientName, setNewClientName] = useState('');

  const refreshData = async () => {
    // 1. Count Clients
    const users = await mockDb.getClients();
    
    // 2. Count Active Tasks
    const allTasks = await mockDb.getTasks('admin', 'admin'); // user/role logic in mockDb handles admin getting all
    const activeTasks = allTasks.filter((t: any) => t.status !== 'DONE').length;

    // 3. Count Reports
    const invoices = await mockDb.getInvoices('admin', 'admin');
    const totalReports = invoices.length; // Using invoices as proxy for now per prompt

    setStats({
      clients: users.length,
      activeTasks: activeTasks,
      reports: totalReports
    });

    // 4. Get Recent Chats
    const chats = await mockDb.getDashboardChats();
    setRecentChats(chats);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newClientEmail || !newClientName) return;

      await mockAuth.signUp(newClientEmail, newClientName, UserRole.CLIENT);
      setShowAddClient(false);
      setNewClientName('');
      setNewClientEmail('');
      refreshData();
      // In a real app we'd show a success toast here
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500">Welcome back, {user?.name}</p>
        </div>
        <button 
            onClick={() => setShowAddClient(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center shadow-md"
        >
            <i className="fa-solid fa-plus mr-2"></i> Add New Client
        </button>
      </div>

      {/* Add Client Modal */}
      {showAddClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-800">Add New Client</h3>
                      <button onClick={() => setShowAddClient(false)} className="text-slate-400 hover:text-slate-600">
                          <i className="fa-solid fa-times"></i>
                      </button>
                  </div>
                  <form onSubmit={handleAddClient} className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Client Name</label>
                          <input type="text" value={newClientName} onChange={e => setNewClientName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
                          <input type="email" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
                      </div>
                      <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-lg font-bold hover:bg-brand-700">Create Account</button>
                  </form>
              </div>
          </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Clients" 
          value={stats.clients}
          color="bg-blue-500" 
          icon="fa-users" 
        />
        <StatCard 
          title="Active Tasks" 
          value={stats.activeTasks}
          color="bg-emerald-500" 
          icon="fa-tasks" 
        />
        <StatCard 
          title="Total Reports" 
          value={stats.reports}
          color="bg-purple-500" 
          icon="fa-file-contract" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Chats */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800">Latest Chats</h3>
                  <span className="text-xs font-bold text-slate-400 uppercase">Last 3 Messages</span>
              </div>
              <div className="divide-y divide-slate-100">
                  {recentChats.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No recent messages found.</div>}
                  {recentChats.map((chat, idx) => (
                      <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold shrink-0">
                              {chat.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                  <p className="text-sm font-bold text-slate-900 truncate">{chat.name}</p>
                                  <span className="text-xs text-slate-400">{chat.time}</span>
                              </div>
                              <p className="text-sm text-slate-500 truncate">{chat.message}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Latest Report Uploaded (Mock) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
               <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800">Latest Report Uploaded</h3>
               </div>
               <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  {stats.reports > 0 ? (
                      <>
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-xl flex items-center justify-center text-3xl mb-3 shadow-sm">
                            <i className="fa-solid fa-file-pdf"></i>
                        </div>
                        <h4 className="font-bold text-slate-800">Monthly Performance_Oct.pdf</h4>
                        <p className="text-xs text-slate-500 mb-4">Uploaded 2 hours ago by Admin</p>
                        <button className="text-sm font-bold text-brand-600 hover:underline">View Report</button>
                      </>
                  ) : (
                      <p className="text-slate-400">No reports uploaded yet.</p>
                  )}
               </div>
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;