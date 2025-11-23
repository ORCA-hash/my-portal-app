import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      navigate(user.role === UserRole.ADMIN ? '/admin/dashboard' : '/client/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const { error } = await login(email, password);
    if (error) {
      setError(error);
    } 
    // Navigation happens in useEffect via AuthContext state change or we can do it here manually if we want to be explicit
    // But relying on context update is safer
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-6 text-center">
           <i className="fa-solid fa-bolt text-3xl text-brand-500 mb-2"></i>
           <h2 className="text-xl font-bold text-white">Welcome Back</h2>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center">
                 <i className="fa-solid fa-circle-exclamation mr-2"></i>
                 {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="name@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-md"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Don't have an account? <Link to="/register" className="text-brand-600 font-medium hover:underline">Register</Link>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
            <p className="mb-2 font-medium">Demo Quick Fill:</p>
            <div className="space-x-4">
                <button onClick={() => setEmail('admin@agency.com')} className="underline hover:text-brand-600">Admin</button>
                <button onClick={() => setEmail('client@brand.com')} className="underline hover:text-brand-600">Client</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
