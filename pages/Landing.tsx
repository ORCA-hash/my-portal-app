import React from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-600 text-white shadow-xl shadow-brand-500/20">
          <i className="fa-solid fa-bolt text-4xl"></i>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
          Nexus Agency Portal
        </h1>
        <p className="text-xl text-slate-600 mb-10">
          Streamline your agency-client workflow. Manage tasks, track reports, and communicate in real-time.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/login"
            className="px-8 py-3 bg-white text-slate-700 border border-slate-200 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            Log In
          </Link>
          <Link 
            to="/register"
            className="px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/30"
          >
            Create Account
          </Link>
        </div>
      </div>
      
      <div className="mt-16 text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} Nexus Agency. All rights reserved.
      </div>
    </div>
  );
};

export default Landing;
