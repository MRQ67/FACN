"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import DoctorsSection from "./DoctorsSection";
import AppointmentsSection from "./AppointmentsSection";
import MedicalRecordsSection from "./MedicalRecordsSection";
import ConsultationsSection from "./ConsultationsSection";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import {
  IconLayoutDashboard,
  IconUserSearch,
  IconCalendar,
  IconClipboardText,
  IconMessage2,
  IconLogout,
  IconSettings,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

const Logo = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-10 w-32" />;

  return (
    <Link
      href="/"
      className="relative z-20 flex items-center space-x-3 py-1 text-sm font-normal"
    >
      <Image
        src={resolvedTheme === "dark" ? "/logo_dark.svg" : "/logo_light.svg"}
        alt="FMC Logo"
        width={120}
        height={32}
        className="h-8 w-auto"
        priority
      />
    </Link>
  );
};

const LogoIcon = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-8 w-8" />;

  return (
    <Link
      href="/"
      className="relative z-20 flex items-center py-1 text-sm font-normal"
    >
      <Image
        src={resolvedTheme === "dark" ? "/logo_dark.svg" : "/logo_light.svg"}
        alt="FMC Logo"
        width={32}
        height={32}
        className="h-8 w-8 object-left object-cover shrink-0"
        priority
      />
    </Link>
  );
};

export default function DashboardPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const profile = useQuery(api.users.getMe);
  const appointments =
    useQuery(api.appointments.listMy, profile ? undefined : "skip") ?? [];
  const adminStats = useQuery(api.admin.getStats, profile ? undefined : "skip");
  const toggleAvailabilityMut = useMutation(api.doctors.toggleAvailability);
  const updateLocationMut = useMutation(api.doctors.updateLocation);
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [open, setOpen] = useState(false);

  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <IconLayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
      ),
      id: "overview",
    },
    {
      label: "Find Doctors",
      href: "#",
      icon: (
        <IconUserSearch className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
      ),
      id: "doctors",
    },
    {
      label: "Appointments",
      href: "#",
      icon: (
        <IconCalendar className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
      ),
      id: "appointments",
    },
    {
      label: "Medical Records",
      href: "#",
      icon: (
        <IconClipboardText className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
      ),
      id: "vitals",
    },
    {
      label: "Consultations",
      href: "#",
      icon: (
        <IconMessage2 className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
      ),
      id: "messages",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: (
        <IconSettings className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
      ),
      id: "settings",
    },
  ];

  const recentAppointments = appointments.slice(0, 3);

  const stats = {
    appointments: appointments.length,
    vitals: adminStats?.vitals ?? 0,
    prescriptions: adminStats?.prescriptions ?? 0,
    consultations: adminStats?.consultations ?? 0,
    patients: adminStats?.patients ?? 0,
    avgWaitTime: profile?.role === "DOCTOR" ? "12 min" : "14 min",
  };

  useEffect(() => {
    if (profile?.doctor?.isAvailable !== undefined) {
      setIsAvailable(profile.doctor.isAvailable);
    }
  }, [profile]);

  const handleToggleAvailability = async () => {
    setLoading(true);
    try {
      const result = await toggleAvailabilityMut();
      setIsAvailable(result?.isAvailable ?? !isAvailable);
      if (result?.isAvailable) {
        startLocationTracking();
      }
    } catch {
      alert("Failed to update availability");
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          await updateLocationMut({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        } catch {
          console.error("Location sync failed");
        }
      });
    }
  };

  useEffect(() => {
    if (isAvailable) {
      const interval = setInterval(startLocationTracking, 30000);
      return () => clearInterval(interval);
    }
  }, [isAvailable]);

  if (!user) return null;

  if (profile === undefined) {
    return (
      <div className="min-h-screen bg-brand-base flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (profile === null || !profile.name || !profile.role) {
    router.replace("/onboarding");
    return (
      <div className="min-h-screen bg-brand-base flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <div className="h-screen bg-brand-base flex overflow-hidden w-full">
        <SidebarBody className="justify-between gap-10 bg-brand-secondary/5 border-r border-border/10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <Logo />
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  onClick={(e: any) => {
                    e.preventDefault();
                    setActiveTab(link.id);
                  }}
                  className={
                    activeTab === link.id
                      ? "bg-brand-primary/10 rounded-xl px-2"
                      : ""
                  }
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-surface/5 p-4 rounded-2xl border border-border/5">
              <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">
                Logged in as
              </p>
              <p className="text-sm font-bold text-heading dark:text-on-primary truncate">
                {user?.fullName || profile?.name}
              </p>
              <p className="text-xs text-brand-primary font-bold mt-1">
                {profile?.role?.replace("_", " ")}
              </p>
            </div>
            <SidebarLink
              link={{
                label: "Logout",
                href: "#",
                icon: (
                  <IconLogout className="text-neutral-700 dark:text-neutral-200 h-6 w-6 shrink-0" />
                ),
              }}
              onClick={(e: any) => {
                e.preventDefault();
                signOut();
                router.push("/");
              }}
            />
          </div>
        </SidebarBody>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-screen">
          <header className="bg-surface/70 backdrop-blur-md sticky top-0 z-50 border-b border-border h-20 flex items-center px-4 md:px-8 justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg md:text-xl font-black text-heading tracking-tight truncate">
                {activeTab === "overview"
                  ? "Overview"
                  : activeTab === "doctors"
                    ? "Find Doctors"
                    : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
            </div>

          <div className="flex items-center gap-3 md:gap-6">
            {profile?.role === "DOCTOR" && (
              <div className="hidden sm:flex items-center bg-surface px-4 py-1.5 rounded-full border border-border">
                <span className="text-[10px] font-black uppercase tracking-widest mr-3 text-muted">
                  Status
                </span>
                <button
                  onClick={handleToggleAvailability}
                  disabled={loading}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                    isAvailable ? "bg-brand-primary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-surface transition-transform ${isAvailable ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
                <span
                  className={`ml-3 text-xs font-black uppercase ${isAvailable ? "text-brand-primary" : "text-muted"}`}
                >
                  {isAvailable ? "Active" : "Offline"}
                </span>
              </div>
            )}

            <div className="relative group cursor-pointer">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-surface rounded-full flex items-center justify-center border border-border group-hover:border-brand-primary transition-colors">
                <svg
                  className="w-5 h-5 text-muted group-hover:text-brand-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-brand-secondary border-2 border-white rounded-full"></div>
            </div>

            <div
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/20 cursor-pointer"
              onClick={() => router.push("/settings")}
            >
              <span className="text-brand-primary font-black text-[10px] md:text-xs">
                {(user?.fullName || profile?.name || "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <AnimatedThemeToggler />
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
          {activeTab === "overview" ? (
            <>
              {/* Welcome Widget */}
              <section className="glass-card bg-gradient-to-br from-brand-primary to-brand-secondary p-10 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-surface/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
                <div className="relative z-10 text-on-primary space-y-4">
                  <h3 className="text-4xl font-black tracking-tight">
                    Welcome back,{" "}
                    {(user?.fullName || profile?.name || "").split(" ")[0]}!
                  </h3>
                  <p className="text-on-primary/80 font-medium max-w-md">
                    {profile?.role === "DOCTOR"
                      ? `You have ${stats.appointments} appointments scheduled for today.`
                      : profile?.role === "PATIENT"
                        ? `Your next check-up is in ${stats.appointments > 0 ? "soon" : "no scheduled appointments"}.`
                        : profile?.role === "NURSE"
                          ? `You have recorded ${stats.vitals} vitals today.`
                          : "Your personalized FCN dashboard is ready."}
                  </p>
                  <div className="pt-4 flex gap-4">
                    <button
                      onClick={() =>
                        router.push(
                          profile?.role === "PATIENT" ||
                            profile?.role === "DOCTOR"
                            ? "/appointments"
                            : "/vitals",
                        )
                      }
                      className="px-6 py-2.5 bg-surface text-brand-primary rounded-xl font-black text-sm hover:scale-105 transition-transform shadow-xl"
                    >
                      {profile?.role === "PATIENT" || profile?.role === "DOCTOR"
                        ? "View Schedule"
                        : "Manage Records"}
                    </button>
                    <button className="px-6 py-2.5 bg-surface/20 backdrop-blur-md text-on-primary border border-border/20 rounded-xl font-black text-sm hover:bg-surface/30 transition-all">
                      Quick Report
                    </button>
                  </div>
                </div>
              </section>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    label:
                      profile?.role === "DOCTOR"
                        ? "Appointments Today"
                        : profile?.role === "PATIENT"
                          ? "Total Visits"
                          : "Vitals Recorded",
                    value:
                      profile?.role === "PATIENT" || profile?.role === "DOCTOR"
                        ? stats.appointments
                        : stats.vitals,
                    trend: "+12%",
                    color: "text-brand-primary",
                  },
                  {
                    label:
                      profile?.role === "PATIENT"
                        ? "Prescriptions"
                        : "Avg. Response",
                    value:
                      profile?.role === "PATIENT"
                        ? stats.prescriptions
                        : stats.avgWaitTime,
                    trend: "-2m",
                    color: "text-brand-primary",
                  },
                  {
                    label:
                      profile?.role === "DOCTOR" ||
                      profile?.role === "NURSE" ||
                      profile?.role === "RURAL_HO"
                        ? "Active Patients"
                        : "Health Score",
                    value: profile?.role === "PATIENT" ? "92%" : stats.patients,
                    trend: "Stable",
                    color: "text-brand-secondary",
                  },
                  {
                    label: "Satisfaction",
                    value: "4.9/5",
                    trend: "+0.1",
                    color: "text-brand-secondary",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-surface p-6 rounded-3xl border border-border hover:border-brand-primary/20 transition-colors shadow-sm"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">
                      {stat.label}
                    </p>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-black text-heading tracking-tight">
                        {stat.value}
                      </p>
                      <span
                        className={`text-[10px] font-bold ${stat.color} px-2 py-0.5 rounded-full bg-surface`}
                      >
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {(profile?.role === "DOCTOR" || profile?.role === "PATIENT") &&
                recentAppointments.length > 0 && (
                  <section className="bg-surface p-8 rounded-[2.5rem] border border-border shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-xl font-black text-heading">
                        {profile?.role === "DOCTOR"
                          ? "Upcoming Today"
                          : "Your Appointments"}
                      </h4>
                      <Link
                        href="/appointments"
                        className="text-xs font-bold text-brand-primary hover:underline"
                      >
                        View All
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {recentAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="p-6 bg-surface rounded-3xl border border-border hover:border-brand-primary/20 transition-all group"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-brand-primary font-black text-xs border border-border">
                              {(profile?.role === "DOCTOR"
                                ? apt.patient.user.name
                                : apt.doctor.user.name
                              )
                                .split(" ")
                                .map((n: any) => n[0])
                                .join("")}
                            </div>
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest bg-surface px-2 py-1 rounded-lg border border-border">
                              {new Date(apt.scheduledAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                          <h5 className="font-black text-heading mb-1">
                            {profile?.role === "DOCTOR"
                              ? apt.patient.user.name
                              : `Dr. ${apt.doctor.user.name}`}
                          </h5>
                          <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-4">
                            {apt.type.replace("_", " ")}
                          </p>
                          <button
                            onClick={() =>
                              router.push(
                                profile?.role === "DOCTOR"
                                  ? `/patients/${apt.patientId}`
                                  : "/appointments",
                              )
                            }
                            className="w-full py-2 bg-surface border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-brand-primary hover:text-brand-primary transition-all"
                          >
                            {profile?.role === "DOCTOR"
                              ? "Open File"
                              : "View Details"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              {/* Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                {/* Dynamic Actions based on Role */}
                {profile?.role === "ADMIN" && (
                  <div
                    onClick={() => router.push("/admin/users")}
                    className="bg-surface p-8 rounded-[2rem] border border-border hover:border-brand-primary hover:shadow-2xl hover:shadow-brand-primary/5 transition-all cursor-pointer group"
                  >
                    <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/10 transition-colors">
                      <svg
                        className="w-8 h-8 text-muted group-hover:text-brand-primary transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-black text-heading mb-2">
                      User Management
                    </h3>
                    <p className="text-muted text-sm leading-relaxed">
                      Approve doctor accounts and manage system access levels.
                    </p>
                  </div>
                )}

                {profile?.role === "PATIENT" && (
                  <>
                    {[
                      {
                        title: "My Health Profile",
                        desc: "View your complete medical history and bio-data.",
                        link: "/patients/me",
                        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                      },
                      {
                        title: "Find a Doctor",
                        desc: "Search and book available specialists.",
                        link: "/doctors",
                        icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                      },
                      {
                        title: "My Appointments",
                        desc: "View upcoming and past medical visits.",
                        link: "/appointments",
                        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                      },
                      {
                        title: "Smart Triage",
                        desc: "Analyze symptoms using Claude AI.",
                        link: "/triage",
                        icon: "M13 10V3L4 14h7v7l9-11h-7z",
                      },
                      {
                        title: "Vitals Tracker",
                        desc: "Track your health history trends.",
                        link: "/vitals",
                        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                      },
                    ].map((action, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (action.link === "/doctors") {
                            setActiveTab("doctors");
                          } else if (action.link === "/patients/me") {
                            router.push("/patients/me");
                          } else {
                            router.push(action.link);
                          }
                        }}
                        className="bg-surface p-8 rounded-[2rem] border border-border hover:border-brand-primary hover:shadow-2xl hover:shadow-brand-primary/5 transition-all cursor-pointer group"
                      >
                        <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/10 transition-colors">
                          <svg
                            className="w-8 h-8 text-muted group-hover:text-brand-primary transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={action.icon}
                            />
                          </svg>
                        </div>
                        <h3 className="text-xl font-black text-heading mb-2">
                          {action.title}
                        </h3>
                        <p className="text-muted text-sm leading-relaxed">
                          {action.desc}
                        </p>
                      </div>
                    ))}
                  </>
                )}

                {profile?.role === "DOCTOR" && (
                  <>
                    <div
                      onClick={() => router.push("/appointments")}
                      className="bg-surface p-8 rounded-[2rem] border border-border hover:border-brand-primary transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/10 transition-colors">
                        <svg
                          className="w-8 h-8 text-muted group-hover:text-brand-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-black text-heading mb-2">
                        Appointments
                      </h3>
                      <p className="text-muted text-sm">
                        Manage your patient schedule.
                      </p>
                    </div>
                    <div
                      onClick={() => router.push("/patients")}
                      className="bg-surface p-8 rounded-[2rem] border border-border hover:border-brand-primary transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/10 transition-colors">
                        <svg
                          className="w-8 h-8 text-muted group-hover:text-brand-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-black text-heading mb-2">
                        Patient Registry
                      </h3>
                      <p className="text-muted text-sm">
                        Access and manage all patient files.
                      </p>
                    </div>
                    <div
                      onClick={() => router.push("/consultations")}
                      className="bg-surface p-8 rounded-[2rem] border border-border hover:border-brand-primary transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/10 transition-colors">
                        <svg
                          className="w-8 h-8 text-muted group-hover:text-brand-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-black text-heading mb-2">
                        Consultations
                      </h3>
                      <p className="text-muted text-sm">
                        Respond to Rural HO requests.
                      </p>
                    </div>
                  </>
                )}

                {profile?.role === "NURSE" && (
                  <>
                    <div
                      onClick={() => router.push("/vitals/record")}
                      className="bg-surface p-8 rounded-[2rem] border border-border hover:border-brand-primary transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/10 transition-colors">
                        <svg
                          className="w-8 h-8 text-muted group-hover:text-brand-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-black text-heading mb-2">
                        Record Vitals
                      </h3>
                      <p className="text-muted text-sm">
                        Enter signs for home-monitored patients.
                      </p>
                    </div>
                    <div
                      onClick={() => router.push("/vitals")}
                      className="bg-surface p-8 rounded-[2rem] border border-border hover:border-brand-primary transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/10 transition-colors">
                        <svg
                          className="w-8 h-8 text-muted group-hover:text-brand-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 2m6 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-black text-heading mb-2">
                        Vitals History
                      </h3>
                      <p className="text-muted text-sm">
                        View patient records history.
                      </p>
                    </div>
                  </>
                )}
                {profile?.role === "RURAL_HO" && (
                  <>
                    <div
                      onClick={() => router.push("/patients")}
                      className="bg-surface p-8 rounded-[2rem] border border-border hover:border-brand-primary transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/10 transition-colors">
                        <svg
                          className="w-8 h-8 text-muted group-hover:text-brand-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-black text-heading mb-2">
                        Patient Registry
                      </h3>
                      <p className="text-muted text-sm">
                        Manage patients in your designated zone.
                      </p>
                    </div>
                    <div
                      onClick={() => router.push("/vitals/record")}
                      className="bg-surface p-8 rounded-[2rem] border border-border hover:border-brand-primary transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/10 transition-colors">
                        <svg
                          className="w-8 h-8 text-muted group-hover:text-brand-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-black text-heading mb-2">
                        Clinical Vitals
                      </h3>
                      <p className="text-muted text-sm">
                        Perform on-site vitals collection.
                      </p>
                    </div>
                    <div
                      onClick={() => router.push("/consultations")}
                      className="bg-surface p-8 rounded-[2rem] border border-border hover:border-brand-primary transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-primary/10 transition-colors">
                        <svg
                          className="w-8 h-8 text-muted group-hover:text-brand-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-black text-heading mb-2">
                        Expert Consultation
                      </h3>
                      <p className="text-muted text-sm">
                        Request help from city specialists.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Sprint Progress Footer */}
              <div className="bg-brand-primary/10 border border-brand-primary/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center text-on-primary font-black">
                    5
                  </div>
                  <div>
                    <h4 className="font-black text-heading">
                      Current Phase: Sprint 5
                    </h4>
                    <p className="text-sm text-muted font-medium">
                      Unified Dashboard Experience Live
                    </p>
                  </div>
                </div>
                <div className="h-2 flex-1 max-w-md bg-surface/50 rounded-full overflow-hidden mx-8 hidden md:block">
                  <div className="h-full bg-brand-primary w-full rounded-full"></div>
                </div>
                <button className="px-6 py-2 bg-brand-secondary text-on-primary rounded-xl font-bold text-sm hover:bg-brand-secondary transition-colors">
                  View Roadmap
                </button>
              </div>
            </>
          ) : activeTab === "doctors" ? (
            <DoctorsSection />
          ) : activeTab === "appointments" ? (
            <AppointmentsSection />
          ) : activeTab === "vitals" ? (
            <MedicalRecordsSection />
          ) : activeTab === "messages" ? (
            <ConsultationsSection />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center mb-6">
                <svg
                  className="w-10 h-10 text-muted/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 2m6 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-black text-heading mb-2">
                Coming Soon
              </h3>
              <p className="text-muted max-w-xs mx-auto">
                This section is currently under development.
              </p>
              <button
                onClick={() => setActiveTab("overview")}
                className="mt-8 px-6 py-3 bg-brand-primary text-on-primary rounded-xl font-black text-sm hover:scale-105 transition-transform"
              >
                Back to Overview
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
    </Sidebar>
  );
}
