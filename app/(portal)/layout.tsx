"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppNav } from "@/components/app-nav";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = useQuery(api.users.getMe);
  const role = profile?.role ?? "";

  return (
    <div className="min-h-screen bg-background selection:bg-brand-primary/10">
      <AppNav role={role} />
      {children}
    </div>
  );
}
