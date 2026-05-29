"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES = [
  { value: "PATIENT", label: "Patient" },
  { value: "NURSE", label: "Nurse" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "RURAL_HO", label: "Rural HO" },
] as const;

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name || !role) {
      alert("Please fill in your name and role");
      return;
    }
    setSaving(true);
    try {
      await completeOnboarding({
        name,
        role: role as "PATIENT" | "NURSE" | "DOCTOR" | "RURAL_HO" | "ADMIN",
        phone: phone || undefined,
      });
      router.push("/dashboard");
    } catch (e) {
      alert("Failed to save profile");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-base flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <AnimatedThemeToggler />
      </div>
      <div className="bg-surface p-10 rounded-[3rem] shadow-xl border border-border max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-primary rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg
              className="w-9 h-9 text-on-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-heading">
            Welcome to FCN Portal
          </h1>
          <p className="text-sm text-muted mt-2">
            Complete your profile to get started.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1 mb-2 block">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3.5 bg-surface border border-border rounded-2xl font-bold text-heading focus:bg-white focus:border-brand-primary/30 outline-none transition-all"
              placeholder={user?.fullName || "Enter your name"}
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1 mb-2 block">
              Phone (optional)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-5 py-3.5 bg-surface border border-border rounded-2xl font-bold text-heading focus:bg-white focus:border-brand-primary/30 outline-none transition-all"
              placeholder="+251 9XX XXX XXX"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1 mb-2 block">
              Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                    role === r.value
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-border text-muted hover:border-border"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name || !role || saving}
            className="w-full py-4 bg-brand-secondary text-on-primary font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-brand-primary transition-all disabled:opacity-40 mt-4"
          >
            {saving ? "Saving..." : "Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}
