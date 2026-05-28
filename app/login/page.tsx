'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 selection:bg-primary/20">
      <div className="max-w-xl w-full">
        <div className="flex flex-col items-center mb-12 group cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-16 h-16 bg-dark rounded-[2rem] flex items-center justify-center shadow-2xl shadow-dark/20 group-hover:scale-110 transition-all duration-500 mb-6">
            <svg className="w-9 h-9 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-dark tracking-tighter leading-none">FMC Portal</h1>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-3">Foundation Medical Center</p>
        </div>

        <div className="bg-white p-12 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(13,27,42,0.05)] border border-gray-100">
          <div className="mb-10">
            <h2 className="text-2xl font-black text-dark tracking-tight">Access Secure Records</h2>
            <p className="text-sm font-medium text-gray-500 mt-2">Sign in with your institutional account to continue.</p>
          </div>
          <SignIn fallbackRedirectUrl="/dashboard" />
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-dark transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            Return to Landing
          </button>
        </div>
      </div>
    </div>
  );
}
