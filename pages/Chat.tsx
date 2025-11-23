import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockDb } from '../services/mockDb';
import { Message, User, UserRole, Attachment } from '../types';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Attachment State
  const [isUploading, setIsUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  
  // Lightbox State
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin State: List of clients and the currently selected one
  const [clients, setClients] = useState<User[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<User | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initialization: Load Users & Select Partner Smartly
  useEffect(() => {
    const initChat = async () => {
      if (!user) return;

      if (user.role === UserRole.ADMIN) {
        // Admin: Load all clients
        const allClients = await mockDb.getClients();
        setClients(allClients);
        
        // Only select default if we don't have one selected yet and clients exist
        if (allClients.length > 0 && !selectedPartner) {
            setSelectedPartner(allClients[0]);
        }
      } else {
        // Client: Find the Best Admin to chat with
        const admins = await mockDb.getAdmins();
        if (admins.length > 0) {
            // Strategy:
            // 1. Default to the first Admin found (usually the main mock admin)
            let bestAdmin = admins[0];

            // 2. Optional: If we already have history with a specific admin, switch to them.
            // This loop checks if we chatted with any specific admin before
            for (const admin of admins) {
                const history = await mockDb.getMessages(user.id, admin.id);
                if (history.length > 0) {
                    bestAdmin = admin;
                    break; // Found an active conversation, lock to this admin
                }
            }
            
            setSelectedPartner(bestAdmin);
        }
      }
    };
    initChat();
  }, [user]);

  // 2. Message Polling Loop (Simulate Real-time)
  useEffect(() => {
    if (!user || !selectedPartner) return;

    const fetchMessages = async () => {
      const msgs = await mockDb.getMessages(user.id, selectedPartner.id);
      setMessages(msgs);
    };

    // Fetch immediately then poll
    fetchMessages();
    const interval = setInterval(fetchMessages, 1000); // Poll every 1s for real-time feel
    return () => clearInterval(interval);
  }, [user, selectedPartner]);

  // 3. Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingAttachments]);

  // 4. Helpers for File Handling
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;

    if (!fileType) {
        alert("Only images and videos are supported.");
        return;
    }

    // Limit file size for local storage (Mock Mode limitation) - 3MB to be safe
    if (file.size > 3 * 1024 * 1024) {
        alert("File is too large for browser storage. Please upload files under 3MB.");
        return;
    }

    setIsUploading(true);
    try {
        const base64 = await convertFileToBase64(file);
        const newAttachment: Attachment = {
            id: Math.random().toString(36).substr(2, 9),
            type: fileType,
            url: base64,
            name: file.name
        };
        setPendingAttachments([...pendingAttachments, newAttachment]);
    } catch (err) {
        console.error("File conversion failed", err);
        alert("Failed to attach file.");
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
      setPendingAttachments(prev => prev.filter(a => a.id !== id));
  };

  const downloadAttachment = (att: Attachment) => {
      const link = document.createElement('a');
      link.href = att.url;
      link.download = att.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // 5. Handlers
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !user || !selectedPartner) return;

    // Send
    await mockDb.sendMessage({
      senderId: user.id,
      receiverId: selectedPartner.id,
      content: newMessage,
      attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined
    });
    
    // Reset local input state
    setNewMessage('');
    setPendingAttachments([]);

    // Force immediate refresh to show the new message
    const msgs = await mockDb.getMessages(user.id, selectedPartner.id);
    setMessages(msgs);
  };

  // 6. UI Components
  if (!selectedPartner && user?.role === UserRole.CLIENT) {
      return (
        <div className="h-[calc(100vh-7rem)] flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
             <div className="text-center">
                 <i className="fa-solid fa-circle-notch fa-spin text-3xl text-brand-500 mb-3"></i>
                 <p className="text-slate-500">Connecting to your dedicated account manager...</p>
             </div>
        </div>
      );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative animate-fade-in">
      
      {/* Lightbox Modal */}
      {viewingAttachment && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in">
              {/* Controls */}
              <div className="absolute top-4 right-4 flex space-x-4">
                   <button 
                      onClick={() => downloadAttachment(viewingAttachment)}
                      className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors backdrop-blur-sm"
                      title="Download"
                   >
                      <i className="fa-solid fa-download"></i>
                   </button>
                   <button 
                      onClick={() => setViewingAttachment(null)}
                      className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors backdrop-blur-sm"
                      title="Close"
                   >
                      <i className="fa-solid fa-times"></i>
                   </button>
              </div>
              
              {/* Content */}
              <div className="max-w-full max-h-full flex items-center justify-center overflow-hidden">
                  {viewingAttachment.type === 'image' ? (
                      <img src={viewingAttachment.url} alt="full-size" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
                  ) : (
                      <video src={viewingAttachment.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
                  )}
              </div>
              
              <div className="absolute bottom-8 text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                  {viewingAttachment.name}
              </div>
          </div>
      )}

      {/* Sidebar: Only for Admin */}
      {user?.role === UserRole.ADMIN && (
        <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
          <div className="p-4 border-b border-slate-200 font-bold text-slate-700 bg-white">
            Active Clients
          </div>
          <div className="flex-1 overflow-y-auto">
            {clients.map(client => (
              <button
                key={client.id}
                onClick={() => setSelectedPartner(client)}
                className={`w-full text-left p-4 border-b border-slate-100 hover:bg-white transition-colors flex items-center space-x-3
                  ${selectedPartner?.id === client.id ? 'bg-white border-l-4 border-l-brand-600 shadow-sm' : 'border-l-4 border-l-transparent'}
                `}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                  {client.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium text-slate-800 truncate">{client.name}</p>
                  <p className="text-xs text-slate-500 truncate">{client.email}</p>
                </div>
              </button>
            ))}
            {clients.length === 0 && (
                 <div className="p-8 text-sm text-slate-400 text-center">
                    No clients found. 
                    <br/>
                    <span className="text-xs">Add clients in Dashboard to start chatting.</span>
                 </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className={`flex flex-col ${user?.role === UserRole.ADMIN ? 'w-2/3' : 'w-full'}`}>
        
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                    {selectedPartner?.name.charAt(0) || '?'}
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">{selectedPartner?.name || 'Select a Chat'}</h3>
                    <div className="flex items-center text-xs text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Online
                    </div>
                </div>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
             {messages.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                     <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <i className="fa-regular fa-comments text-2xl"></i>
                     </div>
                     <p className="text-sm">No messages yet.</p>
                     <p className="text-xs mt-1">Send a message to start the conversation.</p>
                 </div>
             )}
             {messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            
                            {/* Render Attachments if any */}
                            {msg.attachments && msg.attachments.map(att => (
                                <div 
                                    key={att.id} 
                                    onClick={() => setViewingAttachment(att)}
                                    className={`mb-2 overflow-hidden rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity relative group ${isMe ? 'rounded-br-none' : 'rounded-bl-none'}`}
                                >
                                    {att.type === 'image' ? (
                                        <img src={att.url} alt="attachment" className="max-w-full max-h-64 object-cover" />
                                    ) : (
                                        <div className="relative">
                                             <video src={att.url} className="max-w-full max-h-64 bg-black" />
                                             <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <i className="fa-solid fa-play text-white text-3xl opacity-80 drop-shadow-lg"></i>
                                             </div>
                                        </div>
                                    )}
                                    {/* Hover Overlay Hint */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <i className="fa-solid fa-expand text-white opacity-0 group-hover:opacity-100 drop-shadow-md text-2xl"></i>
                                    </div>
                                </div>
                            ))}

                            {/* Message Text Bubble (Only if text exists) */}
                            {msg.content && (
                                <div className={`px-5 py-3 rounded-2xl shadow-sm text-sm whitespace-pre-wrap
                                    ${isMe 
                                        ? 'bg-brand-600 text-white rounded-br-none' 
                                        : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            )}
                            
                            <span className="text-[10px] text-slate-400 mt-1 px-1 select-none">
                                {time}
                            </span>
                        </div>
                    </div>
                );
             })}
             <div ref={messagesEndRef} />
        </div>

        {/* Attachment Preview Area */}
        {pendingAttachments.length > 0 && (
            <div className="px-4 py-3 flex gap-3 overflow-x-auto bg-white border-t border-slate-100">
                {pendingAttachments.map(att => (
                    <div key={att.id} className="relative w-20 h-20 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 group">
                        {att.type === 'image' ? (
                            <img src={att.url} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                <i className="fa-solid fa-video text-white"></i>
                            </div>
                        )}
                        <button 
                            onClick={() => removeAttachment(att.id)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-colors"
                        >
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
             <form onSubmit={handleSend} className="flex gap-3 items-end">
                 {/* File Upload Button */}
                 <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
                    title="Attach Photo or Video"
                 >
                    <i className="fa-solid fa-paperclip text-lg"></i>
                 </button>
                 <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/*"
                    className="hidden"
                 />

                 <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={pendingAttachments.length > 0 ? "Add a caption..." : "Type a message..."}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                 />
                 
                 <button 
                    type="submit"
                    disabled={(!newMessage.trim() && pendingAttachments.length === 0) || !selectedPartner || isUploading}
                    className="bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-brand-500/20"
                 >
                    {isUploading ? (
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                    ) : (
                        <i className="fa-solid fa-paper-plane"></i>
                    )}
                 </button>
             </form>
        </div>

      </div>
    </div>
  );
};

export default Chat;