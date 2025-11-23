import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockDb, mockAuth } from '../services/mockDb';
import { UserRole, User, OnboardingSubmission } from '../types';

const Settings: React.FC = () => {
  const { user, refreshSession } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Admin Management State
  const [clients, setClients] = useState<User[]>([]);
  const [clientProgress, setClientProgress] = useState<Record<string, OnboardingSubmission>>({});
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [brandingConfig, setBrandingConfig] = useState({ logoUrl: '', primaryColor: '' });

  // Client Settings State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Common Password State
  const [password, setPassword] = useState('');

  // Onboarding Config State (Admin Only)
  const [onboardingConfig, setOnboardingConfig] = useState({
    step1Video: '',
    step2Video: '',
    step3Video: '',
    step4Video: '',
    step5Video: '',
    step6Video: '',
    bookingLink: ''
  });

  useEffect(() => {
    if (user) {
      if (user.role === UserRole.ADMIN) {
        const loadAdminData = async () => {
            setIsLoadingConfig(true);
            try {
                // Load General Config
                const generalConfig = await mockDb.getGeneralConfig();
                setMaintenanceMode(generalConfig.maintenanceMode || false);
                setBrandingConfig({ logoUrl: generalConfig.logoUrl || '', primaryColor: generalConfig.primaryColor || '' });

                // Load Onboarding Config
                const contentConfig = await mockDb.getOnboardingConfig();
                if (contentConfig) {
                    setOnboardingConfig(prev => ({...prev, ...contentConfig}));
                }

                // Load Clients & Their Progress
                const [clientList, submissions] = await Promise.all([
                    mockDb.getClients(),
                    mockDb.getAllOnboardingSubmissions()
                ]);
                setClients(clientList);
                
                // Map progress by userId for easy lookup
                const progressMap: Record<string, OnboardingSubmission> = {};
                submissions.forEach(s => {
                    progressMap[s.userId] = s;
                });
                setClientProgress(progressMap);

            } catch (error) {
                console.error("Failed to load config", error);
                setMessage({ type: 'error', text: 'Failed to load settings.' });
            } finally {
                setIsLoadingConfig(false);
            }
        };
        loadAdminData();
      } else {
          // Client Init
          setNotificationsEnabled(user.notificationsEnabled !== false);
          setIsLoadingConfig(false);
      }
    }
  }, [user]);

  const handleAdminSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== UserRole.ADMIN) return;
    
    setIsSaving(true);
    try {
        // 1. Save Onboarding
        await mockDb.saveOnboardingConfig(onboardingConfig);
        
        // 2. Save General (Branding, Maint Mode)
        await mockDb.saveGeneralConfig({
            maintenanceMode,
            logoUrl: brandingConfig.logoUrl,
            primaryColor: brandingConfig.primaryColor
        });

        // 3. Update Password if set
        if (password) {
             // Mock password update
             await mockDb.updateUser(user.id, {}); 
        }

        setMessage({ type: 'success', text: 'Admin settings saved successfully!' });
    } catch (err) {
        setMessage({ type: 'error', text: 'Error saving settings.' });
    }
    setIsSaving(false);
  };

  const handleClientSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || user.role !== UserRole.CLIENT) return;
      
      setIsSaving(true);
      try {
          await mockDb.updateUser(user.id, {
              notificationsEnabled: notificationsEnabled
          });
          await refreshSession();
          setMessage({ type: 'success', text: 'Preferences updated!' });
      } catch (err) {
          setMessage({ type: 'error', text: 'Error saving settings.' });
      }
      setIsSaving(false);
  };

  const handleAddClient = async () => {
      if(!newClientEmail || !newClientName) return;
      await mockAuth.signUp(newClientEmail, newClientName, UserRole.CLIENT);
      const updatedClients = await mockDb.getClients();
      setClients(updatedClients);
      setNewClientName('');
      setNewClientEmail('');
  };

  const handleDeleteClient = async (id: string) => {
      if(window.confirm("Are you sure? This deletes the user.")) {
          await mockDb.deleteUser(id);
          const updatedClients = await mockDb.getClients();
          setClients(updatedClients);
      }
  };

  if (isLoadingConfig && user?.role === UserRole.ADMIN) {
      return <div className="p-10 text-center text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">
      <div className="flex justify-between items-end border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your account and preferences.</p>
        </div>
      </div>

      {/* ADMIN SETTINGS VIEW */}
      {user?.role === UserRole.ADMIN && (
          <form onSubmit={handleAdminSave} className="space-y-8">
               {message && <div className={`p-4 rounded-lg text-sm font-bold ${message.type==='success'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{message.text}</div>}

               {/* 1. Manage Clients */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="p-5 bg-slate-50 border-b border-slate-200">
                       <h3 className="font-bold text-slate-800">Manage Clients</h3>
                   </div>
                   <div className="p-6">
                       <div className="flex gap-4 mb-6 items-end">
                           <div className="flex-1">
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Name</label>
                               <input type="text" value={newClientName} onChange={e => setNewClientName(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Client Name" />
                           </div>
                           <div className="flex-1">
                               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Email</label>
                               <input type="text" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="client@email.com" />
                           </div>
                           <button type="button" onClick={handleAddClient} className="bg-slate-900 text-white px-4 py-2 rounded font-bold hover:bg-slate-800">Add</button>
                       </div>
                       
                       <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                           {clients.map(c => {
                               const progress = clientProgress[c.id];
                               return (
                                   <div key={c.id} className="py-3 flex justify-between items-center">
                                       <div className="flex items-center gap-3">
                                           <div>
                                               <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                                               <p className="text-xs text-slate-500">{c.email}</p>
                                           </div>
                                            {/* Onboarding Status Badge */}
                                            {progress ? (
                                                <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${progress.isComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {progress.isComplete ? 'Completed' : `Step ${progress.currentStep}/6`}
                                                </span>
                                            ) : (
                                                <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500">
                                                    Not Started
                                                </span>
                                            )}
                                       </div>
                                       <button type="button" onClick={() => handleDeleteClient(c.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase">Remove</button>
                                   </div>
                               );
                           })}
                       </div>
                   </div>
               </div>

               {/* 2. Branding */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="p-5 bg-slate-50 border-b border-slate-200">
                       <h3 className="font-bold text-slate-800">Branding</h3>
                   </div>
                   <div className="p-6 space-y-4">
                       <div>
                           <label className="block text-sm font-bold text-slate-700 mb-1">Upload Logo</label>
                           <div className="flex items-center gap-4">
                               <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center border border-slate-200">
                                   <i className="fa-solid fa-image text-slate-300 text-xl"></i>
                               </div>
                               <button type="button" className="text-sm text-brand-600 font-bold hover:underline">Choose File...</button>
                           </div>
                       </div>
                       <div>
                           <label className="block text-sm font-bold text-slate-700 mb-1">Brand Color (Hex)</label>
                           <input type="text" value={brandingConfig.primaryColor} onChange={e => setBrandingConfig({...brandingConfig, primaryColor: e.target.value})} className="w-32 px-3 py-2 border rounded" placeholder="#000000" />
                       </div>
                   </div>
               </div>

                {/* 3. Portal Access & Password */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="p-5 bg-slate-50 border-b border-slate-200">
                       <h3 className="font-bold text-slate-800">Access & Security</h3>
                   </div>
                   <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-800">Maintenance Mode</p>
                                <p className="text-xs text-slate-500">Prevent clients from accessing the dashboard.</p>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setMaintenanceMode(!maintenanceMode)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${maintenanceMode ? 'bg-red-600' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-1">Change Admin Password</label>
                           <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="New Password" />
                        </div>
                   </div>
               </div>

               {/* 4. Onboarding Config */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="p-5 bg-slate-50 border-b border-slate-200">
                       <h3 className="font-bold text-slate-800">Onboarding Configuration</h3>
                   </div>
                   <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['step1Video', 'step2Video', 'step3Video', 'step4Video', 'step5Video', 'step6Video'].map((key, idx) => (
                            <div key={key}>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Step {idx + 1} Video Embed</label>
                                <input 
                                    type="text"
                                    value={(onboardingConfig as any)[key] || ''}
                                    onChange={(e) => setOnboardingConfig(prev => ({...prev, [key]: e.target.value}))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                                    placeholder="<iframe src='...'></iframe>"
                                />
                            </div>
                        ))}
                        <div className="col-span-full mt-2">
                             <label className="block text-xs font-bold text-slate-500 mb-1">Booking Link (Step 5)</label>
                             <input 
                                 type="text"
                                 value={onboardingConfig.bookingLink || ''}
                                 onChange={(e) => setOnboardingConfig(prev => ({...prev, bookingLink: e.target.value}))}
                                 className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                                 placeholder="https://calendly.com/..."
                             />
                        </div>
                   </div>
               </div>

               <div className="flex justify-end">
                   <button type="submit" disabled={isSaving} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 shadow-lg">
                       {isSaving ? 'Saving...' : 'Save All Changes'}
                   </button>
               </div>
          </form>
      )}

      {/* CLIENT SETTINGS VIEW */}
      {user?.role === UserRole.CLIENT && (
          <form onSubmit={handleClientSave} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 bg-slate-50 border-b border-slate-200">
                   <h3 className="font-bold text-slate-800">Client Preferences</h3>
              </div>
              <div className="p-8 space-y-8">
                   {message && <div className={`p-4 rounded-lg text-sm font-bold ${message.type==='success'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{message.text}</div>}
                   
                   <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Change Password</label>
                       <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg" placeholder="Enter new password" />
                       <p className="text-xs text-slate-400 mt-1">Leave blank to keep current password.</p>
                   </div>

                   <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                       <div>
                           <p className="font-bold text-slate-800">Email Notifications</p>
                           <p className="text-xs text-slate-500">Receive updates about tasks and reports.</p>
                       </div>
                       <button 
                            type="button"
                            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationsEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                   </div>

                   <div className="pt-4">
                       <button type="submit" disabled={isSaving} className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 shadow-lg">
                           {isSaving ? 'Updating...' : 'Update Settings'}
                       </button>
                   </div>
              </div>
          </form>
      )}
    </div>
  );
};

export default Settings;