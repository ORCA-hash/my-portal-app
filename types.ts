export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
}

export interface User {
  id: string;
  email: string;
  name: string; // Maps to user_metadata.full_name in Supabase
  role: UserRole; // Maps to user_metadata.role in Supabase
  avatarUrl?: string;
  notificationsEnabled?: boolean;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignedToId?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Attachment {
  id: string;
  type: 'image' | 'video';
  url: string; // Base64 string for mock mode
  name: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  attachments?: Attachment[];
}

export interface ReportMetric {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface Invoice {
  id: string;
  title: string;
  amount: number;
  date: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  clientId: string;
  pdfUrl: string;
  receiptUrl?: string;
}

export interface OnboardingSubmission {
  userId: string;
  clientName: string;
  currentStep: number;
  isComplete: boolean;
  lastUpdated: string;
  // Step 3 Data
  bmCredentials?: string;
  // Step 4 Data (The 12 Questions)
  companyName?: string;
  systemPasswords?: string;
  emailSystem?: string;
  facebookBmLink?: string;
  assetsFolder?: string;
  brandingInfo?: string;
  socialLinks?: string;
  contentLink?: string;
  idealCustomerProfile?: string;
  idealCustomerNegative?: string;
  existingCustomerPatterns?: string;
  homeAddress?: string;
}