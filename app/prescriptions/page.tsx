'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from "../../convex/_generated/api";
import { useRouter } from 'next/navigation';

export default function PrescriptionsPage() {
  const { user } = useUser();
  const me = useQuery(api.users.getMe);
  const patientId = me?.role === 'PATIENT' ? me?.patient?.id : undefined;
  const prescriptions = useQuery(api.prescriptions.listByPatient, !user ? "skip" : { patientId: patientId || '' });
  const router = useRouter();

  const loading = me === undefined || prescriptions === undefined;

  useEffect(() => {
    if (!user) {
        router.push('/login');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-brand-base p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div className="space-y-1">
                <h1 className="text-4xl font-black text-heading tracking-tight">Digital Prescriptions</h1>
                <p className="text-muted font-bold uppercase tracking-widest text-[10px]">Official Medical Records & Dispensing</p>
            </div>
            {me?.role === 'DOCTOR' && (
                <button 
                    onClick={() => router.push('/prescriptions/new')}
                    className="px-8 py-3.5 bg-brand-primary text-on-primary rounded-2xl font-black shadow-xl shadow-brand-primary/20 hover:scale-105 transition-transform"
                >
                    New Prescription
                </button>
            )}
        </div>

        {loading ? (
          <div className="p-20 text-center glass-card rounded-[2.5rem]">
                  <div className="animate-pulse flex flex-col items-center gap-4">
                      <div className="w-12 h-12 bg-surface rounded-full"></div>
                      <div className="h-4 bg-surface w-48 rounded"></div>
              </div>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="bg-surface p-20 rounded-[2.5rem] shadow-sm text-center border border-border">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <p className="text-muted font-bold">No digital prescriptions on file.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {prescriptions.map((p) => (
              <div key={p.id} className="bg-surface p-8 rounded-[2.5rem] shadow-sm border border-border hover:border-brand-primary/20 transition-all hover-lift flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div>
                        <h3 className="font-black text-heading tracking-tight leading-none mb-1">
                            {me?.role === 'PATIENT' ? `Dr. ${p.doctor.user.name}` : `Patient: ${p.patient.user.name}`}
                        </h3>
                        <p className="text-[10px] text-muted font-black uppercase tracking-widest">Issued {new Date(p.issuedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-brand-primary/10 rounded-full border border-brand-primary/20">
                      <span className="text-[8px] font-black text-brand-primary uppercase tracking-widest">Verified</span>
                  </div>
                </div>
                
                <div className="space-y-6 flex-1">
                    <div className="space-y-3">
                        <p className="text-[10px] text-muted font-black uppercase tracking-widest">Medications</p>
                        <div className="space-y-2">
                            {(Array.isArray(p.medications) ? p.medications : [p.medications]).map((med: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-surface rounded-xl">
                                    <span className="mt-1 text-brand-primary">💊</span>
                                    <p className="text-sm font-bold text-heading">{med}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {p.notes && (
                        <div className="space-y-2">
                            <p className="text-[10px] text-muted font-black uppercase tracking-widest">Instructions</p>
                            <p className="text-sm text-muted italic font-medium leading-relaxed bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/20">
                                "{p.notes}"
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-border/50 flex justify-between items-center">
                    <div className="flex gap-4">
                        <button className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:underline flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Save PDF
                        </button>
                    </div>
                    {me?.role === 'PATIENT' && (
                        <button className="px-5 py-2 bg-brand-secondary text-on-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary transition-colors shadow-lg shadow-brand-secondary/10">
                            Show QR Code
                        </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
            <button 
                onClick={() => router.push('/dashboard')}
                className="text-muted text-sm hover:underline"
            >
                &larr; Back to Dashboard
            </button>
        </div>
      </div>
    </div>
  );
}
