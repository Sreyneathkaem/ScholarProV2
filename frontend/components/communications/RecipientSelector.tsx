"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { UserCheck, UserX, Award, GraduationCap, UserCog } from "lucide-react";

export type RecipientGroup =
  | "shortlisted"
  | "rejected"
  | "awarded-25"
  | "awarded-50"
  | "awarded-75"
  | "awarded-75-assistantship"
  | "awarded-100"
  | "committee";

interface RecipientSelectorProps {
  selectedGroup: RecipientGroup;
  onGroupChange: (group: RecipientGroup) => void;
  recipientCounts: Record<RecipientGroup, number>;
}

const RECIPIENT_GROUPS = [
  {
    id: "shortlisted" as RecipientGroup,
    label: "Shortlisted Applicants",
    description: "Applicants selected for next stage",
    icon: UserCheck,
    color: "text-blue-600",
  },
  {
    id: "rejected" as RecipientGroup,
    label: "Rejected Applicants",
    description: "Applicants not selected",
    icon: UserX,
    color: "text-red-600",
  },
  {
    id: "awarded-25" as RecipientGroup,
    label: "25% Scholarship Recipients",
    description: "Students awarded 25% tuition coverage",
    icon: Award,
    color: "text-green-600",
  },
  {
    id: "awarded-50" as RecipientGroup,
    label: "50% Scholarship Recipients",
    description: "Students awarded 50% tuition coverage",
    icon: Award,
    color: "text-green-600",
  },
  {
    id: "awarded-75" as RecipientGroup,
    label: "75% Scholarship Recipients",
    description: "Students awarded 75% tuition coverage",
    icon: Award,
    color: "text-green-600",
  },
  {
    id: "awarded-75-assistantship" as RecipientGroup,
    label: "75% + Assistantship Recipients",
    description: "Students with 75% scholarship plus assistantship",
    icon: GraduationCap,
    color: "text-purple-600",
  },
  {
    id: "awarded-100" as RecipientGroup,
    label: "100% Scholarship Recipients",
    description: "Students with full tuition coverage",
    icon: Award,
    color: "text-amber-600",
  },
  {
    id: "committee" as RecipientGroup,
    label: "Committee Members",
    description: "Internal committee and staff",
    icon: UserCog,
    color: "text-muted-foreground",
  },
];

export function RecipientSelector({
  selectedGroup,
  onGroupChange,
  recipientCounts,
}: RecipientSelectorProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Select Recipients</h3>
          <p className="text-sm text-muted-foreground">
            Choose the group of recipients for this email
          </p>
        </div>

        <RadioGroup value={selectedGroup} onValueChange={onGroupChange}>
          <div className="space-y-3">
            {RECIPIENT_GROUPS.map((group) => {
              const Icon = group.icon;
              const count = recipientCounts[group.id] || 0;

              return (
                <div
                  key={group.id}
                  className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => onGroupChange(group.id)}
                >
                  <RadioGroupItem value={group.id} id={group.id} />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={group.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className={`h-4 w-4 ${group.color}`} />
                      <span className="font-medium">{group.label}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {count}
                      </Badge>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {group.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </RadioGroup>
      </div>
    </Card>
  );
}
