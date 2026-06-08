'use client';

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { ShieldX } from "lucide-react";

export default function TriagePage() {
  const profile = useQuery(api.users.getMe);
  const analyzeAction = useAction(api.triageAction.analyze);
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (profile !== undefined && profile?.role !== "PATIENT") {
    return (
      <div className="min-h-screen bg-brand-base flex items-center justify-center p-4">
        <div className="bg-surface p-12 rounded-[3rem] shadow-sm border border-border max-w-md w-full text-center">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-2xl font-black text-heading tracking-tight mb-3">Patients Only</h1>
          <p className="text-sm text-muted font-medium mb-8 leading-relaxed">
            AI triage is available for patients. Your doctor can view your triage history from your profile.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-8 py-3.5 bg-brand-primary text-on-primary rounded-2xl font-black shadow-xl shadow-brand-primary/20 hover:scale-105 transition-transform"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);

    try {
      const data = await analyzeAction({
        symptoms,
        patientId: profile?._id,
      });

      setResult(data as any);
    } catch (err: any) {
      alert(err.message || "Triage analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-base p-4 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-surface p-12 rounded-[3rem] shadow-sm border border-border">
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
              <span className="text-brand-primary text-2xl font-black tracking-tighter italic">
                AI
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-black text-heading tracking-tight leading-none mb-1">
                Smart Triage
              </h1>
              <p className="text-[10px] text-muted font-black uppercase tracking-widest">
                Powered by Google Gemini
              </p>
            </div>
          </div>

          {!result ? (
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted">
                  Describe your symptoms
                </label>
                <textarea
                  name="symptoms"
                  rows={6}
                  className="w-full p-4 bg-surface border-none rounded-2xl focus:ring-2 focus:ring-brand-primary font-bold text-heading"
                  placeholder="Describe what you're feeling in as much detail as possible. For example: I have had a headache for 2 days, fever, and sore throat..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>

              <button
                type="button"
                disabled={loading || !symptoms.trim()}
                onClick={handleSubmit}
                className="w-full flex justify-center py-5 px-4 border border-transparent rounded-[1.5rem] shadow-xl shadow-brand-primary/20 text-lg font-black text-on-primary bg-brand-primary hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {loading ? "AI Model Processing..." : "Analyse Symptoms \u2728"}
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div
                className={`p-10 rounded-[2.5rem] border ${
                  result.severity === "CRITICAL"
                    ? "bg-red-50 border-red-200"
                    : result.severity === "MODERATE"
                      ? "bg-amber-50 border-amber-200"
                      : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex justify-between items-center mb-6">
                  <span
                    className={`px-4 py-1 rounded-full text-[10px] font-black text-white ${
                      result.severity === "CRITICAL"
                        ? "bg-red-600"
                        : result.severity === "MODERATE"
                          ? "bg-amber-600"
                          : "bg-green-600"
                    }`}
                  >
                    {result.severity}
                  </span>
                  <span className="text-[10px] text-muted font-black uppercase tracking-widest">
                    AI Assessment
                  </span>
                </div>
                <h3 className="text-xl font-black text-heading mb-4 leading-tight tracking-tight">
                  {result.summary}
                </h3>
                <div className="bg-surface/60 p-6 rounded-2xl border border-white">
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">
                    Recommendation
                  </p>
                  <p className="text-sm text-heading font-medium leading-relaxed mb-4">
                    {result.recommendation}
                  </p>
                  <p className="text-[10px] font-bold text-brand-primary uppercase">
                    Urgency: {result.urgency}
                  </p>
                </div>
                {result.flags && result.flags.length > 0 && (
                  <div className="mt-6">
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">
                      Clinical Flags
                    </p>
                    <ul className="list-disc list-inside text-sm text-heading">
                      {result.flags.map((flag: string, i: number) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 py-4 px-4 bg-surface text-muted rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-surface transition-all"
                >
                  New Analysis
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-muted text-sm hover:underline"
          >
            &larr; Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
