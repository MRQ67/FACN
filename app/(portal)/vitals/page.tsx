'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from "../../../convex/_generated/api";

export default function VitalsHistoryPage() {
  const router = useRouter();
  const { user } = useUser();
  const me = useQuery(api.users.getMe);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const isPatient = me?.role === 'PATIENT';
  const showPatients = me && !isPatient;
  
  // Use me._id directly for patients since patientId now references the users table
  const patientId = isPatient ? me?._id : selectedPatientId || undefined;
  
  const patients = useQuery(api.patients.listPatients, showPatients ? { search: "" } : "skip") ?? [];
  const vitals = useQuery(api.vitals.listByPatient, patientId ? { patientId: patientId as any } : "skip") ?? [];

  const loading = me === undefined || 
    (patientId === undefined ? Boolean(showPatients) && patients === undefined : vitals === undefined);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'text-brand-secondary bg-brand-secondary/10';
      case 'WARNING': return 'text-brand-secondary bg-brand-secondary/5';
      default: return 'text-brand-primary bg-brand-primary/10';
    }
  };

  return (
    <div className="min-h-screen bg-brand-base p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div className="space-y-1">
                <h1 className="text-4xl font-black text-heading tracking-tight">Health Records</h1>
                <p className="text-muted font-bold uppercase tracking-widest text-[10px]">Vital Signs & Remote Monitoring</p>
            </div>
            {me?.role === 'NURSE' && (
                <button 
                    onClick={() => router.push('/vitals/record')}
                    className="px-8 py-3.5 bg-brand-primary text-on-primary rounded-2xl font-black shadow-xl shadow-brand-primary/20 hover:scale-105 transition-transform"
                >
                    Record New Vitals
                </button>
            )}
        </div>

        {me?.role !== 'PATIENT' && (
            <div className="mb-12 glass-card p-8 rounded-[2.5rem]">
                <label className="text-xs font-black uppercase tracking-widest text-muted mb-3 block">Filter by Patient</label>
                <select 
                    className="w-full p-4 bg-surface border border-border rounded-2xl font-bold text-heading focus:ring-2 focus:ring-brand-primary outline-none cursor-pointer shadow-sm"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                    <option value="">Select a patient...</option>
                    {patients.map((p: any) => (
                        <option key={p.userId} value={p.userId}>{p.user.name} ({p.user.phone})</option>
                    ))}
                </select>
            </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : vitals.length === 0 ? (
            <div className="bg-surface p-12 text-center rounded-xl shadow-sm text-muted">
                {selectedPatientId || me?.role === 'PATIENT' ? 'No vitals history found.' : 'Select a patient to see their vitals history.'}
            </div>
          ) : (
            vitals.map((record: any) => (
              <div key={record._id} className="bg-surface p-6 rounded-xl shadow-sm border border-border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm text-muted">{new Date(record._creationTime).toLocaleString()}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(record.triageResult)}`}>
                    {record.triageResult || 'NORMAL'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 bg-brand-base/50 rounded-lg">
                    <span className="text-xs text-muted block uppercase font-bold text-[8px] tracking-widest mb-1">BP</span>
                    <span className="font-bold">{record.bloodPressure}</span>
                  </div>
                  <div className="p-3 bg-brand-base/50 rounded-lg">
                    <span className="text-xs text-muted block uppercase font-bold text-[8px] tracking-widest mb-1">Heart Rate</span>
                    <span className="font-bold">{record.heartRate || '--'} bpm</span>
                  </div>
                  <div className="p-3 bg-brand-base/50 rounded-lg">
                    <span className="text-xs text-muted block uppercase font-bold text-[8px] tracking-widest mb-1">O2 Sat</span>
                    <span className="font-bold">{record.oxygenSat || '--'}%</span>
                  </div>
                  <div className="p-3 bg-brand-base/50 rounded-lg">
                    <span className="text-xs text-muted block uppercase font-bold text-[8px] tracking-widest mb-1">Temp</span>
                    <span className="font-bold">{record.temp || '--'} °C</span>
                  </div>
                  <div className="p-3 bg-brand-base/50 rounded-lg">
                    <span className="text-xs text-muted block uppercase font-bold text-[8px] tracking-widest mb-1">Glucose</span>
                    <span className="font-bold">{record.glucose || '--'} mg/dL</span>
                  </div>
                </div>

                {record.notes && (
                  <div className="mt-4 p-3 bg-brand-primary/5 rounded-lg border border-brand-primary/20">
                    <span className="text-xs text-brand-primary font-bold block mb-1">Clinical Notes</span>
                    <p className="text-sm text-muted">{record.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
