"use client";

import { useEffect, useState, useRef } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  MapPin,
  MoreVertical,
  Share2,
  Star,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  loadStudentPortalSnapshot,
  type StudentPortalSnapshot,
} from "@/lib/utils/student-portal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SessionType = "interview" | "exam";

interface Session {
  id: string;
  type: SessionType;
  title: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  note: string | null;
  confirmed: boolean;
}

const MOCK_SESSIONS: Session[] = [
  {
    id: "INT-001",
    type: "interview",
    title: "Scholarship Interview",
    date: "Monday, August 4, 2025",
    time: "09:30 AM",
    duration: "30 min",
    location: "Room 204, Admin Building",
    note: "Interviewer: Dr. Sopha Meng",
    confirmed: true,
  },
  {
    id: "EXM-002",
    type: "exam",
    title: "Mathematics Examination",
    date: "Thursday, August 7, 2025",
    time: "08:00 AM",
    duration: "2 hours",
    location: "Exam Hall A, Block C",
    note: null,
    confirmed: true,
  },
  {
    id: "EXM-003",
    type: "exam",
    title: "English Proficiency Exam",
    date: "Thursday, August 7, 2025",
    time: "01:00 PM",
    duration: "1.5 hours",
    location: "Exam Hall A, Block C",
    note: null,
    confirmed: true,
  },
];

const TYPE_CONFIG: Record<
  SessionType,
  {
    icon: LucideIcon;
    label: string;
    badgeVariant: "warning" | "info";
    iconBg: string;
  }
> = {
  interview: {
    icon: Star,
    label: "Interview",
    badgeVariant: "warning",
    iconBg: "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
  },
  exam: {
    icon: ClipboardList,
    label: "Examination",
    badgeVariant: "info",
    iconBg: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-blue-300 dark:border-blue-800/60",
  },
};

const SESSIONS_BY_DATE: { date: string; sessions: Session[] }[] = (() => {
  const groups: { date: string; sessions: Session[] }[] = [];
  for (const session of MOCK_SESSIONS) {
    const existing = groups.find((g) => g.date === session.date);
    if (existing) existing.sessions.push(session);
    else groups.push({ date: session.date, sessions: [session] });
  }
  return groups;
})();

const parseDateTime = (dateStr: string, timeStr: string): Date => {
  const date = new Date(dateStr);
  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    date.setHours(hours, minutes, 0, 0);
  }
  return date;
};

const addToGoogleCalendar = (session: Session) => {
  const startDate = parseDateTime(session.date, session.time);
  const durationMatch = session.duration.match(/(\d+(?:\.\d+)?)\s*(hour|min)/i);
  let durationMinutes = 60;
  if (durationMatch) {
    const value = parseFloat(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    durationMinutes = unit === "hour" ? value * 60 : value;
  }
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", `${session.title} (${session.id})`);
  url.searchParams.set(
    "dates",
    `${formatDate(startDate)}/${formatDate(endDate)}`,
  );
  url.searchParams.set(
    "details",
    session.note ||
      `Session ID: ${session.id}\nType: ${session.type}\nDuration: ${session.duration}`,
  );
  url.searchParams.set("location", session.location);
  url.searchParams.set("trp", "false");

  window.open(url.toString(), "_blank");
  toast.success("Opening Google Calendar to add event");
};

const addAllToGoogleCalendar = () => {
  let added = 0;
  MOCK_SESSIONS.forEach((session, index) => {
    setTimeout(() => {
      addToGoogleCalendar(session);
      added++;
      if (added === MOCK_SESSIONS.length) {
        toast.success(`Opened ${added} events in Google Calendar`, {
          description: "Please allow pop-ups to add all events",
        });
      }
    }, index * 300);
  });
};

const exportAllToGoogleCalendar = () => {
  toast.info("Google Calendar Integration", {
    description:
      "Opening events one by one. Please allow pop-ups for the best experience.",
    duration: 4000,
  });
  setTimeout(() => {
    addAllToGoogleCalendar();
  }, 1000);
};

const shareSession = (session: Session) => {
  const shareData = {
    title: session.title,
    text: `${session.title}\nDate: ${session.date}\nTime: ${session.time}\nLocation: ${session.location}\n${session.note || ""}`,
  };

  if (navigator.share) {
    navigator.share(shareData).catch(() => {
      navigator.clipboard.writeText(shareData.text);
      toast.success("Session details copied to clipboard");
    });
  } else {
    navigator.clipboard.writeText(shareData.text);
    toast.success("Session details copied to clipboard");
  }
};

const requestReschedule = (session: Session) => {
  toast.info("Reschedule Request", {
    description: `To reschedule ${session.title}, please contact the examination office at admissions@camtech.edu.kh or call 078 21 21 81.`,
    duration: 6000,
    action: {
      label: "Copy Email",
      onClick: () => {
        navigator.clipboard.writeText("admissions@camtech.edu.kh");
        toast.success("Email copied to clipboard");
      },
    },
  });
};

interface DropdownMenuProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
}

function DropdownMenu({ session, isOpen, onClose }: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-10 z-20 w-64 rounded-lg border border-border/80 bg-card py-1.5 shadow-md focus:outline-none"
    >
      <button
        onClick={() => {
          addToGoogleCalendar(session);
          onClose();
        }}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Add to Google Calendar
          </p>
          <p className="text-xs text-muted-foreground">Open in Google Calendar</p>
        </div>
      </button>

      <div className="my-1.5 border-t border-border" />

      <button
        onClick={() => {
          shareSession(session);
          onClose();
        }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <Share2 className="h-4 w-4 text-primary" />
        <span className="font-medium">Share Session</span>
      </button>

      <button
        onClick={() => {
          requestReschedule(session);
          onClose();
        }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Request Reschedule</span>
      </button>
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  const config = TYPE_CONFIG[session.type];
  const Icon = config.icon;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative rounded-lg border border-border/80 bg-card p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] transition-all duration-200 hover:shadow-md hover:border-primary/50 print:border print:shadow-none">
      {/* Top row: type badge + menu */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-lg border ${config.iconBg}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={config.badgeVariant}>
                {config.label}
              </Badge>
              {session.confirmed && (
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                  Confirmed
                </Badge>
              )}
            </div>
            <h3 className="mt-1.5 text-base sm:text-lg font-bold text-foreground">
              {session.title}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border hidden sm:inline-block">
            {session.id}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            <DropdownMenu
              session={session}
              isOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="flex items-start gap-2.5">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Time
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {session.time}
            </p>
            <p className="text-xs text-muted-foreground">{session.duration}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Location
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {session.location}
            </p>
          </div>
        </div>
      </div>

      {/* Note */}
      {session.note && (
        <div className="mt-4 rounded-md bg-muted/30 px-3.5 py-2.5 border border-border/80">
          <p className="text-xs text-muted-foreground leading-relaxed">{session.note}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex items-center gap-2.5 border-t border-border/80 pt-4">
        <Button
          onClick={() => addToGoogleCalendar(session)}
          size="sm"
          className="gap-2"
        >
          <Calendar className="h-3.5 w-3.5" />
          Add to Google Calendar
        </Button>
        <Button
          onClick={() => shareSession(session)}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
      </div>
    </div>
  );
}

export default function StudentExamPanel() {
  const [snapshot, setSnapshot] = useState<StudentPortalSnapshot | null>(null);

  useEffect(() => {
    const syncData = () => {
      setSnapshot(loadStudentPortalSnapshot());
    };

    syncData();

    window.addEventListener("student-portal-updated", syncData);
    window.addEventListener("student-profile-updated", syncData);
    return () => {
      window.removeEventListener("student-portal-updated", syncData);
      window.removeEventListener("student-profile-updated", syncData);
    };
  }, []);

  if (!snapshot) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Upcoming Schedule
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your confirmed exam and interview sessions
          </p>
        </div>
        <Button
          onClick={exportAllToGoogleCalendar}
          className="gap-2 self-start sm:self-auto rounded-md"
        >
          <Calendar className="h-4 w-4" />
          Add All to Google Calendar
        </Button>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 rounded-md border border-[#ffe58f] dark:border-[#594214] bg-[#fffbe6] dark:bg-[#2b2111] px-4 py-3 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] print:hidden">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#d46b08] dark:text-[#e8b339]" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#d46b08] dark:text-[#e8b339]">
            Important reminder
          </p>
          <p className="mt-0.5 text-xs text-[#d46b08]/90 dark:text-[#e8b339]/90 leading-relaxed">
            Please bring your registration confirmation and a valid national ID card or passport to each session.
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="rounded-lg border border-border/80 bg-card p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Sessions
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {MOCK_SESSIONS.length}
          </p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Confirmed
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {MOCK_SESSIONS.filter((s) => s.confirmed).length}
          </p>
        </div>
        <div className="rounded-lg border border-border/80 bg-card p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming
          </p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {MOCK_SESSIONS.length}
          </p>
        </div>
      </div>

      {/* Schedule */}
      <div className="space-y-6">
        {SESSIONS_BY_DATE.map((group) => (
          <section key={group.date} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {group.date}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {group.sessions.length} session
                  {group.sessions.length > 1 ? "s" : ""} scheduled
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {group.sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/80 pt-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          All times are displayed in your local timezone (ICT). To reschedule, contact the admissions examination office at least 48 hours in advance.
        </p>
      </footer>
    </div>
  );
}
