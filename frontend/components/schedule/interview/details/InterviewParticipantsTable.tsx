"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3, Save, X, Search } from "lucide-react";
import { toast } from "sonner";

interface Participant {
  id: string;
  name: string;
  major?: string;
  department?: string;
  timeSlot: string;
}

interface InterviewParticipantsTableProps {
  participants: Participant[];
  onParticipantsUpdate?: (participants: Participant[]) => void;
}

export function InterviewParticipantsTable({
  participants: initialParticipants,
  onParticipantsUpdate,
}: InterviewParticipantsTableProps) {
  const [isEditingTimeSlots, setIsEditingTimeSlots] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editedParticipants, setEditedParticipants] =
    useState(initialParticipants);

  const filteredParticipants = editedParticipants.filter(
    (participant) =>
      participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      participant.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (participant.major &&
        participant.major.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleTimeSlotChange = (participantId: string, newTimeSlot: string) => {
    setEditedParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId ? { ...p, timeSlot: newTimeSlot } : p,
      ),
    );
  };

  const handleSaveTimeSlots = () => {
    setIsEditingTimeSlots(false);
    if (onParticipantsUpdate) {
      onParticipantsUpdate(editedParticipants);
    }
    toast.success("Time slots updated successfully!");
  };

  const handleCancelEdit = () => {
    setIsEditingTimeSlots(false);
    setEditedParticipants(initialParticipants);
    toast.info("Changes cancelled");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-semibold text-foreground">
          Interview Participants ({editedParticipants.length} students)
        </h3>

        <div className="flex items-center justify-end">
          <div className="flex items-center gap-3 mr-4">
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Search participants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingTimeSlots ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingTimeSlots(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit Time Slots
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveTimeSlots}
                  className="bg-[#0F386C] text-white hover:bg-[#334155] flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden border border-border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full table-fixed">
            <thead className="bg-muted">
              <tr>
                <th className="w-12 px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  #
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Major
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Department
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Time Slot
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map((participant, index) => (
                  <tr
                    key={participant.id}
                    className="hover:bg-muted transition-all duration-300 ease-in-out"
                  >
                    <td className="w-12 px-4 py-4 text-sm text-foreground font-medium">
                      {index + 1}
                    </td>
                    <td
                      className="px-2 py-4 text-sm text-foreground truncate"
                      title={participant.id}
                    >
                      {participant.id}
                    </td>
                    <td
                      className="min-w-0 px-2 py-4 text-sm font-medium text-foreground"
                      title={participant.name}
                    >
                      {participant.name}
                    </td>
                    <td
                      className="px-2 py-4 text-sm text-muted-foreground truncate"
                      title={participant.major}
                    >
                      {participant.major}
                    </td>
                    <td
                      className="px-2 py-4 text-sm text-muted-foreground truncate"
                      title={participant.department}
                    >
                      {participant.department}
                    </td>
                    <td className="px-2 py-4">
                      {isEditingTimeSlots ? (
                        <Input
                          value={participant.timeSlot}
                          onChange={(e) =>
                            handleTimeSlotChange(participant.id, e.target.value)
                          }
                          className="w-full text-sm transition-all duration-200"
                          placeholder="09:00 - 09:15"
                        />
                      ) : (
                        <span
                          className="text-sm text-muted-foreground truncate block"
                          title={participant.timeSlot}
                        >
                          {participant.timeSlot}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    {searchQuery
                      ? `No participants found matching "${searchQuery}"`
                      : "No participants available"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
