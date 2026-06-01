"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { UserButton, useUser } from "@clerk/nextjs";
import { Bell, Menu } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NavLinks = ({
  role,
  mobile = false,
}: {
  role: string;
  mobile?: boolean;
}) => {
  const links = useMemo(() => {
    const items = [
      { label: "Patients", href: "/patients" },
      { label: "Appointments", href: "/appointments" },
      { label: "Prescriptions", href: "/prescriptions" },
      { label: "Lab Results", href: "/lab" },
    ];
    if (role === "ADMIN") {
      items.push(
        { label: "Users", href: "/admin/users" },
        { label: "Hospitals", href: "/admin/hospitals" },
        { label: "Audit Logs", href: "/admin/audit-logs" },
      );
    }
    if (role === "NURSE" || role === "DOCTOR") {
      items.unshift({ label: "Triage", href: "/triage" });
    }
    return items;
  }, [role]);

  return (
    <nav
      className={
        mobile
          ? "flex flex-col gap-4 mt-8"
          : "hidden md:flex items-center gap-6"
      }
    >
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
};

export function AppNav({ role }: { role: string }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => setMounted(true), []);

  const showRoleBadge = mounted && isLoaded && isSignedIn && role;

  return (
    <header className="h-14 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-50">
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            {mounted ? (
              <Image
                src={
                  resolvedTheme === "dark"
                    ? "/logo_dark.svg"
                    : "/logo_light.svg"
                }
                alt="FMC Logo"
                width={120}
                height={32}
                className="h-8 w-auto transition-transform duration-500"
                priority
              />
            ) : (
              <div className="h-8 w-[120px]" />
            )}
          </Link>
          <Separator orientation="vertical" className="h-6" />
          {showRoleBadge ? (
            <Badge
              variant="outline"
              className="text-[10px] font-black tracking-widest bg-muted/50 border-border"
            >
              {role}
            </Badge>
          ) : (
            <Skeleton className="h-5 w-16" />
          )}
          {role ? <NavLinks role={role} /> : <div className="hidden md:block w-64 h-4" />}
        </div>

        <div className="flex items-center gap-4">
          <Bell className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
          <AnimatedThemeToggler />
          <UserButton />

          {role ? (
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Menu className="h-5 w-5" />
                    </Button>
                  }
                />
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <NavLinks role={role} mobile />
                </SheetContent>
              </Sheet>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
