import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', active: 4000, spend: 2400 },
  { name: 'Tue', active: 3000, spend: 1398 },
  { name: 'Wed', active: 2000, spend: 9800 },
  { name: 'Thu', active: 2780, spend: 3908 },
  { name: 'Fri', active: 1890, spend: 4800 },
  { name: 'Sat', active: 2390, spend: 3800 },
  { name: 'Sun', active: 3490, spend: 4300 },
];

const StatCard = ({ title, value, trend, icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      <div className={`flex items-center mt-2 text-sm ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
        <i className={`fa-solid ${trend.startsWith('+') ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`}></i>
        <span>{trend} vs last week</span>
      </div>
    </div>
    <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
      <i className={`fa-solid ${icon} text-xl ${color.replace('bg-', 'text-')}`}></i>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Spend" value="$12,450" trend="+12%" icon="fa-wallet" color="bg-blue-500" />
        <StatCard title="Active Campaigns" value="8" trend="+2" icon="fa-bullhorn" color="bg-indigo-500" />
        <StatCard title="Impressions" value="1.2M" trend="+8.5%" icon="fa-eye" color="bg-purple-500" />
        <StatCard title="Conversions" value="432" trend="-1.2%" icon="fa-filter" color="bg-pink-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Performance Overview</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="spend" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Tasks Snapshot */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Pending Actions</h3>
              <button className="text-brand-600 text-sm font-medium hover:underline">View All</button>
           </div>
           <div className="space-y-4">
              {[
                { title: 'Approve Creatives', due: 'Today', type: 'Action' },
                { title: 'Invoice #402 Overdue', due: 'Yesterday', type: 'Alert' },
                { title: 'Sign Contract', due: 'Oct 24', type: 'Doc' }
              ].map((item, i) => (
                <div key={i} className="flex items-center p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${item.type === 'Alert' ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                    <i className={`fa-solid ${item.type === 'Alert' ? 'fa-exclamation' : 'fa-check'}`}></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                    <p className="text-xs text-slate-500">Due {item.due}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
