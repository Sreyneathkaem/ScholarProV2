"use client";

import { Applicant } from "@/types/applicant";

interface Props {
  student: Applicant | null;
  open: boolean;
  onClose: () => void;
}

export default function StudentDetailsModal({ student, open, onClose }: Props) {
  if (!open || !student) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-card w-[450px] p-6 rounded-xl shadow-xl">
        <div className="flex justify-between">
          <p className="text-lg font-semibold">{student.nameEn}</p>
          <button onClick={onClose} className="text-muted-foreground">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-1">
          <p>
            <strong>Student ID:</strong> {student.number}
          </p>
          <p>
            <strong>Gender:</strong> {student.gender}
          </p>
          <p>
            <strong>Major:</strong> {student.major}
          </p>
          <p>
            <strong>Province:</strong> {student.province}
          </p>
          <p>
            <strong>Batch:</strong> {student.batch}
          </p>
          <p>
            <strong>Applied:</strong>{" "}
            {student.dateApplied?.toLocaleDateString()}
          </p>
        </div>

        <hr className="my-4" />

        <p className="font-semibold">Contact Information</p>
        <p>Email: {student.email}</p>
        <p>Phone: {student.phone}</p>
      </div>
    </div>
  );
}
