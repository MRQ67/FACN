"use client";

import { useRouter } from "next/navigation";
import {
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
  useUser,
  useClerk,
} from "@clerk/nextjs";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  Marquee,
  MarqueeContent,
  MarqueeFade,
  MarqueeItem,
} from "@/components/kibo-ui/marquee";
import { HoverExpand_001 } from "@/components/ui/skiper-ui/skiper52";
import { HoverExpand_002 } from "@/components/ui/skiper-ui/skiper53";
import { CTASection } from "@/components/ui/hero-dithering-card";
import { FooterReveal } from "@/components/footer-reveal";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { Device } from "@/components/device";
import Image from "next/image";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { CosmicButton } from "@/components/ui/cosmic-button";

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const integratedCareItems = [
    { src: "/core/AI.jpg", alt: "AI Triage", code: "# 01" },
    {
      src: "/core/doctor-consult.jpg",
      alt: "Doctor Consultations",
      code: "# 02",
    },
    { src: "/core/vital.jpg", alt: "Vitals Monitoring", code: "# 03" },
    { src: "/core/lab-result.jpg", alt: "Lab Results", code: "# 04" },
    { src: "/core/E-prescrption.jpg", alt: "E-Prescriptions", code: "# 05" },
  ];

  return (
    <div className="min-h-screen selection:bg-brand-primary/20">
      <div className="relative z-10 bg-brand-base shadow-2xl">
        {/* Premium Navigation */}
        <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
            <div
              className="flex items-center space-x-4 group cursor-pointer"
              onClick={() => router.push("/")}
            >
              {mounted ? (
                <Image
                  src={
                    resolvedTheme === "dark"
                      ? "/logo_dark.svg"
                      : "/logo_light.svg"
                  }
                  alt="FMC Logo"
                  width={200}
                  height={48}
                  className="h-12 w-auto group-hover:scale-105 transition-transform duration-500"
                  priority
                />
              ) : (
                <div className="h-12 w-[160px]" />
              )}
            </div>

            <div className="hidden lg:flex items-center space-x-10">
              <button
                onClick={() => router.push("/doctors/available")}
                className="text-xs font-black text-muted hover:text-heading uppercase tracking-widest transition-colors"
              >
                Find a Doctor
              </button>
              {["Services", "About"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-xs font-black text-muted hover:text-heading uppercase tracking-widest transition-colors"
                >
                  {item}
                </a>
              ))}
              <div className="h-8 w-px bg-surface mx-2"></div>
              <AnimatedThemeToggler />
              <Show when="signed-in">
                <div className="flex items-center gap-4">
                  <CosmicButton
                    as="button"
                    onClick={() => router.push("/dashboard")}
                  >
                    Go to Dashboard
                  </CosmicButton>
                  <UserButton />
                </div>
              </Show>
              <Show when="signed-out">
                <div className="flex items-center gap-4">
                  <CosmicButton
                    as="button"
                    onClick={() => router.push("/sign-in")}
                  >
                    Get Started
                  </CosmicButton>
                  <UserButton />
                </div>
              </Show>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-20 pb-40 overflow-hidden bg-brand-base">
          <div className="absolute top-0 right-0 -z-10 w-2/3 h-full opacity-5 mesh-gradient blur-3xl rounded-full translate-x-1/4 -translate-y-1/4"></div>

          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-24">
              <div className="flex-1 space-y-10">
                <h1 className="text-6xl md:text-8xl font-black text-heading leading-[0.9] tracking-tighter">
                  Excellence in <br />
                  <span className="text-gradient">Medical Care.</span>
                </h1>
                <p className="text-xl text-muted font-medium leading-relaxed max-w-xl">
                  A state-of-the-art clinical infrastructure providing
                  comprehensive care for our community through advanced
                  digitalization.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 pt-6">
                  <button
                    onClick={() =>
                      router.push("/dashboard")
                    }
                    className="px-12 py-5 bg-zinc-800 dark:bg-zinc-900 text-white font-black rounded-2xl text-lg hover:bg-zinc-900 dark:hover:bg-black transition-all flex items-center gap-4 group shadow-xl"
                  >
                    Access Patient Portal
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      router.push("/dashboard")
                    }
                    className="px-12 py-5 bg-surface text-heading border-2 border-border font-black rounded-2xl text-lg hover:border-brand-primary hover:text-brand-primary transition-all shadow-md"
                  >
                    Staff Access
                  </button>
                </div>
              </div>

              <div className="flex-1 relative">
                <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(135,69,62,0.12)] border-[16px] border-white">
                  <img
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200"
                    alt="Professional Medical Care"
                    className="w-full h-[600px] object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sponsors Section */}
        <section className="py-12 bg-brand-base overflow-hidden border-y border-border/50">
          <div className="w-full mx-auto max-w-[100vw]">
            <p className="text-center text-[10px] font-black text-muted uppercase tracking-[0.4em] mb-10">
              Trusted & Supported By
            </p>
            <Marquee>
              <MarqueeFade side="left" className="from-brand-base" />
              <MarqueeContent>
                {[
                  "Dire Dawa University",
                  "Dire Dawa Health Bureau",
                  "Ethiopian Ministry of Health",
                  "Dil Chora Referral Hospital",
                  "Sabian Health Center",
                  "Harar Health Sciences College",
                  "Rift Valley University",
                ].map((name, i) => (
                  <MarqueeItem key={i} className="mx-4 md:mx-6">
                    <div className="flex items-center justify-center px-8 py-4 border border-border rounded-[2rem] bg-surface shadow-sm hover:border-brand-primary/30 hover:shadow-brand-primary/5 transition-all duration-300">
                      {/* logo will go here */}
                      <span className="text-sm font-black text-heading whitespace-nowrap">
                        {name}
                      </span>
                    </div>
                  </MarqueeItem>
                ))}
              </MarqueeContent>
              <MarqueeFade side="right" className="from-brand-base" />
            </Marquee>
          </div>
        </section>

        {/* Network Ecosystem Section */}
        <section id="network" className="py-32 bg-surface">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-24 space-y-4">
              <h2 className="text-brand-primary font-black tracking-[0.3em] uppercase text-xs">
                Our Ecosystem
              </h2>
              <p className="text-5xl md:text-6xl font-black text-heading tracking-tighter leading-none">
                Integrated Care.
              </p>
              <p className="text-muted font-medium max-w-2xl mx-auto text-lg pt-4">
                Connecting all departments and specialists into one
                high-performance digital infrastructure.
              </p>
            </div>

            <div className="hidden md:flex justify-center w-full">
              <HoverExpand_001 images={integratedCareItems} />
            </div>
            <div className="block md:hidden w-full overflow-hidden">
              <HoverExpand_002 images={integratedCareItems} />
            </div>
          </div>
        </section>

        {/* Clinical Workflow Section */}
        <section className="py-32 bg-surface relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-20">
              <div className="flex-1 space-y-8">
                <h2 className="text-4xl md:text-5xl font-black text-heading tracking-tighter leading-tight">
                  How the System <br />
                  <span className="text-brand-primary">Saves Lives.</span>
                </h2>
                <div className="space-y-12 pt-8">
                  {[
                    {
                      step: "01",
                      title: "Clinical Triage",
                      desc: "Patient visits our facility. Staff records symptoms and vitals on the FMC clinical interface.",
                    },
                    {
                      step: "02",
                      title: "AI Analysis",
                      desc: "Claude 3.5 AI instantly analyzes the data, providing a risk score and triage level (Normal/Warning/Critical).",
                    },
                    {
                      step: "03",
                      title: "Instant Sync",
                      desc: "Data is synced to our central registry, alerting relevant specialists within the institution.",
                    },
                    {
                      step: "04",
                      title: "Specialist Review",
                      desc: "Doctors review the high-fidelity vitals history and provide immediate consultation or referral.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-8 group">
                      <div className="text-4xl font-black text-muted/60 group-hover:text-brand-primary/20 transition-colors">
                        {item.step}
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-black text-heading">
                          {item.title}
                        </p>
                        <p className="text-sm font-medium text-muted leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <div className="relative rounded-[4rem] overflow-hidden shadow-2xl shadow-brand-secondary/10 border-[12px] border-white">
                  <img
                    src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&q=80&w=1000"
                    alt="Specialist Consulting"
                    className="w-full h-[700px] object-cover"
                  />
                  <div className="absolute top-12 right-12 bg-surface/90 backdrop-blur-md p-6 rounded-3xl border border-white shadow-xl max-w-[240px]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 rounded-full bg-brand-secondary animate-pulse"></div>
                      <span className="text-[10px] font-black text-heading uppercase tracking-widest">
                        Clinical Alert
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-muted leading-relaxed">
                      System flagged abnormal heart rate for Patient #829.
                      Immediate review requested.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Background Accent */}
          <div className="absolute top-1/2 left-0 w-1/3 h-full bg-brand-primary/5 -translate-y-1/2 blur-[120px] rounded-full"></div>
        </section>

        {/* Feature Showcase */}
        <section id="services" className="py-32 bg-brand-base">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
              <div className="space-y-4">
                <h2 className="text-brand-primary font-black tracking-[0.3em] uppercase text-xs">
                  Clinical Ecosystem
                </h2>
                <p className="text-5xl md:text-6xl font-black text-heading tracking-tight">
                  System Core Modules.
                </p>
              </div>
              <p className="text-muted font-medium max-w-sm">
                Proprietary technology developed specifically for the unique
                challenges of modern healthcare delivery.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              {/* Intelligent Triage - Featured Module */}
              <div className="group transition-all duration-500">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Left Column: Device Mockup */}
                  <div className="w-full md:w-auto flex justify-center shrink-0">
                    <Device
                      variant="iphone"
                      src="/core/AI.jpg"
                      className="w-[140px] md:w-[160px] h-auto drop-shadow-xl relative z-10 transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Right Column: Content */}
                  <div className="flex-1 space-y-6">
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-brand-primary tracking-[0.3em] uppercase">
                        Intelligent Triage
                      </span>
                      <h3 className="text-2xl md:text-3xl font-black text-heading leading-tight tracking-tight">
                        AI-Powered Clinical <br />
                        Decision Support
                      </h3>
                      <p className="text-sm text-muted font-medium leading-relaxed">
                        Our triage engine uses Claude AI to analyze patient
                        symptoms and flag critical cases for immediate review.
                      </p>
                    </div>

                    <ul className="space-y-3">
                      {[
                        "Symptom analysis in seconds",
                        "Severity classification",
                        "Automatic escalation",
                      ].map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-3 group/item"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary"></div>
                          <span className="text-xs font-bold text-heading">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {[
                {
                  title: "Unified Patient Registry",
                  desc: "A single source of truth for every patient. Medical history, chronic conditions, and vital trends are instantly accessible by authorized personnel within the institution.",
                  icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
                  color: "text-brand-primary bg-brand-primary/10",
                  img: "/core/lab-result.jpg",
                },
              ].map((service, i) => (
                <div key={i} className="group transition-all duration-500">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-full md:w-auto flex justify-center shrink-0">
                      <Device
                        variant="ipad"
                        src={service.img}
                        className="w-[180px] md:w-[200px] h-auto drop-shadow-xl relative z-10 transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex-1 space-y-6">
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-brand-primary tracking-[0.3em] uppercase">
                          Cloud Registry
                        </span>
                        <h3 className="text-2xl md:text-3xl font-black text-heading leading-tight tracking-tight">
                          {service.title}
                        </h3>
                        <p className="text-sm text-muted font-medium leading-relaxed">
                          {service.desc}
                        </p>
                      </div>
                      <div className="pt-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-brand-primary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d={service.icon}
                              />
                            </svg>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-heading">
                            Institutional Standard
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <CTASection />
      </div>

      {/* Comprehensive Footer */}
      <FooterReveal height="min-h-[800px] md:min-h-[600px]">
        <footer className="pt-32 pb-16 bg-surface border-t border-border h-full flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
              <div className="space-y-8">
                <div className="flex items-center space-x-4">
                  {mounted ? (
                    <Image
                      src={
                        resolvedTheme === "dark"
                          ? "/logo_dark.svg"
                          : "/logo_light.svg"
                      }
                      alt="FMC Logo"
                      width={200}
                      height={48}
                      className="h-12 w-auto"
                      priority
                    />
                  ) : (
                    <div className="h-12 w-[160px]" />
                  )}
                </div>
                <p className="text-muted font-medium text-sm leading-relaxed">
                  Foundation Medical Center (FMC) is a digital healthcare
                  initiative to modernize clinical infrastructure through
                  high-fidelity monitoring and AI-assisted triage.
                </p>
                <div className="flex gap-4">
                  {["twitter", "linkedin", "facebook"].map((social) => (
                    <div
                      key={social}
                      className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted hover:text-brand-primary cursor-pointer transition-colors shadow-sm"
                    >
                      <span className="sr-only">{social}</span>
                      <div className="w-4 h-4 bg-current rounded-sm"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <h4 className="text-[10px] font-black text-heading uppercase tracking-[0.3em]">
                  Portal Access
                </h4>
                <ul className="space-y-4">
                  {[
                    { label: "Patient Registry", link: "/login" },
                    { label: "Specialist Directory", link: "/login" },
                    { label: "Clinical Portal", link: "/login" },
                    { label: "Triage Analytics", link: "/login" },
                    { label: "Internal Support", link: "/login" },
                  ].map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => router.push(link.link)}
                        className="text-sm font-bold text-muted hover:text-brand-primary transition-colors text-left"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-8">
                <h4 className="text-[10px] font-black text-heading uppercase tracking-[0.3em]">
                  Institutional
                </h4>
                <ul className="space-y-4">
                  {[
                    "About the Center",
                    "Medical Board",
                    "Health Authority",
                    "Clinical Research",
                    "Technical Specs",
                  ].map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm font-bold text-muted hover:text-brand-primary transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-8">
                <h4 className="text-[10px] font-black text-heading uppercase tracking-[0.3em]">
                  System Support
                </h4>
                <div className="p-6 bg-brand-base rounded-3xl border border-border shadow-sm">
                  <p className="text-xs font-bold text-heading mb-4">
                    Operational Status
                  </p>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">
                      All Systems Operational
                    </span>
                  </div>
                  <button className="w-full py-3 bg-surface border border-border text-[10px] font-black text-heading uppercase tracking-widest rounded-xl hover:border-brand-primary transition-all shadow-sm">
                    Support Desk
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="text-xs font-bold text-muted uppercase tracking-widest">
                  &copy; {new Date().getFullYear()} FMC Institutional Portal
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-surface"></div>
                <div className="text-xs font-bold text-muted uppercase tracking-widest">
                  Global Healthcare Excellence
                </div>
              </div>
              <div className="flex gap-10 text-[10px] font-black text-muted uppercase tracking-widest">
                <a href="#" className="hover:text-heading transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-heading transition-colors">
                  Terms
                </a>
                <a href="#" className="hover:text-heading transition-colors">
                  Security
                </a>
              </div>
            </div>
          </div>
        </footer>
      </FooterReveal>
    </div>
  );
}
