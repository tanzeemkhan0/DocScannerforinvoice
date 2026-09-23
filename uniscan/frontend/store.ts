import { create } from 'zustand';
import { InvoiceRecord } from './types';

interface AppState {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  
  invoices: InvoiceRecord[];
  addInvoice: (invoice: InvoiceRecord) => void;
  updateInvoice: (id: string, updates: Partial<InvoiceRecord>) => void;
  deleteInvoice: (id: string) => void;
  
  currentView: 'dashboard' | 'review';
  editingInvoiceId: string | null;
  setReviewMode: (id: string) => void;
  setDashboardMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false, invoices: [], currentView: 'dashboard', editingInvoiceId: null }),
  
  invoices: [],
  addInvoice: (invoice) => set((state) => ({ invoices: [invoice, ...state.invoices] })),
  updateInvoice: (id, updates) => set((state) => ({
    invoices: state.invoices.map(inv => inv.id === id ? { ...inv, ...updates } : inv)
  })),
  deleteInvoice: (id) => set((state) => ({
    invoices: state.invoices.filter(inv => inv.id !== id)
  })),
  
  currentView: 'dashboard',
  editingInvoiceId: null,
  setReviewMode: (id) => set({ currentView: 'review', editingInvoiceId: id }),
  setDashboardMode: () => set({ currentView: 'dashboard', editingInvoiceId: null }),
}));