"use client";

import { forwardRef, useContext, useImperativeHandle, useState } from "react";
import {
  ExamFlowContext,
  type RoomSchedule,
} from "@/components/schedule/exam/flow/ExamFlowProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MapPin, Clock, Users, X } from "lucide-react";
import { toast } from "sonner";
import type { Committee } from "@/types/committee";

interface RoomScheduleCreatorProps {
  availableCommittees: Committee[];
}

export interface RoomScheduleCreatorRef {
  handleCreateRoomSchedule: () => Promise<boolean>;
}

const RoomScheduleCreator = forwardRef<
  RoomScheduleCreatorRef,
  RoomScheduleCreatorProps
>(({ availableCommittees }, ref) => {
  const examFlowContext = useContext(ExamFlowContext);

  if (!examFlowContext) {
    throw new Error(
      "RoomScheduleCreator must be used within an ExamFlowProvider",
    );
  }

  const {
    selectedRooms,
    setSelectedRooms,
    roomSchedules,
    setRoomSchedules,
    setIsRoomConfigValid,
    selectedBatch,
    selectedDate,
    roomForm,
    setRoomForm,
  } = examFlowContext;

  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RoomSchedule>>({});
  const [editCommitteeSearchQuery, setEditCommitteeSearchQuery] = useState("");
  const [isEditCommitteeOpen, setIsEditCommitteeOpen] = useState(false);

  const timeOptions = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
  ];

  const getFilteredCommitteeMembers = () => {
    return (availableCommittees || []).filter((member) =>
      member.name
        .toLowerCase()
        .includes(roomForm.committeeSearchQuery.toLowerCase()),
    );
  };

  const getFilteredCommitteeMembersForEdit = () => {
    return (availableCommittees || []).filter((member) =>
      member.name
        .toLowerCase()
        .includes(editCommitteeSearchQuery.toLowerCase()),
    );
  };

  const handleCommitteeToggle = (memberName: string) => {
    const updatedCommittee = roomForm.committee.includes(memberName)
      ? roomForm.committee.filter((m) => m !== memberName)
      : [...roomForm.committee, memberName];
    setRoomForm((prev) => ({ ...prev, committee: updatedCommittee }));
  };

  const handleRemoveCommitteeMember = (member: string) => {
    setRoomForm((prev) => ({
      ...prev,
      committee: prev.committee.filter((m) => m !== member),
    }));
  };

  const validateForm = () => {
    const {
      roomName,
      capacity,
      location,
      examType,
      startTime,
      endTime,
      committee,
    } = roomForm;

    if (roomName.trim().length < 3) {
      toast.error("Room name must be at least 3 characters");
      return false;
    }
    if (roomName.trim().length > 100) {
      toast.error("Room name must be at most 100 characters");
      return false;
    }
    if (!capacity || Number.parseInt(capacity, 10) <= 0) {
      toast.error("Please enter valid room capacity");
      return false;
    }
    if (location.trim().length < 3) {
      toast.error("Location must be at least 3 characters");
      return false;
    }
    if (location.trim().length > 100) {
      toast.error("Location must be at most 100 characters");
      return false;
    }
    if (!examType) {
      toast.error("Please select exam type");
      return false;
    }
    if (!startTime) {
      toast.error("Please select start time");
      return false;
    }
    if (!endTime) {
      toast.error("Please select end time");
      return false;
    }
    if (startTime >= endTime) {
      toast.error("Start time must be before end time");
      return false;
    }
    if (committee.length === 0) {
      toast.error("Please select at least one committee member");
      return false;
    }

    return true;
  };

  const handleCreateRoomSchedule = async () => {
    if (!validateForm()) return false;

    console.group("🔍 Creating Room Schedule");
    console.log("selectedBatch from context:", selectedBatch);
    console.log("selectedDate from context:", selectedDate);
    console.log("roomForm:", roomForm);

    if (!selectedDate) {
      toast.error("Exam date is missing. Please go back and select a date.");
      console.error("❌ No date selected in context");
      return false;
    }

    try {
      const newRoomSchedule: RoomSchedule = {
        id: `room-${Date.now()}`,
        roomName: roomForm.roomName,
        capacity: Number.parseInt(roomForm.capacity, 10),
        location: roomForm.location,
        examType: roomForm.examType as "math" | "english",
        startTime: roomForm.startTime,
        endTime: roomForm.endTime,
        committee: [...roomForm.committee],
        createdAt: new Date(),
      };

      setRoomSchedules([...roomSchedules, newRoomSchedule]);

      const roomNames = [...selectedRooms, roomForm.roomName];
      setSelectedRooms(roomNames);
      setIsRoomConfigValid(true);

      setRoomForm({
        roomName: "",
        capacity: "",
        location: "",
        examType: "",
        startTime: "",
        endTime: "",
        committee: [],
        committeeSearchQuery: "",
        isCommitteeOpen: false,
      });

      toast.success("Room schedule created successfully!", {
        description: `${roomForm.roomName} added to the schedule`,
      });

      console.log("✅ Room schedule created locally:", newRoomSchedule);
      console.groupEnd();
      return true;
    } catch (error) {
      console.error("❌ Error creating room schedule:", error);
      toast.error("Failed to create room schedule");
      console.groupEnd();
      return false;
    }
  };

  useImperativeHandle(ref, () => ({
    handleCreateRoomSchedule,
  }));

  // const handleDeleteRoomSchedule = (roomId: string) => {
  //   const roomToDelete = roomSchedules.find((room) => room.id === roomId);
  //   if (!roomToDelete) return;

  //   setRoomSchedules((prev) => prev.filter((room) => room.id !== roomId));

  //   const updatedRoomNames = selectedRooms.filter(
  //     (name) => name !== roomToDelete.roomName,
  //   );
  //   setSelectedRooms(updatedRoomNames);
  //   setIsRoomConfigValid(updatedRoomNames.length > 0);

  //   toast.success(`Room schedule deleted: ${roomToDelete.roomName}`);
  // };

  // const startEditing = (room: RoomSchedule) => {
  //   setEditingRoomId(room.id);
  //   setEditCommitteeSearchQuery("");
  //   setIsEditCommitteeOpen(false);
  //   setEditForm({
  //     roomName: room.roomName,
  //     capacity: room.capacity,
  //     location: room.location,
  //     examType: room.examType,
  //     startTime: room.startTime,
  //     endTime: room.endTime,
  //     committee: [...room.committee],
  //   });
  // };

  const handleUpdateRoom = () => {
    if (
      !editForm.roomName?.trim() ||
      !editForm.capacity ||
      editForm.capacity <= 0 ||
      !editForm.location?.trim() ||
      !editForm.examType ||
      !editForm.startTime ||
      !editForm.endTime ||
      !editForm.committee?.length
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editForm.startTime >= editForm.endTime) {
      toast.error("Start time must be before end time");
      return;
    }

    // // ✅ FIX: Create the updated room explicitly with all required properties
    // setRoomSchedules((prev) =>
    //   prev.map((room) => {
    //     if (room.id === editingRoomId) {
    //       // Explicitly construct the updated room with all RoomSchedule properties
    //       const updatedRoom: RoomSchedule = {
    //         id: room.id, // Keep original id
    //         roomName: editForm.roomName!,
    //         capacity: editForm.capacity!,
    //         location: editForm.location!,
    //         examType: editForm.examType as "math" | "english",
    //         startTime: editForm.startTime!,
    //         endTime: editForm.endTime!,
    //         committee: [...editForm.committee!],
    //         createdAt: room.createdAt, // Keep original createdAt
    //       };
    //       return updatedRoom;
    //     }
    //     return room;
    //   }),
    // );

    setEditingRoomId(null);
    setEditForm({});
    toast.success("Room schedule updated successfully");
  };
  return (
    <div className="space-y-6">
      {/* Warning Messages */}
      {(!selectedBatch || !selectedDate) && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
          {!selectedBatch && (
            <p className="text-sm text-yellow-800">
              ⚠️ No batch selected. Please go back and select a batch first.
            </p>
          )}
          {!selectedDate && (
            <p className="text-sm text-yellow-800">
              ⚠️ No date selected. Please go back and select an exam date first.
            </p>
          )}
        </div>
      )}

      {/* Create New Room Schedule Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Create Room Schedule
            </h3>
          </div>

          {/* Room Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Room Name
              </label>
              <Input
                value={roomForm.roomName}
                onChange={(e) =>
                  setRoomForm((prev) => ({
                    ...prev,
                    roomName: e.target.value,
                  }))
                }
                placeholder="e.g., Math Room A"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Capacity
              </label>
              <Input
                type="number"
                value={roomForm.capacity}
                onChange={(e) =>
                  setRoomForm((prev) => ({
                    ...prev,
                    capacity: e.target.value,
                  }))
                }
                placeholder="e.g., 30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Location
              </label>
              <Input
                value={roomForm.location}
                onChange={(e) =>
                  setRoomForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                placeholder="e.g., Building A, Floor 1"
              />
            </div>
          </div>

          {/* Exam Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Exam Type
              </label>
              <Select
                value={roomForm.examType}
                onValueChange={(value: "math" | "english") =>
                  setRoomForm((prev) => ({ ...prev, examType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">Mathematics</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Start Time
              </label>
              <Select
                value={roomForm.startTime}
                onValueChange={(value) =>
                  setRoomForm((prev) => ({ ...prev, startTime: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                End Time
              </label>
              <Select
                value={roomForm.endTime}
                onValueChange={(value) =>
                  setRoomForm((prev) => ({ ...prev, endTime: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Committee Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Committee Assignment
            </label>
            <Popover
              open={roomForm.isCommitteeOpen}
              onOpenChange={(open) =>
                setRoomForm((prev) => ({ ...prev, isCommitteeOpen: open }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-auto min-h-10"
                >
                  {roomForm.committee.length > 0 ? (
                    <span className="text-sm">
                      {roomForm.committee.length} member
                      {roomForm.committee.length > 1 ? "s" : ""} selected
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Select committee members
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <div className="flex flex-col">
                  <div className="p-3 border-b border-border">
                    <Input
                      placeholder="Search committee members..."
                      value={roomForm.committeeSearchQuery}
                      onChange={(e) =>
                        setRoomForm((prev) => ({
                          ...prev,
                          committeeSearchQuery: e.target.value,
                        }))
                      }
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="max-h-[280px] overflow-y-auto p-2">
                    {getFilteredCommitteeMembers().length > 0 ? (
                      <div className="space-y-1">
                        {getFilteredCommitteeMembers().map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center space-x-2 rounded-md px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => handleCommitteeToggle(member.name)}
                          >
                            <input
                              type="checkbox"
                              checked={roomForm.committee.includes(member.name)}
                              onChange={() => {}}
                              className="w-4 h-4 text-[#0F386C] border-border rounded focus:ring-[#0F386C] cursor-pointer"
                            />
                            <label className="text-sm font-medium leading-none cursor-pointer flex-1">
                              {member.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        No committee members found
                      </div>
                    )}
                  </div>
                  {roomForm.committee.length > 0 && (
                    <div className="p-3 border-t border-border bg-muted">
                      <p className="text-xs text-muted-foreground">
                        {roomForm.committee.length} member
                        {roomForm.committee.length > 1 ? "s" : ""} selected
                      </p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {roomForm.committee.length > 0 && (
              <div className="mt-3 p-3 bg-muted rounded-lg border border-border">
                <div className="flex flex-wrap gap-2">
                  {roomForm.committee.map((member) => (
                    <Badge
                      key={member}
                      variant="outline"
                      className="bg-card text-foreground border-border hover:bg-muted pl-2.5 pr-1.5 py-1"
                    >
                      <span className="text-xs">{member}</span>
                      <button
                        onClick={() => handleRemoveCommitteeMember(member)}
                        className="ml-1.5 hover:bg-accent rounded-full p-0.5 transition-colors"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Created Room Schedules */}
      {roomSchedules.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Created Room Schedules
          </h3>

          <div className="space-y-4">
            {roomSchedules.map((room) => (
              <Card key={room.id} className="p-4 border border-border">
                {editingRoomId === room.id ? (
                  // Edit Mode - Full Form
                  <div className="space-y-4">
                    {/* Room Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Room Name
                        </label>
                        <Input
                          value={editForm.roomName || ""}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              roomName: e.target.value,
                            }))
                          }
                          placeholder="Room name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Capacity
                        </label>
                        <Input
                          type="number"
                          value={editForm.capacity || ""}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              capacity: Number.parseInt(e.target.value, 10),
                            }))
                          }
                          placeholder="Capacity"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Location
                        </label>
                        <Input
                          value={editForm.location || ""}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              location: e.target.value,
                            }))
                          }
                          placeholder="Location"
                        />
                      </div>
                    </div>

                    {/* Exam Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Exam Type
                        </label>
                        <Select
                          value={editForm.examType || ""}
                          onValueChange={(value: "math" | "english") =>
                            setEditForm((prev) => ({
                              ...prev,
                              examType: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select exam type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="math">Mathematics</SelectItem>
                            <SelectItem value="english">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Start Time
                        </label>
                        <Select
                          value={editForm.startTime || ""}
                          onValueChange={(value) =>
                            setEditForm((prev) => ({
                              ...prev,
                              startTime: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select start time" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          End Time
                        </label>
                        <Select
                          value={editForm.endTime || ""}
                          onValueChange={(value) =>
                            setEditForm((prev) => ({ ...prev, endTime: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select end time" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Committee Selection in Edit Mode */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Committee Assignment
                      </label>
                      <Popover
                        open={isEditCommitteeOpen}
                        onOpenChange={setIsEditCommitteeOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-auto min-h-10"
                          >
                            {editForm.committee &&
                            editForm.committee.length > 0 ? (
                              <span className="text-sm">
                                {editForm.committee.length} member
                                {editForm.committee.length > 1 ? "s" : ""}{" "}
                                selected
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Select committee members
                              </span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <div className="flex flex-col">
                            <div className="p-3 border-b border-border">
                              <Input
                                placeholder="Search committee members..."
                                value={editCommitteeSearchQuery}
                                onChange={(e) =>
                                  setEditCommitteeSearchQuery(e.target.value)
                                }
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="max-h-[280px] overflow-y-auto p-2">
                              {getFilteredCommitteeMembersForEdit().length >
                              0 ? (
                                <div className="space-y-1">
                                  {getFilteredCommitteeMembersForEdit().map(
                                    (member) => (
                                      <div
                                        key={member.id}
                                        className="flex items-center space-x-2 rounded-md px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
                                        onClick={() => {
                                          const currentCommittee =
                                            editForm.committee || [];
                                          const updatedCommittee =
                                            currentCommittee.includes(
                                              member.name,
                                            )
                                              ? currentCommittee.filter(
                                                  (m) => m !== member.name,
                                                )
                                              : [
                                                  ...currentCommittee,
                                                  member.name,
                                                ];
                                          setEditForm((prev) => ({
                                            ...prev,
                                            committee: updatedCommittee,
                                          }));
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={
                                            editForm.committee?.includes(
                                              member.name,
                                            ) || false
                                          }
                                          onChange={() => {}}
                                          className="w-4 h-4 text-[#0F386C] border-border rounded focus:ring-[#0F386C] cursor-pointer"
                                        />
                                        <label className="text-sm font-medium leading-none cursor-pointer flex-1">
                                          {member.name}
                                        </label>
                                      </div>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-6 text-sm text-muted-foreground">
                                  No committee members found
                                </div>
                              )}
                            </div>
                            {editForm.committee &&
                              editForm.committee.length > 0 && (
                                <div className="p-3 border-t border-border bg-muted">
                                  <p className="text-xs text-muted-foreground">
                                    {editForm.committee.length} member
                                    {editForm.committee.length > 1
                                      ? "s"
                                      : ""}{" "}
                                    selected
                                  </p>
                                </div>
                              )}
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* Selected Committee Members Display in Edit */}
                      {editForm.committee && editForm.committee.length > 0 && (
                        <div className="mt-3 p-3 bg-muted rounded-lg border border-border">
                          <div className="flex flex-wrap gap-2">
                            {editForm.committee.map((member) => (
                              <Badge
                                key={member}
                                variant="outline"
                                className="bg-card text-foreground border-border hover:bg-muted pl-2.5 pr-1.5 py-1"
                              >
                                <span className="text-xs">{member}</span>
                                <button
                                  onClick={() => {
                                    const updatedCommittee =
                                      editForm.committee?.filter(
                                        (m) => m !== member,
                                      ) || [];
                                    setEditForm((prev) => ({
                                      ...prev,
                                      committee: updatedCommittee,
                                    }));
                                  }}
                                  className="ml-1.5 hover:bg-accent rounded-full p-0.5 transition-colors"
                                  type="button"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        size="sm"
                        onClick={handleUpdateRoom}
                        className="bg-[#0F386C] text-white hover:bg-[#334155]"
                      >
                        Save Changes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingRoomId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          className={
                            room.examType === "math"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }
                        >
                          {room.examType === "math" ? "Mathematics" : "English"}
                        </Badge>
                        <h4 className="font-semibold text-foreground">
                          {room.roomName}
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        {/* <Button
                          size="sm"
                          className="bg-white text-muted-foreground hover:bg-accent"
                          onClick={() => startEditing(room)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-white text-red-500 hover:bg-accent"
                          onClick={() => handleDeleteRoomSchedule(room.id)}
                        >
                          <Trash2 className="h-4 w-4 font-semibold" />
                        </Button> */}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {room.location} • {room.capacity} seats
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {room.startTime} - {room.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {room.committee.length} committee member
                          {room.committee.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {room.committee.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {room.committee.map((member) => (
                          <Badge
                            key={member}
                            variant="outline"
                            className="text-xs"
                          >
                            {member}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

RoomScheduleCreator.displayName = "RoomScheduleCreator";

export default RoomScheduleCreator;
