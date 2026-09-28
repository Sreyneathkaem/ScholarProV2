"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  Mail,
  Shield,
  Sparkles,
  Trophy,
  User,
  Users,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  saveStudentPortalSnapshot,
  loadStudentPortalSnapshot,
  formatNameFromEmail,
} from "@/lib/utils/student-portal";
import { ThemeToggle } from "@/components/theme-toggle";

const applicationSteps = [
  { label: "Personal Info", desc: "Basic identity and contact details" },
  { label: "Guardians", desc: "Parent or guardian credentials" },
  { label: "Education", desc: "Academic records and transcripts" },
  { label: "Program", desc: "Major and scholarship preferences" },
  { label: "Review", desc: "Final preview and submission" },
];

const featureCards = [
  { 
    title: "Smart Scheduling", 
    description: "Never miss an interview or exam with integrated calendar views and automated reminders.", 
    icon: CalendarDays, 
    accent: "text-blue-600 dark:text-blue-400", 
    bg: "bg-blue-50 dark:bg-blue-950/40" 
  },
  { 
    title: "Live Status Tracking", 
    description: "Monitor your application's progress through each review stage with clear, real-time updates.", 
    icon: CheckCircle2, 
    accent: "text-emerald-600 dark:text-emerald-400", 
    bg: "bg-emerald-50 dark:bg-emerald-950/40" 
  },
  { 
    title: "Centralized Documents", 
    description: "Upload, manage, and verify all required academic and personal files in one secure vault.", 
    icon: FileText, 
    accent: "text-amber-600 dark:text-amber-400", 
    bg: "bg-amber-50 dark:bg-amber-950/40" 
  },
  { 
    title: "Direct Communication", 
    description: "Receive official evaluation results and communicate directly with the admissions committee.", 
    icon: Mail, 
    accent: "text-indigo-600 dark:text-indigo-400", 
    bg: "bg-indigo-50 dark:bg-indigo-950/40" 
  },
];

const benefits = [
  { 
    icon: Shield, 
    title: "Enterprise-Grade Security", 
    description: "Your personal and academic data is protected with end-to-end encryption and strict privacy controls." 
  },
  { 
    icon: Clock, 
    title: "Streamlined Process", 
    description: "Our guided, intuitive flow ensures you can complete your entire submission efficiently without friction." 
  },
  { 
    icon: Users, 
    title: "Dedicated Support", 
    description: "Access prompt, human assistance from our specialized admissions support team whenever you need it." 
  },
];

export default function StudentLandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isStudent, setIsStudent] = useState(true);
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = isLoginOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isLoginOpen]);

  const handleAccess = () => {
    const trimmedEmail = email.trim();
    let trimmedName = fullName.trim();
    
    if (!trimmedEmail) {
      toast.error("Please enter your email address");
      return;
    }
    if (!trimmedName) {
      trimmedName = formatNameFromEmail(trimmedEmail);
    }
    if (!isStudent) {
      toast.error("Please confirm that you are a student");
      return;
    }

    const studentUser = {
      id: `student-${trimmedEmail}`,
      name: trimmedName,
      email: trimmedEmail,
      role: "student" as const,
    };

    sessionStorage.setItem("studentAccessToken", `student:${trimmedEmail}`);
    sessionStorage.setItem("studentUser", JSON.stringify(studentUser));

    // Update in-memory Zustand store first so getActiveStudentEmail finds it
    useAuthStore.getState().setAccessToken(`student:${trimmedEmail}`);
    useAuthStore.getState().setUser(studentUser);

    // Check if user already has saved form data; if not, initialize profile
    const existing = loadStudentPortalSnapshot(trimmedEmail);
    if (!existing.applicationData) {
      saveStudentPortalSnapshot(
        {
          profile: {
            name: trimmedName,
            email: trimmedEmail,
            phone: "—",
            studentId: existing.profile.studentId || "APP-001",
          },
        },
        trimmedEmail,
      );
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("student-profile-updated"));
      window.dispatchEvent(new Event("student-portal-updated"));
    }

    toast.success("Welcome to the ScholarPro Student Portal");
    router.push("/students/application");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/students" className="inline-flex items-center gap-2">
            <Image src="/images/logo.png" alt="ScholarPro" width={140} height={44} priority className="h-8 w-auto object-contain dark:brightness-110" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-primary transition-colors">Process</a>
            <a href="#features" className="hover:text-primary transition-colors">Portal Features</a>
            <a href="#why-us" className="hover:text-primary transition-colors">Why ScholarPro</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              onClick={() => setIsLoginOpen(true)} 
              size="sm"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/80 bg-background">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -left-32 bottom-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:py-24 lg:px-8">
            <div className="order-1 text-center lg:text-left lg:pr-8">
              <div className="inline-flex items-center gap-2 rounded-[4px] border border-[#b8d4f6] bg-[#edf4fc] px-3 py-1 text-xs font-normal text-[#0F386C] dark:bg-[#0f2238] dark:text-[#5a9be6] dark:border-[#1e3f66]">
                <Sparkles className="h-3.5 w-3.5" />
                Merit-Based Scholarship Program
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.2rem] leading-[1.15]">
                Start Your{" "}
                <span className="text-primary">
                  Scholarship
                </span>{" "}
                Journey Today
              </h1>

              <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                Unlock up to <strong className="text-foreground font-semibold">$1,600/year</strong> in academic support. 
                Our streamlined platform makes applying simple, transparent, and efficient.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Button
                  onClick={() => setIsLoginOpen(true)}
                  size="lg"
                  className="gap-2 px-6"
                >
                  Begin Application
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <a
                  href="#how-it-works"
                  className="inline-flex h-10 items-center rounded-[6px] border border-border/80 bg-card px-6 text-sm font-medium text-foreground shadow-[0_2px_0_rgba(0,0,0,0.02)] transition-all duration-200 hover:border-primary hover:text-primary"
                >
                  Learn More
                </a>
              </div>

              <div className="mt-10 grid max-w-md mx-auto lg:mx-0 grid-cols-3 divide-x divide-border/80 rounded-lg border border-border/80 bg-card p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
                {[
                  { value: "$1,600", label: "Annual Award" },
                  { value: "150+", label: "Available Slots" },
                  { value: "4 Years", label: "Renewable" },
                ].map((stat) => (
                  <div key={stat.label} className="px-3 text-center">
                    <div className="text-xl font-bold text-primary tracking-tight">{stat.value}</div>
                    <div className="mt-1 text-[11px] font-normal text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-2 relative flex justify-center lg:justify-end lg:pr-10">
              <div className="relative">
                <div className="absolute -inset-x-8 bottom-0 top-4 rounded-t-full bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
                <div className="absolute -inset-x-3 bottom-0 top-10 rounded-t-full border border-primary/15" />
                <div className="absolute -right-14 top-14 h-24 w-24 bg-[radial-gradient(circle,rgba(15,56,108,0.25)_1.5px,transparent_1.5px)] bg-[size:12px_12px]" />
                <div className="absolute -left-12 top-1/3 h-14 w-14 rounded-full border-4 border-primary/15" />

                <Image
                  src="/images/graduate.png"
                  alt="Scholarship graduate"
                  width={460}
                  height={560}
                  priority
                  className="relative z-10 h-[380px] sm:h-[460px] w-auto object-contain drop-shadow-xl"
                />

                <div className="absolute -left-6 bottom-20 z-20 flex items-center gap-3 rounded-lg border border-border/80 bg-card px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#edf4fc] text-[#0F386C] dark:bg-[#0f2238] dark:text-[#5a9be6]">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-normal">Annual Award</p>
                    <p className="text-base font-bold text-primary tracking-tight">$1,600</p>
                  </div>
                </div>

                <div className="absolute -right-4 top-20 z-20 flex items-center gap-2 rounded-lg border border-border/80 bg-card py-1.5 pl-2 pr-3 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                  <div className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-[#fffbe6] text-[#faad14] dark:bg-[#2b2111] dark:text-[#d89614]">
                    <Trophy className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">150+ Scholarships</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee Preview */}
        <section className="relative w-full overflow-hidden py-10 border-b border-border/80 bg-muted/30">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <div className="overflow-hidden">
            <div className="flex gap-5 animate-marquee-container w-max hover:[animation-play-state:paused]">
              {[...Array(2)].flatMap((_, gi) =>
                ["/images/portal-1.jpg", "/images/portal-2.jpg", "/images/portal-3.jpg", "/images/portal-4.png", "/images/portal-5.jpg"].map((src, i) => (
                  <div key={`g${gi}-${i}`} className="relative h-52 w-[340px] shrink-0 overflow-hidden rounded-lg border border-border/80 bg-card shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] transition-transform hover:scale-[1.01]">
                    <Image src={src} alt={`Portal preview ${i + 1}`} fill sizes="340px" className="object-cover" />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="text-xs font-medium text-primary">Application Process</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Five Simple Steps</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
              From initial registration to final submission, our guided flow ensures you never miss a requirement.
            </p>
          </div>
          
          <div className="relative grid gap-4 sm:grid-cols-5">
            {applicationSteps.map((step, idx) => (
              <div key={step.label} className="group relative flex flex-col gap-3 rounded-lg border border-border/80 bg-card p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                <div className="flex h-8 w-8 items-center justify-center rounded-[6px] text-xs font-semibold bg-[#edf4fc] text-[#0F386C] dark:bg-[#0f2238] dark:text-[#5a9be6]">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{step.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{step.desc}</div>
                </div>
                {idx < applicationSteps.length - 1 && (
                  <ChevronRight className="absolute -right-2.5 top-6 hidden sm:block h-4 w-4 text-muted-foreground/40" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-border/80 bg-muted/20 py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <p className="text-xs font-medium text-primary">Portal Capabilities</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Everything You Need</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
                A comprehensive dashboard designed to keep you organized and informed throughout your academic journey.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featureCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="group flex flex-col gap-4 rounded-lg border border-border/80 bg-card p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-primary">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-[#edf4fc] text-[#0F386C] dark:bg-[#0f2238] dark:text-[#5a9be6]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{card.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Us */}
        <section id="why-us" className="border-t border-border/80 bg-background py-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <p className="text-xs font-medium text-primary">Why ScholarPro</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Built for Students, by Educators</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">
                We prioritize your success and security, removing the friction from traditional scholarship applications.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex flex-col gap-4 rounded-lg border border-border/80 bg-card p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[6px] text-primary bg-[#edf4fc] dark:bg-[#0f2238] dark:text-[#5a9be6]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{benefit.title}</h3>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/80 bg-primary py-20 px-4 sm:px-6 lg:px-8 text-primary-foreground">
          <div className="mx-auto max-w-2xl text-center">
            <GraduationCap className="mx-auto mb-4 h-10 w-10 text-primary-foreground/70" />
            <h2 className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">Ready to Secure Your Future?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-primary-foreground/80 leading-relaxed">
              Join thousands of scholars who have transformed their educational journey. Your path to funding starts here.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button 
                onClick={() => setIsLoginOpen(true)} 
                variant="secondary"
                size="lg"
                className="font-medium gap-2 shadow-sm text-foreground bg-white hover:bg-slate-100"
              >
                Start Your Application <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-primary-foreground/75 font-normal">
              {["No Application Fees", "Secure Data Handling", "Dedicated Support"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground/90" /><span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-background py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="ScholarPro" width={120} height={40} className="h-7 w-auto object-contain opacity-75 dark:brightness-110" />
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ScholarPro. All rights reserved.</p>
        </div>
      </footer>

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={() => setIsLoginOpen(false)} />
          <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-lg border border-border/80 bg-card p-7 shadow-[0_6px_16px_0_rgba(0,0,0,0.08),0_3px_6px_-4px_rgba(0,0,0,0.12),0_9px_28px_8px_rgba(0,0,0,0.05)]">
              <button 
                onClick={() => setIsLoginOpen(false)} 
                className="absolute right-3.5 top-3.5 rounded-[4px] p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="flex flex-col items-center text-center">
                <Image src="/images/logo.png" alt="ScholarPro" width={140} height={44} className="h-auto max-w-[140px] dark:brightness-110" />
                <p className="mt-2 text-xs text-muted-foreground">Student Application Portal</p>
              </div>

              <div className="mt-5 rounded-[6px] bg-[#edf4fc] border border-[#b8d4f6] dark:bg-[#0f2238] dark:border-[#1e3f66] px-3.5 py-2.5 text-center">
                <p className="text-[11px] font-semibold text-[#0F386C] dark:text-[#5a9be6]">Quick Portal Access</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">Enter your credentials to access your candidate application.</p>
              </div>

              <div className="mt-5 space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Full Name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Enter your full name" 
                      className="pl-9 h-9 text-sm" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="you@example.edu" 
                      className="pl-9 h-9 text-sm" 
                    />
                  </div>
                </div>

                <div className="rounded-[6px] border border-border/80 bg-muted/40 p-3">
                  <div className="flex items-start gap-2.5">
                    <Checkbox 
                      id="student-confirm" 
                      checked={isStudent} 
                      onCheckedChange={(c) => setIsStudent(c === true)} 
                      className="mt-0.5" 
                    />
                    <label htmlFor="student-confirm" className="cursor-pointer select-none">
                      <span className="block text-xs font-medium text-foreground">I am a student</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground leading-relaxed">I confirm I am an active scholarship candidate.</span>
                    </label>
                  </div>
                </div>

                <Button 
                  type="button" 
                  onClick={handleAccess} 
                  className="w-full h-9 text-sm"
                >
                  Enter Portal
                </Button>
                
                <p className="text-center text-xs text-muted-foreground pt-1">
                  Already started?{" "}
                  <button 
                    onClick={() => {
                      setIsLoginOpen(false);
                      router.push("/students/application");
                    }} 
                    className="font-medium text-primary hover:underline cursor-pointer"
                  >
                    Continue application
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}