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
        <section className="relative overflow-hidden border-b border-border bg-muted/20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -left-32 bottom-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:py-24 lg:px-8">
            <div className="order-1 text-center lg:text-left lg:pr-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Merit-Based Scholarship Program
              </div>

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem] leading-[1.1]">
                Start Your{" "}
                <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                  Scholarship
                </span>{" "}
                Journey Today
              </h1>

              <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                Unlock up to <strong className="text-foreground font-semibold">$1,600/year</strong> in academic support. 
                Our streamlined platform makes applying simple, transparent, and efficient.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <Button
                  onClick={() => setIsLoginOpen(true)}
                  size="lg"
                  className="gap-2 px-8"
                >
                  Begin Application
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <a
                  href="#how-it-works"
                  className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-8 text-sm font-semibold text-foreground shadow-xs transition-all duration-200 hover:border-primary/40 hover:text-primary"
                >
                  Learn More
                </a>
              </div>

              <div className="mt-12 grid max-w-md mx-auto lg:mx-0 grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card p-6 shadow-xs">
                {[
                  { value: "$1,600", label: "Annual Award" },
                  { value: "150+", label: "Available Slots" },
                  { value: "4 Years", label: "Renewable" },
                ].map((stat) => (
                  <div key={stat.label} className="px-4 text-center">
                    <div className="text-xl font-extrabold text-primary">{stat.value}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-2 relative flex justify-center lg:justify-end lg:pr-10">
              <div className="relative">
                <div className="absolute -inset-x-8 bottom-0 top-4 rounded-t-full bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
                <div className="absolute -inset-x-3 bottom-0 top-10 rounded-t-full border border-primary/15" />
                <div className="absolute -right-14 top-14 h-24 w-24 bg-[radial-gradient(circle,rgba(16,56,107,0.25)_1.5px,transparent_1.5px)] bg-[size:12px_12px]" />
                <div className="absolute -left-12 top-1/3 h-14 w-14 rounded-full border-4 border-primary/15" />

                <Image
                  src="/images/graduate.png"
                  alt="Scholarship graduate"
                  width={460}
                  height={560}
                  priority
                  className="relative z-10 h-[400px] sm:h-[480px] w-auto object-contain drop-shadow-2xl"
                />

                <div className="absolute -left-8 bottom-24 z-20 flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Annual Award</p>
                    <p className="text-lg font-extrabold text-primary">$1,600</p>
                  </div>
                </div>

                <div className="absolute -right-6 top-24 z-20 flex items-center gap-2 rounded-full border border-border bg-card py-2 pl-2.5 pr-4 shadow-lg">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
                    <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-xs font-bold text-foreground">150+ Scholarships</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee Preview */}
        <section className="relative w-full overflow-hidden py-12 border-b border-border bg-muted/30">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <div className="overflow-hidden">
            <div className="flex gap-6 animate-marquee-container w-max hover:[animation-play-state:paused]">
              {[...Array(2)].flatMap((_, gi) =>
                ["/images/portal-1.jpg", "/images/portal-2.jpg", "/images/portal-3.jpg", "/images/portal-4.png", "/images/portal-5.jpg"].map((src, i) => (
                  <div key={`g${gi}-${i}`} className="relative h-56 w-[360px] shrink-0 overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-transform hover:scale-[1.02]">
                    <Image src={src} alt={`Portal preview ${i + 1}`} fill sizes="360px" className="object-cover" />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Application Process</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Five Simple Steps</h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
              From initial registration to final submission, our guided flow ensures you never miss a requirement.
            </p>
          </div>
          
          <div className="relative grid gap-6 sm:grid-cols-5">
            {applicationSteps.map((step, idx) => (
              <div key={step.label} className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold bg-primary/10 text-primary">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{step.label}</div>
                  <div className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{step.desc}</div>
                </div>
                {idx < applicationSteps.length - 1 && (
                  <ChevronRight className="absolute -right-3 top-8 hidden sm:block h-5 w-5 text-muted-foreground/40" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-border bg-muted/20 py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Portal Capabilities</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Everything You Need</h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
                A comprehensive dashboard designed to keep you organized and informed throughout your academic journey.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featureCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="group flex flex-col gap-5 rounded-2xl border border-border bg-card p-7 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/30">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg} ${card.accent} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{card.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Us */}
        <section id="why-us" className="border-t border-border bg-background py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Why ScholarPro</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Built for Students, by Educators</h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
                We prioritize your success and security, removing the friction from traditional scholarship applications.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl text-primary bg-primary/10">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{benefit.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-primary py-24 px-4 sm:px-6 lg:px-8 text-primary-foreground">
          <div className="mx-auto max-w-2xl text-center">
            <GraduationCap className="mx-auto mb-6 h-12 w-12 text-primary-foreground/40" />
            <h2 className="text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">Ready to Secure Your Future?</h2>
            <p className="mx-auto mt-4 max-w-md text-base text-primary-foreground/80 leading-relaxed">
              Join thousands of scholars who have transformed their educational journey. Your path to funding starts here.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => setIsLoginOpen(true)} 
                variant="secondary"
                size="lg"
                className="font-semibold gap-2 shadow-lg"
              >
                Start Your Application <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-xs text-primary-foreground/60 font-semibold uppercase tracking-wider">
              {["No Application Fees", "Secure Data Handling", "Dedicated Support"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-foreground/80" /><span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="ScholarPro" width={120} height={40} className="h-7 w-auto object-contain opacity-75 dark:brightness-110" />
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
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
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={() => setIsLoginOpen(false)} />
          <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl">
              <button 
                onClick={() => setIsLoginOpen(false)} 
                className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="flex flex-col items-center text-center">
                <Image src="/images/logo.png" alt="ScholarPro" width={140} height={44} className="h-auto max-w-[140px] dark:brightness-110" />
                <p className="mt-3 text-sm text-muted-foreground">Student Application Portal</p>
              </div>

              <div className="mt-6 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Passwordless Access</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">Enter your details to seamlessly access or begin your application.</p>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Enter your full name" 
                      className="pl-10" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="you@example.edu" 
                      className="pl-10" 
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="student-confirm" 
                      checked={isStudent} 
                      onCheckedChange={(c) => setIsStudent(c === true)} 
                      className="mt-0.5" 
                    />
                    <label htmlFor="student-confirm" className="cursor-pointer select-none">
                      <span className="block text-sm font-semibold text-foreground">I am a student</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground leading-relaxed">I confirm I am an active scholarship candidate.</span>
                    </label>
                  </div>
                </div>

                <Button 
                  type="button" 
                  onClick={handleAccess} 
                  className="w-full"
                >
                  Enter Portal
                </Button>
                
                <p className="text-center text-xs text-muted-foreground">
                  Already started?{" "}
                  <button 
                    onClick={() => {
                      setIsLoginOpen(false);
                      router.push("/students/application");
                    }} 
                    className="font-semibold text-primary hover:underline cursor-pointer"
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