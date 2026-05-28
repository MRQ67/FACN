'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';

export default function AppointmentsSection() {
  const { user } = useUser();
  const profile = useQuery(api.users.getMe);
  const appointmentsQuery = useQuery(api.appointments.listMy);
  const appointments = appointmentsQuery ?? [];
  const updateStatus = useMutation(api.appointments.updateStatus);
  const router = useRouter();

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateStatus({ id, status });
    } catch {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-heading tracking-tight">Appointments</h2>
          <p className="text-muted font-bold uppercase tracking-widest text-[10px]">Your medical schedule</p>
        </div>
        {profile?.role === 'PATIENT' && (
          <button 
            className="w-full sm:w-auto px-6 py-3 bg-brand-primary text-on-primary rounded-2xl font-black shadow-xl shadow-brand-primary/20 hover:scale-105 transition-transform"
          >
            Book New
          </button>
        )}
      </div>

      {appointmentsQuery === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
                <div key={i} className="bg-surface p-6 md:p-8 rounded-[2rem] border border-border animate-pulse">
                    <div className="h-4 bg-surface rounded w-1/4 mb-4"></div>
                    <div className="h-6 bg-surface rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-surface rounded w-1/2"></div>
                </div>
            ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-surface p-12 md:p-20 rounded-[2.5rem] text-center border border-border shadow-sm">
          <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-muted/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="text-xl font-black text-heading mb-2">No Appointments Found</h3>
          <p className="text-muted font-medium mb-8">You don't have any scheduled medical visits at the moment.</p>
          {profile?.role === 'PATIENT' && (
              <button 
                  className="px-8 py-3 bg-brand-secondary text-on-primary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-primary transition-colors"
              >
                  Find a Doctor &rarr;
              </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-surface p-6 md:p-8 rounded-[2rem] border border-border shadow-sm hover:border-brand-primary/20 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black text-lg md:text-xl">
                    {(profile?.role === 'PATIENT' ? apt.doctor.user.name : apt.patient.user.name).split(' ').map((n: any) => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-heading text-base md:text-lg leading-tight truncate">
                        {profile?.role === 'PATIENT' ? `Dr. ${apt.doctor.user.name}` : apt.patient.user.name}
                    </h3>
                    <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1 truncate">
                        {profile?.role === 'PATIENT' ? apt.doctor.specialty : 'Patient'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0 ${
                    apt.status === 'CONFIRMED' ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/20' :
                    apt.status === 'PENDING' ? 'bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/20' :
                    'bg-surface text-muted border border-border'
                }`}>
                    {apt.status}
                </span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3 text-sm font-bold text-muted">
                  <svg className="w-4 h-4 text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="truncate">{new Date(apt.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm font-bold text-muted">
                  <svg className="w-4 h-4 text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="inline-flex items-center px-3 py-1 bg-surface rounded-lg text-[9px] font-black text-muted uppercase tracking-widest border border-border">
                    {apt.type.replace('_', ' ')}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                {profile?.role === 'DOCTOR' && apt.status === 'PENDING' && (
                  <>
                    <button 
                      onClick={() => handleStatusUpdate(apt.id, 'CONFIRMED')}
                      className="w-full sm:flex-1 py-3 bg-brand-primary text-on-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(apt.id, 'CANCELLED')}
                      className="w-full sm:flex-1 py-3 bg-brand-secondary/10 text-brand-secondary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-secondary/20 transition-colors border border-brand-secondary/20"
                    >
                      Decline
                    </button>
                  </>
                )}
                {apt.status === 'CONFIRMED' && (
                    <button 
                        className="w-full py-3 bg-brand-secondary text-on-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-secondary/90 transition-colors"
                        onClick={() => {/* Open details or medical record */}}
                    >
                        View Details
                    </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
