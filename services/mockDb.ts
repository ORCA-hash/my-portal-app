import { supabase } from '../lib/supabase';
import { User, UserRole, Task, TaskStatus, Message, Invoice, OnboardingSubmission, Attachment } from '../types';

// --- KEEPS TASKS/INVOICES LOCAL (For now) ---
const TASKS_KEY = 'nexus_tasks_v2';
const INVOICES_KEY = 'nexus_invoices_v2';
const ONBOARDING_KEY = 'nexus_onboarding_v2';
const CONFIG_KEY = 'nexus_config_v2';
const ONBOARDING_CONTENT_KEY = 'nexus_onboarding_content_v2';

const DEFAULT_ONBOARDING_CONFIG = {
  step1Video: '', step2Video: '', step3Video: '', step4Video: '', step5Video: '', step6Video: '', bookingLink: ''
};

// Helper for local storage
const getList = <T>(key: string): T[] => {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.filter((i: any) => i !== null && i !== undefined) : [];
    } catch (e) { return []; }
};

const saveList = <T>(key: string, list: T[]) => {
    localStorage.setItem(key, JSON.stringify(list));
};

// --- REAL SUPABASE AUTH ---
export const mockAuth = {
  signIn: async (email: string): Promise<{ user: User | null, error: string | null }> => {
    // 1. Login with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123', // hardcoded for demo simplicity, or you can add password field to UI
    });

    // Note: Since your UI might not have a password field yet, 
    // for this specific app template, we often use a Magic Link or just simluated login.
    // BUT, to make Chat work, we need real Auth. 
    // PRO TIP: If your login screen doesn't have a password box, use Magic Link:
    // const { error } = await supabase.auth.signInWithOtp({ email });
    
    // FOR NOW: We will try to fetch the profile matching the email to return the User object
    if (authError) return { user: null, error: authError.message };
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    return { user: profile as User, error: null };
  },

  // This is the critical function for your "Create Account" button
  signUp: async (email: string, name: string, role: UserRole): Promise<{ user: User | null, error: string | null }> => {
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: 'password123', // Default password for all users for simplicity
    });

    if (authError) return { user: null, error: authError.message };
    if (!authData.user) return { user: null, error: 'Signup failed' };

    // 2. Create Profile Entry
    const newUser: User = {
        id: authData.user.id,
        email,
        name,
        role,
        notificationsEnabled: true
    };

    const { error: profileError } = await supabase
        .from('profiles')
        .insert([newUser]);

    if (profileError) return { user: null, error: profileError.message };

    return { user: newUser, error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  getSession: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
    return data as User;
  }
};

export const mockDb = {
  // --- REAL SUPABASE USERS ---
  getClients: async (): Promise<User[]> => {
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'CLIENT');
    return data as User[] || [];
  },

  getAdmins: async (): Promise<User[]> => {
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'ADMIN');
    return data as User[] || [];
  },

  // --- REAL SUPABASE CHAT ---
  getMessages: async (userId: string, partnerId: string): Promise<Message[]> => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      // Convert DB format to App format
      return (data || []).map(m => ({
          id: m.id,
          senderId: m.sender_id,
          receiverId: m.receiver_id,
          content: m.content,
          attachments: m.attachments,
          timestamp: m.created_at
      }));
  },

  sendMessage: async (msg: { senderId: string, receiverId: string, content: string, attachments?: Attachment[] }) => {
      await supabase.from('messages').insert({
          sender_id: msg.senderId,
          receiver_id: msg.receiverId,
          content: msg.content,
          attachments: msg.attachments
      });
  },

  getDashboardChats: async (): Promise<{name: string, message: string, time: string}[]> => {
    // Simplified for now: fetch last 3 messages globally (requires adjustment for real privacy later)
    const { data } = await supabase
        .from('messages')
        .select('*, profiles:sender_id(name, role)')
        .order('created_at', { ascending: false })
        .limit(10);

    const chats: any[] = [];
    const seen = new Set();

    if (data) {
        for (const m of data) {
            if (chats.length >= 3) break;
            // @ts-ignore
            const senderName = m.profiles?.name;
            // @ts-ignore
            const senderRole = m.profiles?.role;
            
            if (senderRole === 'CLIENT' && !seen.has(m.sender_id)) {
                seen.add(m.sender_id);
                chats.push({
                    name: senderName,
                    message: m.content || 'Attachment',
                    time: new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
                });
            }
        }
    }
    return chats;
  },

  // --- KEEPING TASKS & INVOICES LOCAL FOR NOW ---
  getTasks: async (userId: string, role: string): Promise<Task[]> => {
      const tasks = getList<Task>(TASKS_KEY);
      if (role === UserRole.ADMIN) return tasks;
      return tasks.filter(t => t.assignedToId === userId);
  },
  createTask: async (task: Partial<Task>) => {
      const tasks = getList<Task>(TASKS_KEY);
      const newTask: Task = {
          id: Math.random().toString(36).substr(2, 9),
          title: task.title || 'New Task',
          description: task.description || '',
          status: task.status || TaskStatus.TODO,
          assignedToId: task.assignedToId!,
          dueDate: task.dueDate!,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
      };
      tasks.push(newTask);
      saveList(TASKS_KEY, tasks);
      return newTask;
  },
  updateTaskStatus: async (taskId: string, status: TaskStatus) => {
      const tasks = getList<Task>(TASKS_KEY);
      const idx = tasks.findIndex(t => t.id === taskId);
      if (idx !== -1) { tasks[idx].status = status; saveList(TASKS_KEY, tasks); }
  },
  deleteTask: async (taskId: string) => {
      const tasks = getList<Task>(TASKS_KEY).filter(t => t.id !== taskId);
      saveList(TASKS_KEY, tasks);
  },
  getInvoices: async (userId: string, role: string): Promise<Invoice[]> => {
      const invoices = getList<Invoice>(INVOICES_KEY);
      if (role === UserRole.ADMIN) return invoices;
      return invoices.filter(i => i.clientId === userId);
  },
  createInvoice: async (invoice: Partial<Invoice>) => {
      const invoices = getList<Invoice>(INVOICES_KEY);
      const newInvoice: Invoice = {
          id: Math.random().toString(36).substr(2, 9),
          title: invoice.title || 'Invoice',
          amount: invoice.amount || 0,
          date: invoice.date || new Date().toISOString(),
          status: invoice.status || 'PENDING',
          clientId: invoice.clientId!,
          pdfUrl: '#',
          receiptUrl: invoice.receiptUrl
      };
      invoices.push(newInvoice);
      saveList(INVOICES_KEY, invoices);
      return newInvoice;
  },
  updateInvoiceStatus: async (id: string, status: 'PAID' | 'PENDING') => {
      const invoices = getList<Invoice>(INVOICES_KEY);
      const idx = invoices.findIndex(i => i.id === id);
      if (idx !== -1) { invoices[idx].status = status; saveList(INVOICES_KEY, invoices); }
  },
  // --- CONFIG & ONBOARDING ---
  saveOnboarding: async (submission: OnboardingSubmission) => {
      const all = getList<OnboardingSubmission>(ONBOARDING_KEY);
      const idx = all.findIndex(s => s.userId === submission.userId);
      if (idx !== -1) all[idx] = submission; else all.push(submission);
      saveList(ONBOARDING_KEY, all);
      return submission;
  },
  getOnboarding: async (userId: string): Promise<OnboardingSubmission | null> => {
      return getList<OnboardingSubmission>(ONBOARDING_KEY).find(s => s.userId === userId) || null;
  },
  getAllOnboardingSubmissions: async () => getList(ONBOARDING_KEY),
  getGeneralConfig: async () => JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'),
  saveGeneralConfig: async (u: any) => { 
      const n = { ...JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'), ...u }; 
      localStorage.setItem(CONFIG_KEY, JSON.stringify(n)); 
      return n; 
  },
  getOnboardingConfig: async () => {
      const s = localStorage.getItem(ONBOARDING_CONTENT_KEY);
      return s ? { ...DEFAULT_ONBOARDING_CONFIG, ...JSON.parse(s) } : DEFAULT_ONBOARDING_CONFIG;
  },
  saveOnboardingConfig: async (c: any) => {
     const cur = await mockDb.getOnboardingConfig();
     localStorage.setItem(ONBOARDING_CONTENT_KEY, JSON.stringify({ ...cur, ...c }));
     return true; 
  },
  // Stub for compatibility
  deleteUser: async (id: string) => true,
  updateUser: async (id: string, data: any) => data,
};
