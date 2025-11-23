import { User, UserRole, Task, TaskStatus, Message, Invoice, OnboardingSubmission, Attachment } from '../types';

const USERS_KEY = 'nexus_users_v2';
const SESSION_KEY = 'nexus_session_v2';
const TASKS_KEY = 'nexus_tasks_v2';
const MESSAGES_KEY = 'nexus_messages_v2';
const INVOICES_KEY = 'nexus_invoices_v2';
const ONBOARDING_KEY = 'nexus_onboarding_v2';
const CONFIG_KEY = 'nexus_config_v2'; // General config
const ONBOARDING_CONTENT_KEY = 'nexus_onboarding_content_v2'; // Video embeds & links

// Default Config Structure - Ensures keys always exist
const DEFAULT_ONBOARDING_CONFIG = {
  step1Video: '',
  step2Video: '',
  step3Video: '',
  step4Video: '',
  step5Video: '',
  step6Video: '',
  bookingLink: ''
};

// Seed initial users if empty
const INITIAL_USERS: User[] = [
  {
    id: 'admin-1',
    email: 'admin@agency.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
    notificationsEnabled: true,
  },
  {
    id: 'client-1',
    email: 'client@brand.com',
    name: 'Acme Client',
    role: UserRole.CLIENT,
    notificationsEnabled: true,
  },
];

const getUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  try {
    const parsed = JSON.parse(stored);
    // Critical fix: Filter out nulls or items without IDs to prevent crashes
    return Array.isArray(parsed) ? parsed.filter((u: any) => u && u.id) : [];
  } catch (e) {
    // If JSON is corrupt, reset to initial
    return INITIAL_USERS;
  }
};

const saveUser = (user: User) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Generic helper for local storage array management
const getList = <T>(key: string): T[] => {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        // Filter nulls/undefined to avoid "cannot read prop of undefined" errors
        return Array.isArray(parsed) ? parsed.filter((i: any) => i !== null && i !== undefined) : [];
    } catch (e) {
        return [];
    }
};

const saveList = <T>(key: string, list: T[]) => {
    localStorage.setItem(key, JSON.stringify(list));
};

export const mockAuth = {
  signIn: async (email: string): Promise<{ user: User | null, error: string | null }> => {
    await new Promise(r => setTimeout(r, 500)); // Simulate network delay
    const users = getUsers();
    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return { user, error: null };
    }
    return { user: null, error: 'Invalid credentials' };
  },

  signUp: async (email: string, name: string, role: UserRole): Promise<{ user: User | null, error: string | null }> => {
    await new Promise(r => setTimeout(r, 500));
    const users = getUsers();
    if (users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase())) {
      return { user: null, error: 'User already exists' };
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role,
      notificationsEnabled: true
    };
    
    saveUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return { user: newUser, error: null };
  },

  signOut: async () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession: async (): Promise<User | null> => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  }
};

export const mockDb = {
  getClients: async (): Promise<User[]> => {
    await new Promise(r => setTimeout(r, 300));
    const users = getUsers();
    return users.filter(u => u.role === UserRole.CLIENT);
  },

  getAdmins: async (): Promise<User[]> => {
    await new Promise(r => setTimeout(r, 300));
    const users = getUsers();
    return users.filter(u => u.role === UserRole.ADMIN);
  },

  deleteUser: async (userId: string) => {
      await new Promise(r => setTimeout(r, 300));
      let users = getUsers();
      users = users.filter(u => u.id !== userId);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
  },

  // --- User Updates ---
  updateUser: async (id: string, data: Partial<User>) => {
      await new Promise(r => setTimeout(r, 500));
      const users = getUsers();
      const idx = users.findIndex(u => u.id === id);
      
      if (idx !== -1) {
          // PATCH / Merge logic
          const updatedUser = { ...users[idx], ...data };
          users[idx] = updatedUser;
          localStorage.setItem(USERS_KEY, JSON.stringify(users));
          
          // If updating self, update session
          const session = await mockAuth.getSession();
          if (session && session.id === id) {
              localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
          }
          return updatedUser;
      }
      return null;
  },

  // --- Tasks ---
  getTasks: async (userId: string, role: string): Promise<Task[]> => {
      await new Promise(r => setTimeout(r, 300));
      const tasks = getList<Task>(TASKS_KEY);
      
      // Seed some tasks if empty for demo
      if (tasks.length === 0) {
           const initialTasks: Task[] = [
               { 
                 id: '1', 
                 title: 'Onboard Client', 
                 description: 'Setup accounts', 
                 status: TaskStatus.DONE, 
                 assignedToId: 'client-1', 
                 dueDate: '2023-10-20',
                 createdAt: new Date().toISOString(),
                 updatedAt: new Date().toISOString()
               },
               { 
                 id: '2', 
                 title: 'Approve Creative Assets', 
                 description: 'Review the new banner ads', 
                 status: TaskStatus.TODO, 
                 assignedToId: 'client-1', 
                 dueDate: '2023-10-25',
                 createdAt: new Date().toISOString(),
                 updatedAt: new Date().toISOString()
               },
           ];
           saveList(TASKS_KEY, initialTasks);
           if (role === UserRole.ADMIN) return initialTasks;
           return initialTasks.filter(t => t.assignedToId === userId);
      }

      if (role === UserRole.ADMIN) return tasks;
      return tasks.filter(t => t.assignedToId === userId);
  },
  
  createTask: async (task: Partial<Task>) => {
      await new Promise(r => setTimeout(r, 300));
      const tasks = getList<Task>(TASKS_KEY);
      const now = new Date().toISOString();
      
      const newTask: Task = {
          id: Math.random().toString(36).substr(2, 9),
          title: task.title || 'New Task',
          description: task.description || '',
          status: task.status || TaskStatus.TODO,
          assignedToId: task.assignedToId,
          dueDate: task.dueDate,
          createdAt: now,
          updatedAt: now
      };
      tasks.push(newTask);
      saveList(TASKS_KEY, tasks);
      return newTask;
  },

  updateTaskStatus: async (taskId: string, status: TaskStatus) => {
      const tasks = getList<Task>(TASKS_KEY);
      const idx = tasks.findIndex(t => t.id === taskId);
      if (idx !== -1) {
          tasks[idx].status = status;
          tasks[idx].updatedAt = new Date().toISOString();
          saveList(TASKS_KEY, tasks);
      }
  },

  deleteTask: async (taskId: string) => {
      let tasks = getList<Task>(TASKS_KEY);
      tasks = tasks.filter(t => t.id !== taskId);
      saveList(TASKS_KEY, tasks);
  },

  // --- Messages ---
  getMessages: async (userId: string, partnerId: string): Promise<Message[]> => {
      const msgs = getList<Message>(MESSAGES_KEY);
      return msgs.filter(m => 
          (m.senderId === userId && m.receiverId === partnerId) ||
          (m.senderId === partnerId && m.receiverId === userId)
      ).sort((a, b) => {
          // Robust sort handling missing timestamps
          const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return tA - tB; // Oldest to newest
      });
  },

  // Get top 3 recent unique conversations for Admin Dashboard
  getDashboardChats: async (): Promise<{name: string, message: string, time: string}[]> => {
    const msgs = getList<Message>(MESSAGES_KEY);
    const users = getUsers();
    
    // Sort by newest
    msgs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const chats: {name: string, message: string, time: string}[] = [];
    const seenUsers = new Set();

    for (const m of msgs) {
        if (chats.length >= 3) break;
        
        // We only care about messages FROM clients to ADMIN for the dashboard
        const sender = users.find(u => u.id === m.senderId);
        if (sender && sender.role === UserRole.CLIENT && !seenUsers.has(m.senderId)) {
            seenUsers.add(m.senderId);
            chats.push({
                name: sender.name,
                message: m.content || (m.attachments?.length ? 'Sent an attachment' : 'Message'),
                time: new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
            });
        }
    }
    return chats;
  },

  sendMessage: async (msg: { senderId: string, receiverId: string, content: string, attachments?: Attachment[] }) => {
      const msgs = getList<Message>(MESSAGES_KEY);
      const newMsg: Message = {
          id: Math.random().toString(36).substr(2, 9),
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          content: msg.content,
          attachments: msg.attachments,
          timestamp: new Date().toISOString()
      };
      msgs.push(newMsg);
      saveList(MESSAGES_KEY, msgs);
  },

  // --- Invoices ---
  getInvoices: async (userId: string, role: string): Promise<Invoice[]> => {
      await new Promise(r => setTimeout(r, 300));
      const invoices = getList<Invoice>(INVOICES_KEY);
      if (role === UserRole.ADMIN) return invoices;
      return invoices.filter(i => i.clientId === userId);
  },

  createInvoice: async (invoice: Partial<Invoice>) => {
      await new Promise(r => setTimeout(r, 300));
      const invoices = getList<Invoice>(INVOICES_KEY);
      const newInvoice: Invoice = {
          id: Math.random().toString(36).substr(2, 9),
          title: invoice.title || 'Service Invoice',
          amount: invoice.amount || 0,
          date: invoice.date || new Date().toISOString().split('T')[0],
          status: invoice.status || 'PENDING',
          clientId: invoice.clientId || '',
          pdfUrl: '#',
          receiptUrl: invoice.receiptUrl
      };
      invoices.push(newInvoice);
      saveList(INVOICES_KEY, invoices);
      return newInvoice;
  },

  updateInvoiceStatus: async (id: string, status: 'PAID' | 'PENDING') => {
      await new Promise(r => setTimeout(r, 300));
      const invoices = getList<Invoice>(INVOICES_KEY);
      const idx = invoices.findIndex(i => i.id === id);
      if (idx !== -1) {
          invoices[idx].status = status;
          saveList(INVOICES_KEY, invoices);
      }
  },

  // --- Onboarding Submissions ---
  saveOnboarding: async (submission: OnboardingSubmission) => {
      await new Promise(r => setTimeout(r, 200));
      const allSubmissions = getList<OnboardingSubmission>(ONBOARDING_KEY);
      const idx = allSubmissions.findIndex(s => s.userId === submission.userId);
      
      if (idx !== -1) {
          allSubmissions[idx] = submission;
      } else {
          allSubmissions.push(submission);
      }
      saveList(ONBOARDING_KEY, allSubmissions);
      return submission;
  },

  getOnboarding: async (userId: string): Promise<OnboardingSubmission | null> => {
      const allSubmissions = getList<OnboardingSubmission>(ONBOARDING_KEY);
      return allSubmissions.find(s => s.userId === userId) || null;
  },

  getAllOnboardingSubmissions: async (): Promise<OnboardingSubmission[]> => {
      await new Promise(r => setTimeout(r, 300));
      return getList<OnboardingSubmission>(ONBOARDING_KEY);
  },

  // --- General Config (Settings) ---
  getGeneralConfig: async () => {
      const stored = localStorage.getItem(CONFIG_KEY);
      return stored ? JSON.parse(stored) : {};
  },

  saveGeneralConfig: async (updates: any) => {
      await new Promise(r => setTimeout(r, 300));
      const current = await mockDb.getGeneralConfig();
      // PATCH / Merge Logic: Only overwrite keys provided in updates
      const merged = { ...current, ...updates };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
      return merged;
  },

  // --- Onboarding Content Configuration (Videos & Links) ---
  getOnboardingConfig: async () => {
      const stored = localStorage.getItem(ONBOARDING_CONTENT_KEY);
      
      // If nothing stored, initialize with defaults
      if (!stored) {
          localStorage.setItem(ONBOARDING_CONTENT_KEY, JSON.stringify(DEFAULT_ONBOARDING_CONFIG));
          return DEFAULT_ONBOARDING_CONFIG;
      }

      // If stored, parse and merge with defaults to ensure no missing keys
      try {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_ONBOARDING_CONFIG, ...parsed };
      } catch (e) {
          return DEFAULT_ONBOARDING_CONFIG;
      }
  },

  saveOnboardingConfig: async (configUpdates: any) => {
      await new Promise(r => setTimeout(r, 300));
      
      // Get current to ensure we don't overwrite keys not in the update payload
      const current = await mockDb.getOnboardingConfig();
      
      // PATCH / Merge Logic
      const updated = { ...current, ...configUpdates };
      
      localStorage.setItem(ONBOARDING_CONTENT_KEY, JSON.stringify(updated));
      return true;
  }
};