'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface Patient {
    id: string;
    userId: string;
    dateOfBirth: string;
    bloodType: string | null;
    chronicConditions: string | null;
    user: {
        id: string;
        name: string;
        phone: string;
        email: string | null;
    }
}

export default function PatientRegistryPage() {
    const router = useRouter();
    const { user } = useUser();
    const profile = useQuery(api.users.getMe);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (user && profile && profile.role === 'PATIENT') {
            router.push('/dashboard');
        }
    }, [user, profile, router]);

    const patients = useQuery(api.users.listPatients, { search }) ?? [];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <div className="min-h-screen bg-brand-base p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-heading tracking-tight">Patient Registry</h1>
                        <p className="text-muted font-bold uppercase tracking-widest text-[10px]">Unified Health Records Access</p>
                    </div>
                    <button 
                        onClick={() => router.push('/vitals/record')}
                        className="px-8 py-3.5 bg-brand-primary text-on-primary rounded-2xl font-black shadow-xl shadow-brand-primary/20 hover:scale-105 transition-transform"
                    >
                        Register New Vitals
                    </button>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mb-12 glass-card p-6 rounded-[2.5rem] flex gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search by name, phone, or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-surface/50 border border-white rounded-2xl font-bold text-heading focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                        />
                        <svg className="w-6 h-6 text-muted absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <button type="submit" className="px-8 py-4 bg-brand-secondary text-on-primary rounded-2xl font-black hover:bg-brand-secondary transition-colors">
                        Search
                    </button>
                </form>

                {patients.length === 0 && search ? (
                    <div className="bg-surface p-20 rounded-[2.5rem] text-center border border-border">
                        <p className="text-muted font-bold">No patients found matching your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {patients.map((p) => (
                            <div 
                                key={p.patient._id} 
                                onClick={() => router.push(`/patients/${p.patient._id}`)}
                                className="bg-surface p-8 rounded-[2.5rem] border border-border hover:border-brand-primary/20 transition-all hover:shadow-2xl hover:shadow-brand-primary/5 cursor-pointer group"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black text-xl group-hover:scale-110 transition-transform">
                                        {p.user.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-heading text-lg leading-tight">{p.user.name}</h3>
                                        <p className="text-[10px] text-muted font-black uppercase tracking-widest">{p.user.phone}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-muted uppercase tracking-widest">Blood Type</span>
                                        <span className="text-heading">{p.patient.bloodType || 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-muted uppercase tracking-widest">Date of Birth</span>
                                        <span className="text-heading">{new Date(p.patient.dateOfBirth).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {p.patient.chronicConditions && (
                                    <div className="p-3 bg-brand-secondary/10 rounded-xl mb-6">
                                        <p className="text-[10px] font-black text-brand-secondary uppercase tracking-widest mb-1">Chronic Conditions</p>
                                        <p className="text-xs font-bold text-brand-secondary truncate">{p.patient.chronicConditions}</p>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-border/50 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-flex items-center gap-2">
                                        View Full Profile
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
