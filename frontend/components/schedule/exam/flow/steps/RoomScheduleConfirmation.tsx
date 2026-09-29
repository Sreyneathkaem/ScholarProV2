import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, MapPin, Users, Calendar } from "lucide-react";
import type { RoomSchedule } from "@/components/schedule/exam/flow/ExamFlowProvider";
import { scheduleService } from "@/api/service/schedule.service";

interface RoomScheduleConfirmationProps {
  selectedBatch: string;
  selectedDate: Date | undefined;
  roomSchedules: RoomSchedule[];
}

const RoomScheduleConfirmation = ({
  selectedBatch,
  selectedDate,
  roomSchedules,
}: RoomScheduleConfirmationProps) => {
  const [batchDisplayName, setBatchDisplayName] = useState<string>("");

  // Load batches to get display name
  useEffect(() => {
    const loadBatches = async () => {
      try {
        const response = await scheduleService.listBatches();
        const batchData = response.data || [];
        const validBatches = Array.isArray(batchData) ? batchData : [];

        // Find the batch display name
        const selectedBatchObj = validBatches.find(
          (b) => String(b.id) === selectedBatch
        );
        setBatchDisplayName(
          selectedBatchObj ? selectedBatchObj.batchName : selectedBatch
        );
      } catch (error) {
        console.error("Failed to load batches for display:", error);
        setBatchDisplayName(selectedBatch); // Fallback to ID
      }
    };

    if (selectedBatch) {
      loadBatches();
    }
  }, [selectedBatch]);
  // No students in wizard data - they will be assigned after exam session creation
  const mathRooms = roomSchedules.filter((room) => room.examType === "math");
  const englishRooms = roomSchedules.filter(
    (room) => room.examType === "english"
  );
  const totalCapacity = roomSchedules.reduce(
    (sum, room) => sum + room.capacity,
    0
  );
  const allCommitteeMembers = Array.from(
    new Set(roomSchedules.flatMap((room) => room.committee))
  );

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h4 className="font-semibold text-green-800">
              Ready to Create Exam Schedules
            </h4>
            <p className="text-sm text-green-700 mt-1">
              Review the room schedules below before confirming
            </p>
          </div>
        </div>
      </div>


      {/* Main Content Grid - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Batch Information */}
        <Card className="p-6 border border-border h-fit">
          <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#0F386C]" />
            Batch Information
          </h4>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <span className="text-sm text-muted-foreground">Selected Batch</span>
              <p className="text-sm font-medium text-foreground text-right">
                {batchDisplayName || selectedBatch}
              </p>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-sm text-muted-foreground">Exam Date</span>
              <p className="text-sm font-medium text-foreground text-right">
                {selectedDate ? format(selectedDate, "PPP") : "Not selected"}
              </p>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-sm text-muted-foreground">Total Capacity</span>
              <p className="text-sm font-medium text-foreground text-right">
                {totalCapacity} seats
              </p>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm text-muted-foreground">Committee Members</span>
                <Badge variant="outline" className="text-xs">
                  {allCommitteeMembers.length}
                </Badge>
              </div>
              {allCommitteeMembers.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-3">
                  {allCommitteeMembers.map((member) => (
                    <Badge 
                      key={member} 
                      variant="outline" 
                      className="text-xs bg-muted"
                    >
                      {member}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  No committee members selected
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Right Column: Room Schedules */}
        <Card className="p-6 border border-border">
          <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#0F386C]" />
            Room Schedules
          </h4>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {/* Math Rooms */}
            {mathRooms.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Mathematics
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {mathRooms.length} room{mathRooms.length === 1 ? "" : "s"}
                  </span>
                </h5>
                <div className="space-y-3">
                  {mathRooms.map((room) => (
                    <Card
                      key={room.id}
                      className="p-4 border-l-4 border-l-blue-500 bg-blue-50/30"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h6 className="font-semibold text-foreground text-sm">
                            {room.roomName}
                          </h6>
                          <Badge variant="outline" className="text-xs">
                            {room.capacity} seats
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{room.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {room.startTime} - {room.endTime}
                            </span>
                          </div>
                          
                        </div>

                        
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* English Rooms */}
            {englishRooms.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    English
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {englishRooms.length} room{englishRooms.length === 1 ? "" : "s"}
                  </span>
                </h5>
                <div className="space-y-3">
                  {englishRooms.map((room) => (
                    <Card
                      key={room.id}
                      className="p-4 border-l-4 border-l-green-500 bg-green-50/30"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h6 className="font-semibold text-foreground text-sm">
                            {room.roomName}
                          </h6>
                          <Badge variant="outline" className="text-xs">
                            {room.capacity} seats
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{room.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {room.startTime} - {room.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5" />
                            <span>
                              {room.committee.length} committee member
                              {room.committee.length === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>

                        {room.committee.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2 border-t border-green-200">
                            
                            {room.committee.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{room.committee.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {roomSchedules.length === 0 && (
              <div className="p-8 text-center border-dashed border-2 border-border rounded-lg">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Room Schedules
                </h3>
                <p className="text-sm text-muted-foreground">
                  Please go back and create room schedules before confirming.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RoomScheduleConfirmation;
