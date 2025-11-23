import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockDb } from '../services/mockDb';
import { Invoice, User, UserRole } from '../types';

const Invoices: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Creation State (Admin Only)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');

  const refreshData = async () => {
    if (!user) return;
    
    // 1. Load Invoices
    const data = await mockDb.getInvoices(user.id, user.role);
    // Sort by date (newest first)
    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setInvoices(data);

    // 2. Load Clients (If Admin) for mapping names
    if (user.role === UserRole.ADMIN) {
      const clientList = await mockDb.getClients();
      setClients(clientList);
      if (clientList.length > 0 && !selectedClientId) {
        setSelectedClientId(clientList[0].id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || !selectedClientId) return;

    await mockDb.createInvoice({
      amount: parseFloat(newAmount),
      date: newDueDate || new Date().toISOString().split('T')[0],
      clientId: selectedClientId,
      status: 'PENDING',
      title: 'Agency Services Retainer' // Default title for simplicity
    });

    setNewAmount('');
    setNewDueDate('');
    setShowCreateModal(false);
    refreshData();
  };

  const togglePaymentStatus = async (inv: Invoice) => {
    if (user?.role !== UserRole.ADMIN) return;
    const newStatus = inv.status === 'PAID' ? 'PENDING' : 'PAID';
    await mockDb.updateInvoiceStatus(inv.id, newStatus);
    refreshData();
  };

  const handleUploadReceipt = (invId: string) => {
      alert("Receipt upload simulation: File attached to Invoice " + invId);
  };

  const getClientEmail = (id: string) => {
    return clients.find(c => c.id === id)?.email || 'Unknown Client';
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading billing data...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-500 mt-1">
            {user?.role === UserRole.ADMIN 
              ? 'Manage client billing and track payments.' 
              : 'View your billing history and payment status.'}
          </p>
        </div>
        {user?.role === UserRole.ADMIN && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-md flex items-center"
          >
            <i className="fa-solid fa-plus mr-2"></i> New Invoice
          </button>
        )}
      </div>

      {/* Create Modal (Admin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Issue New Invoice</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Client</label>
                <select 
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Amount ($)</label>
                <input 
                  type="number" 
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="1500.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Due Date</label>
                <input 
                  type="date" 
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 shadow-lg shadow-brand-500/20"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <i className="fa-solid fa-file-invoice-dollar text-4xl mb-3 block"></i>
            <p>No invoices found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                  <th className="px-6 py-4">ID / Title</th>
                  {user?.role === UserRole.ADMIN && <th className="px-6 py-4">Client</th>}
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{inv.title}</div>
                      <div className="text-xs text-slate-400">#{inv.id.toUpperCase()}</div>
                    </td>
                    
                    {user?.role === UserRole.ADMIN && (
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold mr-2">
                            <i className="fa-solid fa-user"></i>
                          </div>
                          {getClientEmail(inv.clientId)}
                        </div>
                      </td>
                    )}

                    <td className="px-6 py-4 font-bold text-slate-800">
                      ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(inv.date).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                        ${inv.status === 'PAID' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'}
                      `}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${inv.status === 'PAID' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                        {inv.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      {user?.role === UserRole.ADMIN && (
                         <>
                           <button 
                            onClick={() => togglePaymentStatus(inv)}
                            className="text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded font-medium transition-all"
                           >
                             {inv.status === 'PENDING' ? 'Mark Paid' : 'Unpay'}
                           </button>
                           
                           <button 
                             onClick={() => handleUploadReceipt(inv.id)}
                             className="text-xs bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded font-medium transition-all"
                           >
                             <i className="fa-solid fa-upload mr-1"></i> Receipt
                           </button>
                         </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;