"use client";

import { useState } from "react";
import { Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  email: string;
  mathStatus: string;
  englishStatus: string;
}

interface ApplicantsTableProps {
  students: Student[];
  isLoading?: boolean;
}

export function ApplicantsTable({
  students,
  isLoading = false,
}: ApplicantsTableProps) {
  const [excludeDialogOpen, setExcludeDialogOpen] = useState(false);
  const [studentToExclude, setStudentToExclude] = useState<Student | null>(
    null,
  );
  const [exclusionReason, setExclusionReason] = useState("");
  const [excludedStudents, setExcludedStudents] = useState<Set<string>>(
    new Set(),
  );

  const handleExcludeClick = (student: Student) => {
    setStudentToExclude(student);
    setExclusionReason("");
    setExcludeDialogOpen(true);
  };

  const handleConfirmExclude = () => {
    if (studentToExclude && exclusionReason) {
      setExcludedStudents((prev) => new Set([...prev, studentToExclude.id]));
      setExcludeDialogOpen(false);
      setStudentToExclude(null);
      setExclusionReason("");
      toast.success(`${studentToExclude.name} has been excluded from the exam`);
    }
  };

  const visibleStudents = students.filter((s) => !excludedStudents.has(s.id));

  if (isLoading) {
    return (
      <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border/50">
            <tr>
              <th className="py-3 px-4 text-left font-semibold text-muted-foreground">
                ID
              </th>
              <th className="py-3 px-4 text-left font-semibold text-muted-foreground">
                Name
              </th>
              <th className="py-3 px-4 text-left font-semibold text-muted-foreground">
                Email
              </th>
              <th className="py-3 px-4 text-right font-semibold text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={4}
                className="py-12 px-4 text-center text-muted-foreground"
              >
                Loading...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (visibleStudents.length === 0) {
    return (
      <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border/50">
            <tr>
              <th className="py-3 px-4 text-left font-semibold text-muted-foreground">
                ID
              </th>
              <th className="py-3 px-4 text-left font-semibold text-muted-foreground">
                Name
              </th>
              <th className="py-3 px-4 text-left font-semibold text-muted-foreground">
                Email
              </th>
              <th className="py-3 px-4 text-right font-semibold text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={4}
                className="py-12 px-4 text-center text-muted-foreground"
              >
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-8 w-8 opacity-20" />
                  <span>No students found</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border/50 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border/50">
            <tr>
              <th className="py-3 px-4 text-left font-semibold text-muted-foreground">
                ID
              </th>
              <th className="py-3 px-4 text-left font-semibold text-muted-foreground">
                Name
              </th>
              <th className="py-3 px-4 text-left font-semibold text-muted-foreground">
                Email
              </th>
              {/* {examType ? (
                <th className="py-3 px-4 text-left font-semibold text-muted-foreground">
                  {examType === "math" ? "Math" : "English"}
                </th>
              ) : (
                <>
                  <th className="py-3 px-4 text-left font-semibold text-muted-foreground">Math</th>
                  <th className="py-3 px-4 text-left font-semibold text-muted-foreground">English</th>
                </>
              )} */}
              <th className="py-3 px-4 text-right font-semibold text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleStudents.map((student) => (
              <tr
                key={student.id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150"
              >
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                  {student.id}
                </td>
                <td className="py-3 px-4 font-semibold">{student.name}</td>
                <td className="py-3 px-4 text-muted-foreground">
                  {student.email}
                </td>

                <td className="py-3 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExcludeClick(student)}
                    className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Exclude
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={excludeDialogOpen} onOpenChange={setExcludeDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Exclude Student from Exam
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to exclude <b>{studentToExclude?.name}</b>{" "}
              with ID of <b>{studentToExclude?.id}</b> from the exam schedule?
            </DialogDescription>
          </DialogHeader>

          {studentToExclude && (
            <div className="space-y-3 py-1">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Reason for Exclusion
                </label>
                <Select
                  value={exclusionReason}
                  onValueChange={setExclusionReason}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Sick / Medical Issue</SelectItem>
                    <SelectItem value="withdrew">
                      Withdrew Application
                    </SelectItem>
                    <SelectItem value="deferred">
                      Deferred to Next Batch
                    </SelectItem>
                    <SelectItem value="emergency">
                      Personal Emergency
                    </SelectItem>
                    <SelectItem value="other">Other Reason</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setExcludeDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmExclude}
              disabled={!exclusionReason}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              Exclude Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
