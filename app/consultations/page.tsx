'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from "../../convex/_generated/api";
import { useRouter } from 'next/navigation';

export default function ConsultationsPage() {
  const { user } = useUser();
  const me = useQuery(api.users.getMe);
  const consultations = useQuery(api.consultations.list);
  const createConsultation = useMutation(api.consultations.create);
  const updateStatus = useMutation(api.consultations.updateStatus);
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [notes, setNotes] = useState('');
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const loading = me === undefined || consultations === undefined;

  const selectConsultation = useCallback((c: any) => {
    setActiveConsultation(c);
    setMessages([]);
  }, []);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createConsultation({ notes });
      setNotes('');
    } catch (err) {
      alert('Failed to request consultation');
    }
  }, [notes, createConsultation]);

  const handleAssign = useCallback(async (id: string) => {
    try {
        await updateStatus({ id, status: 'ACTIVE' });
        // useQuery will refetch consultations
    } catch (err) {
        alert('Failed to pick up case');
    }
  }, [updateStatus]);

  const handleUpdateStatus = useCallback(async (id: string, status: string) => {
    const feedback = prompt('Enter final resolution notes:');
    if (!feedback) return;

    try {
      await updateStatus({ id, status, notes: feedback });
      if (activeConsultation?.id === id) {
          setActiveConsultation((prev: any) => ({ ...prev, status, notes: feedback }));
      }
    } catch (err) {
      alert('Failed to update consultation');
    }
  }, [activeConsultation, updateStatus]);

  useEffect(() => {
    if (!user) {
        router.push('/login');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-brand-base flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Sidebar: Consultation List */}
      <aside className="w-full md:w-80 bg-surface border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
            <h1 className="text-xl font-black text-heading tracking-tight">Consultations</h1>
            <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">Specialist Network</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
            {me?.role === 'RURAL_HO' && (
                <div className="p-4 bg-brand-primary/5">
                    <button 
                        onClick={() => setActiveConsultation('new')}
                        className="w-full py-3 bg-brand-primary text-on-primary rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-transform"
                    >
                        + New Request
                    </button>
                </div>
            )}

            {loading ? (
                <div className="p-10 text-center text-xs font-bold text-muted">Loading cases...</div>
            ) : consultations.length === 0 ? (
                <div className="p-10 text-center text-xs font-bold text-muted italic">No active cases.</div>
            ) : consultations.map((c) => (
                <div 
                    key={c.id} 
                    onClick={() => selectConsultation(c)}
                    className={`p-5 cursor-pointer hover:bg-surface transition-colors ${activeConsultation?.id === c.id ? 'bg-brand-primary/5 border-l-4 border-brand-primary' : ''}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                            c.status === 'PENDING' ? 'bg-brand-secondary/20 text-brand-secondary' :
                            c.status === 'ACTIVE' ? 'bg-brand-primary/20 text-brand-primary' :
                            'bg-brand-primary/20 text-brand-primary'
                        }`}>
                            {c.status}
                        </span>
                        <span className="text-[9px] font-bold text-muted">{new Date(c.startedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-black text-heading line-clamp-2 leading-snug">{c.notes}</p>
                </div>
            ))}
        </div>

        <div className="p-4 border-t border-border">
            <button onClick={() => router.push('/dashboard')} className="w-full py-3 text-xs font-black text-muted hover:text-heading transition-colors uppercase tracking-widest">
                &larr; Exit Console
            </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-surface">
        {!activeConsultation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-surface rounded-[2rem] flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-muted/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <h3 className="text-xl font-black text-heading mb-2">Select a Consultation</h3>
                <p className="text-muted text-sm font-medium max-w-xs">Choose a case from the sidebar to view clinical history and start real-time discussion.</p>
            </div>
        ) : activeConsultation === 'new' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
                <div className="w-full max-w-lg bg-surface p-10 rounded-[2.5rem] shadow-2xl shadow-brand-primary/5 border border-border">
                    <h2 className="text-2xl font-black text-heading mb-2">Request Specialist Input</h2>
                    <p className="text-sm text-muted font-medium mb-8">Briefly describe the clinical case. A specialist will be assigned to your request shortly.</p>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe symptoms, patient history, and specific questions..."
                            className="w-full h-40 p-5 bg-surface border border-border rounded-3xl font-bold text-heading focus:ring-2 focus:ring-brand-primary/20 outline-none resize-none transition-all"
                            required
                        />
                        <div className="flex gap-4">
                            <button 
                                type="button"
                                onClick={() => setActiveConsultation(null)}
                                className="flex-1 py-4 bg-surface text-muted rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-surface transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="flex-[2] py-4 bg-brand-primary text-on-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-brand-primary/20"
                            >
                                Send Clinical Request
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        ) : (
            <>
                {/* Chat Header */}
                <header className="p-6 border-b border-border flex justify-between items-center bg-surface/80 backdrop-blur-md">
                    <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">
                            {activeConsultation.status === 'PENDING' ? 'Unassigned Request' : 'Active Case'}
                        </p>
                        <h3 className="font-black text-heading truncate max-w-md">{activeConsultation.notes}</h3>
                    </div>
                    {me?.role === 'DOCTOR' && (
                        activeConsultation.status === 'PENDING' ? (
                            <button 
                                onClick={() => handleAssign(activeConsultation.id)}
                                className="px-6 py-2 bg-brand-primary text-on-primary rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform"
                            >
                                Pick Up This Case
                            </button>
                        ) : activeConsultation.status !== 'COMPLETED' && (
                            <button 
                                onClick={() => handleUpdateStatus(activeConsultation.id, 'COMPLETED')}
                                className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-xl font-black text-[10px] uppercase tracking-widest border border-brand-primary/20 hover:bg-brand-primary/20 transition-colors"
                            >
                                Mark Resolved
                            </button>
                        )
                    )}
                </header>

                {/* Messages Container */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-brand-base">
                    {messages.map((m) => (
                        <div key={m.id} className={`flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${
                                m.senderId === user?.id ? 'bg-brand-primary text-on-primary rounded-tr-none' : 'bg-surface text-heading rounded-tl-none border border-border'
                            }`}>
                                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{m.sender.name}</p>
                                <p className="text-sm font-bold leading-relaxed">{m.content}</p>
                                <p className={`text-[8px] font-black mt-1 opacity-40 text-right`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    ))}
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale scale-75">
                            <div className="w-16 h-16 bg-surface rounded-full mb-4"></div>
                            <p className="text-xs font-black uppercase tracking-tighter">Start of Clinical Discussion</p>
                        </div>
                    )}
                </div>

                {/* Chat Input */}
                {activeConsultation.status !== 'COMPLETED' ? (
                    <footer className="p-6 bg-surface border-t border-border">
                        <div className="flex gap-4">
                            <input 
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Real-time chat is available via the mobile app"
                                className="flex-1 px-6 py-4 bg-surface border border-border rounded-2xl font-bold text-heading opacity-60 cursor-not-allowed"
                                disabled
                            />
                            <button 
                                type="button"
                                disabled
                                className="w-14 h-14 bg-brand-primary/50 text-on-primary rounded-2xl flex items-center justify-center cursor-not-allowed"
                            >
                                <svg className="w-6 h-6 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9-2-9-18-9 18 9 2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    </footer>
                ) : (
                    <footer className="p-6 bg-surface border-t border-border text-center">
                        <p className="text-xs font-black text-muted uppercase tracking-widest">Case Resolved • Chat Locked</p>
                    </footer>
                )}
            </>
        )}
      </main>
    </div>
  );
}
