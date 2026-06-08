"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientBookAction } from "@/components/patient-book-action";

export default function AppointmentsPage() {
  const { user } = useUser();
  const profile = useQuery(api.users.getMe);
  const queryAppointments = useQuery(api.appointments.listMy);
  
  // Local state for optimistic updates
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync state
  useEffect(() => {
    if (queryAppointments !== undefined) {
      setAppointments(queryAppointments);
      setIsLoading(false);
    }
  }, [queryAppointments]);

  const updateStatus = useMutation(api.appointments.updateStatus);
  const cancel = useMutation(api.appointments.cancel);
  const router = useRouter();

  const handleStatusUpdate = async (id: string, status: string) => {
    // Optimistic update
    setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
    
    // Silent mutation
    try {
      await updateStatus({ appointmentId: id as any, status: status as any });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = async (id: string) => {
    // Optimistic remove
    setAppointments(prev => prev.filter(a => a._id !== id));
    
    // Silent mutation
    try {
      await cancel({ id: id as any });
    } catch (e) {
      console.error(e);
    }
  };

  if (!user || isLoading) return <div className="max-w-4xl mx-auto py-12 px-4"><Skeleton className="h-8 w-1/3 mb-8" /><div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div></div>;

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Appointments</h1>
          {profile?.role === "PATIENT" && (
            <PatientBookAction 
              trigger={
                <button
                  className="px-6 py-2.5 bg-brand-primary text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-opacity-90 shadow-lg shadow-brand-primary/20 transition-all"
                >
                  Book New Appointment
                </button>
              }
            />
          )}
        </div>

        {appointments.length === 0 ? (
          <div className="bg-card p-12 rounded-xl shadow-sm text-center border border-border">
            <p className="text-muted-foreground mb-4">
              You have no upcoming appointments.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt: any) => (
              <div
                key={apt._id}
                className="bg-card p-6 rounded-xl shadow-sm border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        apt.status === "CONFIRMED"
                          ? "bg-green-500"
                          : apt.status === "PENDING"
                            ? "bg-yellow-500"
                            : apt.status === "CANCELLED"
                              ? "bg-red-500"
                              : "bg-muted-foreground"
                      }`}
                    ></span>
                    <h3 className="font-bold text-foreground">
                      {profile?.role === "PATIENT"
                        ? `Dr. ${apt.doctor.user.name}`
                        : apt.patient.user.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    📅 {new Date(apt.scheduledAt).toLocaleDateString()} at{" "}
                    {new Date(apt.scheduledAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-bold">
                    {apt.type.replace("_", " ")}
                  </p>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                  {profile?.role === "DOCTOR" && apt.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(apt._id, "CONFIRMED")}
                        className="flex-1 md:flex-none px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-md hover:bg-green-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(apt._id, "CANCELLED")}
                        className="flex-1 md:flex-none px-4 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-md hover:bg-red-200"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {profile?.role === "PATIENT" && apt.status !== "CANCELLED" && (
                      <button
                        onClick={() => handleCancel(apt._id)}
                        className="flex-1 md:flex-none px-4 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-md hover:bg-red-200"
                      >
                        Cancel
                      </button>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      apt.status === "CONFIRMED"
                        ? "bg-green-100 text-green-700"
                        : apt.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-muted-foreground text-sm hover:underline"
          >
            &larr; Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
