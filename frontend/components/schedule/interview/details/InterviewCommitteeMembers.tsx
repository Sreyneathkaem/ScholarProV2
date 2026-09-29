"use client";

import { Badge } from "@/components/ui/badge";

interface InterviewCommitteeMembersProps {
  members: string[];
}

export function InterviewCommitteeMembers({
  members,
}: InterviewCommitteeMembersProps) {
  return (
    <div>
      <h3 className="text-md font-semibold text-foreground mb-3">
        Committee Members
      </h3>
      <div className="flex flex-wrap gap-2">
        {members.map((member, index) => (
          <Badge
            key={index}
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1"
          >
            {member}
          </Badge>
        ))}
      </div>
    </div>
  );
}
