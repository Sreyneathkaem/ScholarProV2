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
    color: string;
    bg: string;
    border: string;
    iconBg: string;
  }
> = {
  interview: {
    icon: Star,
    label: "Interview",
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200/80",
    iconBg: "bg-amber-100/70 border-amber-200 text-amber-700",
  },
  exam: {
    icon: ClipboardList,
    label: "Examination",
    color: "text-[#1e2d6b]",
    bg: "bg-[#1e2d6b]/10",
    border: "border-[#1e2d6b]/20",
    iconBg: "bg-[#1e2d6b]/10 border-[#1e2d6b]/20 text-[#1e2d6b]",
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

// Helper to parse date/time
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

// Add single session to Google Calendar
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

// Add all sessions to Google Calendar (opens multiple tabs)
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
    }, index * 300); // Stagger to avoid browser blocking
  });
};

// Export all sessions to Google Calendar (creates a single URL with multiple events)
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

// Share session
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

// Request reschedule
const requestReschedule = (session: Session) => {
  toast.info("Reschedule Request", {
    description: `To reschedule ${session.title}, please contact the examination office at exam.office@scholarpro.edu or call (555) 123-4567.`,
    duration: 6000,
    action: {
      label: "Copy Email",
      onClick: () => {
        navigator.clipboard.writeText("exam.office@scholarpro.edu");
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
      className="absolute right-0 top-10 z-20 w-64 rounded-2xl border border-slate-200/90 bg-white py-2 shadow-xl ring-1 ring-black/5 focus:outline-none"
    >
      <button
        onClick={() => {
          addToGoogleCalendar(session);
          onClose();
        }}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#1e2d6b]/5 transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e2d6b]/10 text-[#1e2d6b]">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Add to Google Calendar
          </p>
          <p className="text-xs text-slate-500">Open in Google Calendar</p>
        </div>
      </button>

      <div className="my-1.5 border-t border-slate-100" />

      <button
        onClick={() => {
          shareSession(session);
          onClose();
        }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Share2 className="h-4 w-4 text-[#1e2d6b]" />
        <span className="font-medium">Share Session</span>
      </button>

      <button
        onClick={() => {
          requestReschedule(session);
          onClose();
        }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <ExternalLink className="h-4 w-4 text-slate-400" />
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
    <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#1e2d6b]/30 print:border print:shadow-none">
      {/* Top row: type badge + menu */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl border ${config.iconBg}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold border ${config.bg} ${config.color} ${config.border}`}
              >
                {config.label}
              </span>
              {session.confirmed && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Confirmed
                </span>
              )}
            </div>
            <h3 className="mt-1.5 text-base sm:text-lg font-bold text-slate-900">
              {session.title}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60 hidden sm:inline-block">
            {session.id}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
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
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#1e2d6b]" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Time
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {session.time}
            </p>
            <p className="text-xs text-slate-500">{session.duration}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1e2d6b]" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Location
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {session.location}
            </p>
          </div>
        </div>
      </div>

      {/* Note */}
      {session.note && (
        <div className="mt-4 rounded-xl bg-slate-50/80 px-3.5 py-2.5 border border-slate-200/60">
          <p className="text-xs text-slate-600 leading-relaxed">{session.note}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex items-center gap-2.5 border-t border-slate-100 pt-4">
        <button
          onClick={() => addToGoogleCalendar(session)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1e2d6b] hover:bg-[#162055] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-[#1e2d6b]/20 transition-all active:scale-[0.98]"
        >
          <Calendar className="h-3.5 w-3.5" />
          Add to Google Calendar
        </button>
        <button
          onClick={() => shareSession(session)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          <Share2 className="h-3.5 w-3.5 text-slate-500" />
          Share
        </button>
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-900">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[#1e2d6b]">
              <Calendar className="size-4" />
              <span className="text-xs font-bold tracking-widest uppercase">
                Examination & Schedule
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Upcoming Schedule
            </h1>
            <p className="text-sm text-slate-500">
              Your confirmed exam and interview sessions
            </p>
          </div>
          <button
            onClick={exportAllToGoogleCalendar}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e2d6b] hover:bg-[#162055] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1e2d6b]/20 transition-all active:scale-[0.98] self-start sm:self-auto"
          >
            <Calendar className="h-4 w-4" />
            Add All to Google Calendar
          </button>
        </header>

        {/* Notice */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4.5 py-4 shadow-sm print:hidden">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              Important reminder
            </p>
            <p className="mt-0.5 text-sm text-amber-800 leading-relaxed">
              Please bring your registration confirmation and a valid student ID to each session.
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Sessions
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
              {MOCK_SESSIONS.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Confirmed
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-600">
              {MOCK_SESSIONS.filter((s) => s.confirmed).length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Upcoming
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-bold text-[#1e2d6b]">
              {MOCK_SESSIONS.length}
            </p>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-8">
          {SESSIONS_BY_DATE.map((group) => (
            <section key={group.date} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1e2d6b] text-white shadow-sm shadow-[#1e2d6b]/20">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {group.date}
                  </h2>
                  <p className="text-xs font-medium text-slate-500">
                    {group.sessions.length} session
                    {group.sessions.length > 1 ? "s" : ""} scheduled
                  </p>
                </div>
              </div>
              <div className="space-y-3.5">
                {group.sessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 pt-6">
          <p className="text-xs text-slate-500 leading-relaxed">
            All times are displayed in your local timezone. To reschedule, contact the examination office at least 48 hours in advance.
          </p>
        </footer>
      </div>
    </div>
  );
}
