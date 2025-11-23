import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isMock } = useAuth();
  const location = useLocation();

  if (!user) return <div className="bg-slate-50 min-h-screen">{children}</div>;

  // Determine Dashboard Link based on role
  const dashboardLink = user.role === UserRole.ADMIN ? '/admin/dashboard' : '/client/dashboard';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm hidden md:flex">
        <div className="p-6 flex items-center space-x-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-bolt text-white"></i>
          </div>
          <span className="text-lg font-bold text-slate-800">Nexus Portal</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to={dashboardLink}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-slate-100 text-brand-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <i className="fa-solid fa-chart-pie w-5 text-center"></i>
            <span>Dashboard</span>
          </NavLink>

          {/* Admin Onboarding Review */}
          {user.role === UserRole.ADMIN && (
            <NavLink
              to="/admin/onboarding-review"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-brand-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <i className="fa-solid fa-clipboard-check w-5 text-center"></i>
              <span>Onboarding Review</span>
            </NavLink>
          )}

          {/* Client Onboarding Link */}
          {user.role === UserRole.CLIENT && (
            <NavLink
              to="/onboarding"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-brand-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <i className="fa-solid fa-rocket w-5 text-center"></i>
              <span>Onboarding</span>
            </NavLink>
          )}

          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-slate-100 text-brand-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
             <i className="fa-solid fa-list-check w-5 text-center"></i>
             <span>Tasks</span>
          </NavLink>
          
          <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase mt-4">
            {user.role === UserRole.ADMIN ? 'Management' : 'Project'}
          </div>
          
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-slate-100 text-brand-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
             <i className="fa-solid fa-comment w-5 text-center"></i>
             <span>Chat</span>
          </NavLink>

          <NavLink
            to="/invoices"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-slate-100 text-brand-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
             <i className="fa-solid fa-file-invoice-dollar w-5 text-center"></i>
             <span>Invoices</span>
          </NavLink>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-brand-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <i className="fa-solid fa-cog w-5 text-center"></i>
              <span>Settings</span>
            </NavLink>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
           {isMock && (
             <div className="mb-4 px-3 py-2 bg-amber-50 text-amber-700 text-xs rounded border border-amber-100">
               <i className="fa-solid fa-info-circle mr-1"></i>
               Running in Demo Mode
             </div>
           )}
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate lowercase">{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <i className="fa-solid fa-sign-out-alt"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-50 p-4 flex justify-between items-center">
          <span className="font-bold text-slate-800">Nexus Portal</span>
          <button onClick={() => logout()} className="text-slate-600"><i className="fa-solid fa-sign-out-alt"></i></button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 mt-16 md:mt-0">
        <div className="max-w-5xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;