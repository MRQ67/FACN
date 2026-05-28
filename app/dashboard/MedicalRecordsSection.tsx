'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function MedicalRecordsSection() {
  const router = useRouter();
  const { user } = useUser();
  const profile = useQuery(api.users.getMe);
  const patients = useQuery(api.users.listPatients, { search: '' }) ?? [];
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const myPatientId = profile?.role === 'PATIENT' ? profile?.patient?._id : undefined;
  const targetPatientId = myPatientId || selectedPatientId || undefined;
  const vitalsQuery = useQuery(
    api.vitals.listByPatient,
    targetPatientId ? { patientId: targetPatientId } : 'skip'
  );
  const vitals = vitalsQuery ?? [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20';
      case 'WARNING': return 'text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20';
      default: return 'text-brand-primary bg-brand-primary/20 border-brand-primary/20';
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-black text-heading tracking-tight">Medical Records</h2>
                <p className="text-muted font-bold uppercase tracking-widest text-[10px]">Vital Signs & Remote Monitoring</p>
            </div>
            {(profile?.role === 'NURSE' || profile?.role === 'RURAL_HO') && (
                <button 
                    onClick={() => router.push('/vitals/record')}
                    className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary text-on-primary rounded-2xl font-black shadow-xl shadow-brand-primary/20 hover:scale-105 transition-transform"
                >
                    Record New
                </button>
            )}
        </div>

        {profile?.role !== 'PATIENT' && (
            <div className="glass-card p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-border">
                <label className="text-xs font-black uppercase tracking-widest text-muted mb-3 block">Filter by Patient</label>
                <select 
                    className="w-full p-4 bg-surface border border-border rounded-2xl font-bold text-heading focus:ring-2 focus:ring-brand-primary outline-none cursor-pointer shadow-sm text-sm md:text-base"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                    <option value="">Select a patient...</option>
                    {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.user.name} ({p.user.phone})</option>
                    ))}
                </select>
            </div>
        )}

        <div className="space-y-6">
          {vitalsQuery === undefined && targetPatientId ? (
             <div className="space-y-4">
                 {[1, 2].map(i => (
                     <div key={i} className="bg-surface p-6 md:p-8 rounded-[2rem] border border-border animate-pulse">
                          <div className="flex justify-between mb-6">
                              <div className="h-4 bg-surface rounded w-1/4"></div>
                              <div className="h-4 bg-surface rounded w-16"></div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              {[1, 2, 3, 4, 5].map(j => <div key={j} className="h-10 bg-surface rounded-xl"></div>)}
                         </div>
                     </div>
                 ))}
             </div>
          ) : vitals.length === 0 ? (
            <div className="bg-surface p-12 md:p-20 text-center rounded-[2.5rem] border border-border shadow-sm">
                <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-muted/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <h3 className="text-xl font-black text-heading mb-2">No Records Available</h3>
                <p className="text-muted font-medium text-sm">
                    {selectedPatientId || profile?.role === 'PATIENT' ? 'No vitals history has been recorded yet.' : 'Please select a patient to see their clinical history.'}
                </p>
            </div>
          ) : (
            vitals.map((record) => (
              <div key={record.id} className="bg-surface p-6 md:p-8 rounded-[2rem] shadow-sm border border-border hover:border-brand-primary/20 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">{new Date(record.recordedAt).toLocaleDateString()}</span>
                        <span className="text-muted/60">•</span>
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">{new Date(record.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm font-bold text-muted">Recorded by: <span className="text-heading font-black">{record.nurse.user.name}</span></p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0 ${getStatusColor(record.triageResult?.overallStatus)}`}>
                    {record.triageResult?.overallStatus || 'NORMAL'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-8">
                  {[
                      { label: 'BP', value: record.bloodPressure, unit: '' },
                      { label: 'Heart Rate', value: record.heartRate, unit: 'bpm' },
                      { label: 'O2 Sat', value: record.oxygenSat, unit: '%' },
                      { label: 'Temp', value: record.temp, unit: '°C' },
                      { label: 'Glucose', value: record.glucose, unit: 'mg/dL' },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 bg-surface rounded-2xl border border-border">
                      <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-1">{stat.label}</span>
                      <span className="text-base md:text-lg font-black text-heading">{stat.value || '--'} <span className="text-[9px] text-muted font-bold">{stat.unit}</span></span>
                    </div>
                  ))}
                </div>

                {record.notes && (
                  <div className="p-5 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                    <span className="text-[10px] text-brand-primary font-black uppercase tracking-widest block mb-2">Clinical Observations</span>
                    <p className="text-xs md:text-sm text-muted font-medium leading-relaxed">{record.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
    </div>
  );
}
